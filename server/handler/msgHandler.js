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