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
 * 登陆(后期将改为微信扫描二维码登陆)
 */
module.exports.login = function (req, res) {
    let username = req.body.username || req.query.username || "",
        password = req.body.password || req.query.password || "",
        query = `db.collection("users").where({username:"${username}",password:"${password}"}).get()`;
    getTokenString(_ => {
        axiosHandler('databasequery', query)
            .then(response => {
                let resData = JSON.parse(response.data.data[0]);
                if (response.data.errcode != 0 || response.data.data.length == 0) {
                    res.json({ code: 0, msg: "用户名或密码错误！" });
                } else {
                    res.cookie("userInfo", JSON.stringify({
                        "_id": resData._id,
                        "username": resData.username,
                        "isadmin": true
                    }), { maxAge: 1000 * 60 * 60 * 6, httpOnly: true }) // 现在先存6个小时吧
                    res.json({
                        code: 1,
                        msg: "登录成功！",
                        userinfo: {
                            id: resData._id,
                            username: resData.username
                        }
                    });
                }
            }).catch(err => {
                console.log(err);
                res.json({ code: 1, msg: "接口调用失败,查看后台", errData: err })
            })
    })
}

/**
 * 退出登陆
 */
module.exports.logout = function (req, res) {
    res.cookie('userInfo', null, { expires: new Date(0) });
    res.json({ code: 1, msg: "退出成功" })
}