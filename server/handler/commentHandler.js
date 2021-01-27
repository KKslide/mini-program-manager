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
    let id = req.body.id || req.query.id;
    let curAuthResponse = req.body.authResponse || req.query.authResponse || [];
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
                    res.json({ code: 1 })
                } else {
                    res.json({ code: 0, msg: response.data.errmsg })
                }
            })
            .catch(err => {
                console.log(err);
            })
    })
}