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
 */
const axiosHandler = function (type, query) {
    if (type == "invokecloudfunction") { // 调用云函数
        return axios({
            url: `https://api.weixin.qq.com/tcb/${type}?access_token=${access_token}&env=${wxData.env}&name=getHandler`,
            data: {
                collection: `getUnRead`
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
 * 1- 获取留言列表
 */
module.exports.getMSG = function (req, res) {
    let pageNo = req.query.pageNo || req.body.pageNo || 1,
        pageSize = req.query.pageSize || req.body.pageSize || 5,
        dataTotal = 0;
    let query1 = `db.collection("message").count()`;
    let query2 = `db.collection("message").aggregate().sort({addtime:-1}).skip(${(pageNo - 1) * pageSize}).limit(${pageSize}).end()`;
    getTokenString(_ => {
        axiosHandler('databasecount', query1)
            .then(res1 => {
                if (res1.data.errcode != 0 || res1.data.errmsg != "ok") {
                    return res.json({ code: 1, msg: "接口查询错误,请查看后台报错" })
                }
                dataTotal = res1.data.count;
                axiosHandler('databaseaggregate', query2)
                    .then(msgResponse => {
                        if (msgResponse.data.errcode == 0 && msgResponse.data.errmsg == "ok") {
                            res.json({
                                messages: msgResponse.data.data,
                                total: dataTotal, // 数据总数
                                pages: Math.ceil(dataTotal / pageSize), // 页总数
                            });
                        }
                    }).catch(msgErr => {
                        console.log(msgErr);
                        res.json({ code: 1, msg: "接口查询错误,请查看后台报错" })
                    })
            })
            .catch(err1 => {
                console.log(err1);
                res.json({ code: 1, msg: "接口查询错误,请查看后台报错" })
            })
    })
}

/**
 * 2- 删除留言
 */
module.exports.delMSG = function (req, res) {
    let id = req.body.id || req.query.id || "";
    if (id == "") {
        return res.json({ code: 1, msg: "删除失败!" })
    }
    let query = `db.collection("message").doc('${id}').remove()`;
    getTokenString(_ => {
        axiosHandler('databasedelete', query)
            .then(response => {
                if (response.data.errmsg == "ok") {
                    res.json({ code: 0, msg: "删除成功!" })
                }
            }).catch(err => {
                console.log(err);
            })
    })
}

/**
 * 3-更新留言读取状态
 */
module.exports.readMSG = function (req, res) {
    let id = req.body.id || req.query.id;
    let query = `db.collection("message").where({_id:"${id}"}).update({data:{auth_is_read:1}})`;
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
 * 4- 更新留言回复内容
 */
module.exports.replyMSG = function (req, res) {
    let id = req.body.msgId || req.query.msgId; // 评论id
    let openid = req.body.openid || req.query.openid; // 用户openid
    let replyContent = req.body.replyContent || req.query.replyContent; // 用户评论内容
    let curAuthResponse = req.body.authResponse || req.query.authResponse || []; // 作者回复
    // console.log(replyContent);
    // return
    // console.log('------------------------------');
    let query = `db.collection("message").where({_id:"${id}"}).update({
        data:{
            auth_response: ${JSON.stringify(curAuthResponse)}
        }
    })`;
    getTokenString(_ => {
        axiosHandler('databaseupdate', query)
            .then(response => {
                console.log(response.data);
                if (response.data.errcode == 0 && response.data.errmsg == 'ok' && response.data.modified == 1) {
                    // res.json({ code: 1 })
                    return response
                } else {
                    res.json({ code: 0, errMsg: response.data.errmsg })
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
                        "template_id": "SFM32Vr2jBXvHar82Otokx2xKUxaWIqt1sQj6pKa6sE", // 模板ID
                        "page": `/pages/5-contact/contact`, // 跳转去详情页
                        "miniprogram_state": "developer", // 所在环境 develop-开发版; trial-体验版; formal-正式版;
                        "lang": "zh_CN", // 语言环境
                        "data": {
                            "thing2": { // 回复人 - 就写自己吧 KK
                                "value": `KK_(+.-)`
                            },
                            "thing4": { // 回复内容
                                "value": `${replyContent.length >= 20 ? replyContent.slice(0, 17) + '...' : replyContent}`
                            },
                            "time5": { // 回复时间
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

/**
 * 5- 获取未读内容总数
 */
module.exports.getUnread = function (req, res) {
    getTokenString(_ => {
        axiosHandler("invokecloudfunction")
            .then(response => {
                console.log(response.data);
                if (response.data.errcode == 0 && response.data.errmsg == 'ok') {
                    res.json({ code: 1, data: JSON.parse(response.data.resp_data)["list"][0] })
                } else {
                    res.json({ code: 0 })
                }
            })
            .catch(err => {
                console.log(err);
            })
    })
}