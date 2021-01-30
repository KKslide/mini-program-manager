const fs = require("fs");
const wxData = require("../lib/wxData");
const axios = require("axios");
const util = require("../util/util");
let access_token = "";
/*
    每次读取json文件, 判断access_token字段是否存在, 并且判断record_time字段时常是否超出2小时
    -> 未超出: 使用它
    -> 超出: 重新请求并存储
*/
const getTokenString = function (callback) {
    fs.readFile("./lib/access_token.json", (err, data) => {
        if (err) {
            console.log(err);
        }
        else {
            let json_data = JSON.parse(data);
            let cur_unix_time = Math.round(new Date().getTime() / 1000); // 获取当前unix时间戳
            if (json_data["access_token"] != "" && (cur_unix_time - json_data["record_time"] < 7200)) {
                access_token = json_data["access_token"];
                if (callback) callback();
            }
            else {
                // 重新获取AccessToken并存储
                util.getAccessToken().then(response => {
                    access_token = response.access_token; // 记录access_token
                    fs.writeFile("./lib/access_token.json", JSON.stringify({
                        "access_token": access_token,
                        "record_time": cur_unix_time // 记录当前获取到数据的unix时间
                    }), err => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('文件写入成功!!!');
                            if (callback) callback()
                        }
                    })
                })
            }
        }
    })
}

/**
 * HTTP API请求函数
 * @param {String} type apiURL参数
 * @param {String} query 查询语句
 * @param {String} collection 需要查询的集合 或者 云函数参数
 * @param {Array} searchObj 查询条件
 */
const axiosHandler = function (type, query, collection, searchObj) {
    if (type == "invokecloudfunction") { // 调用云函数
        return axios({
            url: `https://api.weixin.qq.com/tcb/${type}?access_token=${access_token}&env=${wxData.env}&name=getHandler`,
            data: {
                collection: `${collection}`,
                pageNo: Number(searchObj.pageNo),
                pageSize: Number(searchObj.pageSize),
                title: searchObj.title,
                category: searchObj.category,
                rangeTime: searchObj.rangeTime
            },
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        })
    } else { // 调用其他httpAPI
        return axios({
            url: `https://api.weixin.qq.com/tcb/${type}?access_token=${access_token}`,
            data: {
                env: `${wxData.env}`,
                query: `${query}`
            },
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        })
    }
}

/**
 * 1- 设置前端是否读取信息
 */
module.exports.readComment = function (req, res) {
    let id = req.body.id || req.query.id;
    let query = `db.collection("comment").where({_id:"${id}"}).update({data:{auth_is_read:1}})`;
    getTokenString(_ => {
        axiosHandler("databaseupdate", query)
            .then(response => {
                if (response.data.errmsg == "ok") {
                    res.json({ code: 1 })
                } else {
                    res.json({ code: 0, msg: response.data.errmsg })
                }
            }).catch(err => {
                console.log(err);
            })
    })
}

/**
 * 2- 更新评论回复内容
 */
module.exports.replyComment = function (req, res) {
    let id = req.body.id || req.query.id; // 评论id
    let openid = req.body.openid || req.query.openid; // 用户openid
    let content_title = req.body.content_title || req.query.content_title; // 文章标题
    console.log(content_title);
    let content_id = req.body.content_id || req.query.content_id; // 文章id
    let originComment = req.body.com_content || req.query.com_content; // 用户评论内容
    let curAuthResponse = req.body.authResponse || req.query.authResponse || []; // 作者回复
    // console.log(curAuthResponse);
    // console.log('------------------------------');
    let query = `db.collection("comment").where({_id:"${id}"}).update({
        data:{
            auth_response: ${JSON.stringify(curAuthResponse)}
        }
    })`;
    getTokenString(_ => {
        axiosHandler('databaseupdate', query)
            .then(response => {
                // console.log(response.data);
                if (response.data.errcode == 0 && response.data.errmsg == 'ok' && response.data.modified == 1) {
                    // res.json({ code: 1 })
                    return response
                } else {
                    res.json({ code: 0, msg: response.data.errmsg })
                }
            })
            .then(_ => {
                /**
                 * 推送回复订阅消息
                 */
                axios({
                    url: `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${access_token}`,
                    method: "post",
                    data: {
                        "touser": `${openid}`, // 用户openid
                        "template_id": "U7isDoq7uSGJ4f59-zEL5nYwUgofPQ_n2xR_ZL1JA_s", // 模板ID
                        "page": `/pages/public/content/content?contentID=${content_id}`, // 跳转去详情页
                        "miniprogram_state": "formal", // 所在环境 develop-开发版; trial-体验版; formal-正式版;
                        "lang": "zh_CN", // 语言环境
                        "data": {
                            "thing1": { // 文章标题
                                "value": `${content_title.length >= 20 ? content_title.slice(0, 17) + '...' : content_title}`
                            },
                            "thing2": { // 评论内容
                                "value": `${originComment.length >= 20 ? originComment.slice(0, 17) + '...' : originComment}`
                            },
                            "thing3": { // 回复内容
                                "value": `${curAuthResponse[0].reply_content.length >= 20 ? curAuthResponse[0].reply_content.slice(0, 17) : curAuthResponse[0].reply_content}`
                            },
                            "time4": { // 回复时间
                                "value": util.getNow()
                            }
                        }
                    }
                }).then(subscribeRes => {
                    console.log("返回值: ", subscribeRes.data);
                    switch (subscribeRes.data.errcode) {
                        case 40003:
                            res.json({
                                code: 40003,
                                errMsg: "回复成功! 无法推送! 因为touser字段openid为空或者不正确"
                            })
                            break;
                        case 40037:
                            res.json({
                                code: 40037,
                                errMsg: "回复成功! 无法推送! 因为订阅模板id为空不正确"
                            })
                            break;
                        case 43101:
                            res.json({
                                code: 43101,
                                errMsg: "回复成功! 无法推送! 因为用户拒绝接受消息"
                            })
                            break;
                        case 47003:
                            res.json({
                                code: 47003,
                                errMsg: "回复成功! 无法推送! 因为模板参数不准确"
                            })
                            break;
                        case 41030:
                            res.json({
                                code: 40003,
                                errMsg: "回复成功! 无法推送! 因为page路径不正确"
                            })
                            break;
                        default:
                            res.json({
                                code: 1,
                                errMsg: "回复成功! 用户已成功接收回复订阅消息!"
                            })
                            break;
                    }
                }).catch(subscribeErr => {
                    console.log("错误码: ", subscribeErr);
                })
            })
            .catch(err => {
                console.log(err);
            })
    })
}
