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
 * 1- 文章列表获取 || 查询
 */
module.exports.getArticle = function (req, res) {
    let pageNo = req.query.pageNo || req.body.pageNo || 1,
        pageSize = req.query.pageSize || req.body.pageSize || 5,
        title = req.query.title || req.body.title || "", // 需要匹配的文章标题
        category = req.query.category || req.body.category || "", // 需要匹配的文章分类
        rangeTime = req.query.rangeTime || req.body.rangeTime || []; // 需要匹配的时间范围
    let searchObj = {
        pageNo: Number(pageNo),
        pageSize: Number(pageSize),
        title: title,
        category: category,
        rangeTime: rangeTime
    }
    getTokenString(_ => {
        axiosHandler('invokecloudfunction', null, 'content', searchObj)
            .then(response => {
                if (response.data.errmsg == 'ok') {
                    res.json({
                        code: 1,
                        data: JSON.parse(response.data.resp_data).list,
                        total: JSON.parse(response.data.resp_data).total
                    })
                } else {
                    res.json({ code: 0, msg: response.data.errmsg })
                }
            }).catch(err => {
                console.log(err);
            })
    })
}

/**
 * 2- 文章添加
 */
module.exports.addArticle = function (req, res) {
    let newcontent = {
        title: req.body.title || "",
        category: req.body.category || "",
        description: req.body.description || "",
        video_src: req.body.video_src || "",
        composition: req.body.composition.replace(/"/g, "'") || "", // 文章字符串中的双引号需要转化成单引号, 否则会出事
        poster: req.body.poster || req.query.poster || "",
        isShow: req.body.isShow || req.query.isShow || "1",
        user: JSON.parse(req.cookies.userInfo).username || 'unknown',
        isDel: "0",
        addtime: new Date().getTime(), // unix时间戳,单位是毫秒,转换成描述需要除以1000
        edittime: new Date().getTime(), // unix时间戳
        viewnum: 0,
    };
    let query = `db.collection("content").add({data:[${JSON.stringify(newcontent).replace(/\\/g, "")}]})`;
    getTokenString(_ => {
        axiosHandler('databaseadd', query)
            .then(response => {
                console.log(response.data);
                if (response.data.errmsg == 'ok') {
                    res.json({
                        code: 1,
                        msg: "添加成功!"
                    })
                } else {
                    res.json({ code: 0, msg: "添加失败!" })
                }
            }).catch(err => {
                console.log(err);
            })
    })
}

/**
 * 3- 删除文章
 */
module.exports.delArticle = function (req, res) {
    let id = req.body.id || req.query.id || "";
    let query = `db.collection("content").doc('${id}').remove()`
    getTokenString(_ => {
        axiosHandler('databasedelete', query)
            .then(response => {
                if (response.data.errmsg == "ok") {
                    res.json({ code: 1 })
                }
            }).catch(err => {
                console.log(err);
            })
    })
}

/**
 * 4- 编辑文章
 */
module.exports.editArticle = function (req, res) {
    let id = req.query._id || req.body._id;
    let obj = {
        title: req.query.title || req.body.title || "",
        category: req.query.category || req.body.category || "",
        description: req.query.description || req.body.description || "",
        video_src: req.query.video_src || req.body.video_src || "",
        poster: req.query.poster || req.body.poster || "",
        composition: req.body.composition.replace(/"/g, "'") || "",
        isShow: req.query.isShow || req.body.isShow || "1",
        isHot: req.query.isHot || req.body.isHot || "1",
        edittime: new Date().getTime(),
        user: JSON.parse(req.cookies.userInfo).username || "kk"
    }
    let query = `db.collection("content").doc('${id}').update({data:${JSON.stringify(obj).replace(/\\/g, "")}})`;
    getTokenString(_ => {
        axiosHandler('databaseupdate', query)
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
 * 5- 删除评论
 */
module.exports.delComment = function (req, res) {
    let id = req.body.id || req.query.id || "";
    let query = `db.collection("comment").doc('${id}').remove()`
    getTokenString(_ => {
        axiosHandler('databasedelete', query)
            .then(response => {
                if (response.data.errmsg == "ok") {
                    res.json({ code: 1 })
                }
            }).catch(err => {
                console.log(err);
            })
    })
}

/**
 * 6- 获取含有未读消息的文章
 */
module.exports.getUnreadCmtArticle = function (req, res) {
    let pageNo = req.query.pageNo || req.body.pageNo || 1,
        pageSize = req.query.pageSize || req.body.pageSize || 5,
        title = req.query.title || req.body.title || "", // 需要匹配的文章标题
        category = req.query.category || req.body.category || "", // 需要匹配的文章分类
        rangeTime = req.query.rangeTime || req.body.rangeTime || []; // 需要匹配的时间范围
    let searchObj = {
        pageNo: Number(pageNo),
        pageSize: Number(pageSize),
        title: title,
        category: category,
        rangeTime: rangeTime
    }
    console.log(searchObj);
    getTokenString(_ => {
        axiosHandler('invokecloudfunction', null, 'getUnreadCommentArticle', searchObj)
            .then(response => {
                if (response.data.errmsg == 'ok') {
                    res.json({
                        code: 1,
                        data: JSON.parse(response.data.resp_data).data,
                        total: JSON.parse(response.data.resp_data).total
                    })
                } else {
                    res.json({ code: 0, msg: response.data.errmsg })
                }
            }).catch(err => {
                console.log(err);
            })
    })
}