const fs = require("fs");
const wxData = require("../lib/wxData");
const axios = require("axios");
const { getHeapStatistics } = require("v8");
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

const axiosHandler = function (type, query, collection) {
    if (type == "invokecloudfunction") { // 调用云函数
        return axios({
            url: `https://api.weixin.qq.com/tcb/${type}?access_token=${access_token}`,
            data: {
                collection: `${collection}`,
                env: `${wxData.env}`,
                query: `${query}`
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
 * 1- 获取分类列表
 */
module.exports.getCateList = function (req, res) {
    let query = `db.collection("category").orderBy("index", 'asc').get()`
    getTokenString(function () {
        axiosHandler('databasequery', query)
            .then(response => {
                if (response.status == 200) {
                    res.json(response.data)
                }
            }).catch(err => {
                console.log('接口请求错误', err);
                res.json({
                    msg: "接口请求错误!",
                    err: err
                })
            })
    })
}

/**
 * 2- 新增分类
 */
module.exports.addCate = function (req, res) {
    let obj = {
        name: req.body.name || "",
        banner: req.body.banner || "",
        addtime: new Date(),
        edittime: new Date()
    }
    let query = `db.collection('category').add({data:${JSON.stringify(obj)}})`;
    getTokenString(_ => {
        axiosHandler('databaseadd', query)
            .then(response => {
                if (response.data.errmsg == 'ok') {
                    res.json({ msg: "添加成功!", code: 1 })
                } else {
                    res.json({ msg: "添加失败- -", code: 0 })
                }
            }).catch(err => {
                console.log(err);
                console.log('*********************');
                console.log(err.data);
            })
    })
}

/**
 * 3- 删除分类
 */
module.exports.delCate = function (req, res) {
    let query = `db.collection("category").where({_id:'${req.body.id}'}).remove()`;
    getTokenString(_ => {
        axiosHandler('databasedelete', query)
            .then(response => {
                if (response.data.errmsg == 'ok') {
                    res.json({ msg: "删除成功!", code: 1 })
                } else {
                    res.json({ msg: "删除失败- -", code: 0 })
                }
            }).catch(err => {
                console.log(err);
                console.log('***********************************');
                console.log(err.data);
            })
    })
}

/**
 * 4- 编辑分类
 */
module.exports.editCate = function (req, res) {
    let obj = {
        name: req.body.name || "",
        banner: req.body.banner || "",
        edittime: new Date()
    }
    getTokenString(_ => {
        let obj = {
            name: req.body.name || "",
            banner: req.body.banner || "",
            edittime: new Date()
        },
            query = `db.collection('category').where({_id:'${req.body.id}'}).update({data:${JSON.stringify(obj)}})`
        axiosHandler('databaseupdate', query)
            .then(response => {
                if (response.data.errmsg == 'ok') {
                    res.json({ msg: "修改成功!", code: 1 })
                } else {
                    console.log(response.data);
                    res.json({ msg: "修改失败- -", code: 0 })
                }
            }).catch(err => {
                console.log(err);
            })
    })
}

module.exports.sortCate = function (req, res) {
    let sortedData = req.body.sortedData;
    getTokenString(_ => {
        axiosHandler()
    })
}