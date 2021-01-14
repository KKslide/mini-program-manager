const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const formidable = require("formidable"); // 用来处理上传图片的
const util = require("../util/util");
const wxData = require("../lib/wxData");
const axios = require("axios");

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

// 检测是否登陆
router.get('/isadmin', (req, res, next) => {
    if (JSON.stringify(req.cookies) == "{}") {
        res.json({ code: 0, msg: "请先登录啦" })
    } else {
        res.json({ code: 1, islogin: 'logined', msg: "登陆成功" })
    }
});

// 登陆接口
router.post('/login', (req, res, next) => {
    let username = req.body.username || req.query.username || "";
    let password = req.body.password || req.query.password || "";

    getTokenString(function () {
        axios({
            url: `https://api.weixin.qq.com/tcb/databasequery?access_token=${access_token}`,
            data: {
                env: `${wxData.env}`,
                query: `db.collection("users").where({username:"${username}",password:"${password}"}).get()`
            },
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response.data.errcode != 0 || response.data.data.length == 0) {
                res.json({ code: 0, msg: "用户名或密码错误！" });
            } else {
                res.cookie("userInfo", JSON.stringify({
                    "_id": response.data.data[0]._id,
                    "username": response.data.data[0].username,
                    "isadmin": /* response.data.data[0].isadmin */ true
                }), { maxAge: 1000 * 60 * 60 * 6, httpOnly: true }) // 现在先存一个小时吧
                res.json({
                    code: 1,
                    msg: "登录成功！",
                    userinfo: {
                        id: response.data.data[0]._id,
                        username: response.data.data[0].username
                    }
                });
            }
        }).catch(err => {
            console.log(err);
            res.json({ code: 1, msg: "接口调用失败,查看后台", errData: err })
        })
    })

});

// 退出登陆接口
router.get('/logout', (req, res, next) => {
    res.cookie('userInfo', null, { expires: new Date(0) });
    res.json({ code: 1, msg: "退出成功" })
})

// 获取文章分类接口
router.get("/category", (req, res, next) => {
    getTokenString(function () {
        axios({
            url: `https://api.weixin.qq.com/tcb/databasequery?access_token=${access_token}`,
            data: {
                env: `${wxData.env}`,
                query: `db.collection("category").orderBy("index", 'asc').get()`
            },
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
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
});

// 新增文章分类
router.post("/category/add", (req, res, next) => {
    let obj = {
        name: req.body.name || "",
        banner: req.body.banner || "",
        addtime: new Date(),
        edittime: new Date()
    }
    getTokenString(function () {
        axios({
            url: `https://api.weixin.qq.com/tcb/databaseadd?access_token=${access_token}`,
            data: {
                env: `${wxData.env}`,
                query: `db.collection('category').add({data:${JSON.stringify(obj)}})`
            },
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
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
});

// 删除文章分类
router.post('/category/del', (req, res, next) => {
    getTokenString(function () {
        axios({
            url: `https://api.weixin.qq.com/tcb/databasedelete?access_token=${access_token}`,
            data: {
                env: `${wxData.env}`,
                query: `db.collection("category").where({_id:'${req.body.id}'}).remove()`
            },
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
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
});

// 修改文章分类
router.post('/category/edit', (req, res, next) => {
    let obj = {
        name: req.body.name || "",
        banner: req.body.banner || "",
        edittime: new Date()
    }
    getTokenString(function () {
        axios({
            url: `https://api.weixin.qq.com/tcb/databaseupdate?access_token=${access_token}`,
            data: {
                env: `${wxData.env}`,
                query: `db.collection('category').where({_id:'${req.body.id}'}).update({data:${JSON.stringify(obj)}})`
            },
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
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
});

// 文章分类排序
router.post('/category/sort', (req, res, next) => {
    let sortedData = req.body.sortedData;
    getTokenString(function () {
        axios({
            url: `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${access_token}&env=${wxData.env}&name=updateHandler`,
            data: JSON.stringify({
                collection: "category_sort",
                sortedData: sortedData
            }),
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response.data.errcode == 0 && response.data.errmsg == "ok") {
                let resArr = JSON.parse(response.data.resp_data)
                console.log(resArr);
                console.log(resArr.filter(v => {
                    return v["stats"]["updated"] == 1
                }).length);
                res.json({
                    code: 1,
                    msg: "顺序修改成功!",
                    resArr: resArr
                })
            } else {
                res.json({ code: 0, msg: "接口请求错误" })
            }
        }).catch(err => {
            console.log(err);
            res.json({ code: 0, msg: "接口请求错误" })
        })
    })
})

// 获取文章接口
router.get("/articles", (req, res, next) => {
    let pageNo = req.query.pageNo || req.body.pageNo || 1,
        pageSize = req.query.pageSize || req.body.pageSize || 5,
        total = 0;
    getTokenString(function () {
        axios({ // 1- 先获取总数
            url: `https://api.weixin.qq.com/tcb/databasecount?access_token=${access_token}`,
            method: "POST",
            data: JSON.stringify({
                env: `${wxData.env}`,
                query: `db.collection("content").count()`,
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(res1 => { // 2- 分页查询数据
            total = res1.data.count;
            axios({
                url: `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${access_token}&env=${wxData.env}&name=getHandler`,
                data: JSON.stringify({
                    collection: "content",
                    pageNo: Number(pageNo),
                    pageSize: Number(pageSize)
                }),
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }).then(response => {
                if (response.data.errmsg == 'ok') {
                    res.json({
                        code: 1,
                        data: JSON.parse(response.data.resp_data).list,
                        total: total
                    })
                } else {
                    res.json({ code: 0, msg: response.data.errmsg })
                }
            }).catch(err => {
                console.log(err);
            })
        }).catch(err => {
            console.log('请求错误', err);
        })
    })
})

// 添加文章接口
router.post('/articles/add', (req, res, next) => {
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
    getTokenString(function () {
        axios({
            url: `https://api.weixin.qq.com/tcb/databaseadd?access_token=${access_token}`,
            method: "POST",
            data: JSON.stringify({
                env: `${wxData.env}`,
                query: `db.collection("content").add({data:[${JSON.stringify(newcontent).replace(/\\/g, "")}]})`
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
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
})

// 删除文章接口
router.post('/articles/del', (req, res, next) => {
    var id = req.body.id || req.query.id || "";
    getTokenString(function () {
        axios({
            url: `https://api.weixin.qq.com/tcb/databasedelete?access_token=${access_token}`,
            method: "POST",
            data: JSON.stringify({
                env: `${wxData.env}`,
                query: `db.collection("content").doc('${id}').remove()`,
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response.data.errmsg == "ok") {
                res.json({ code: 1 })
            }
        }).catch(err => {
            console.log(err);
        })
    })
});

// 编辑文章接口
router.post("/articles/edit", function (req, res) {
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
    getTokenString(function () {
        axios({
            url: `https://api.weixin.qq.com/tcb/databaseupdate?access_token=${access_token}`,
            method: "POST",
            data: JSON.stringify({
                env: `${wxData.env}`,
                query: `db.collection("content").doc('${id}').update({data:${JSON.stringify(obj).replace(/\\/g, "")}})`
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response.data.errmsg == "ok") {
                res.json({ code: 1 })
            } else {
                res.json({ code: 0, msg: response.data.errmsg })
            }
        }).catch(err => {
            console.log(err);
        })
    })
});

// 图片上传接口
router.post("/img_upload", function (req, res) {
    var form = new formidable.IncomingForm()
    form.uploadDir = "./upload";
    form.keepExtensions = true;
    form.parse(req, function (err, fields, files) {
        let image = files.image || files.file;
        if (err) {
            console.log(err);
            res.json({ code: 0, msg: "上传失败！" })
        } else {
            var ip = req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, ''); // 有问题
            res.json({
                code: 1,
                msg: "上传成功！",
                errno: 0,
                path: 'http://' + ip + '/' + path.basename(image.path),
                imageUrl: 'http://' + ip + '/' + path.basename(image.path),
                data: ['http://' + ip + '/' + path.basename(image.path)]
            })
        }
    })
});

// 获取留言列表
router.get("/message/get", function (req, res, next) {

    let pageNo = req.query.pageNo || req.body.pageNo || 1,
        pageSize = req.query.pageSize || req.body.pageSize || 5,
        dataTotal = 0;
    getTokenString(function () {
        axios({ // 1- 查询数据总数
            url: `https://api.weixin.qq.com/tcb/databasecount?access_token=${access_token}`,
            method: "POST",
            data: JSON.stringify({
                env: `${wxData.env}`,
                query: `db.collection("message").count()`,
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(res1 => {
            if (res1.data.errcode != 0 || res1.data.errmsg != "ok") {
                return res.json({ code: 1, msg: "接口查询错误,请查看后台报错" })
            }
            dataTotal = res1.data.count;
            axios({ // 2- 分页
                url: `https://api.weixin.qq.com/tcb/databaseaggregate?access_token=${access_token}`,
                method: "POST",
                data: JSON.stringify({
                    env: `${wxData.env}`,
                    query: `db.collection("message").aggregate().sort({addtime:-1}).skip(${(pageNo - 1) * pageSize}).limit(${pageSize}).end()`,
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            }).then(msgResponse => {
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
        }).catch(err1 => {
            console.log(err1);
            res.json({ code: 1, msg: "接口查询错误,请查看后台报错" })
        })
    })
});

// 留言删除接口
router.post("/massage/del", function (req, res, next) {
    var id = req.body.id || req.query.id || "";
    if (id == "") {
        return res.json({ code: 1, msg: "删除失败!" })
    }
    getTokenString(function () {
        axios({
            url: `https://api.weixin.qq.com/tcb/databasedelete?access_token=${access_token}`,
            method: "POST",
            data: JSON.stringify({
                env: `${wxData.env}`,
                query: `db.collection("message").doc('${id}').remove()`,
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response.data.errmsg == "ok") {
                res.json({ code: 0, msg: "删除成功!" })
            }
        }).catch(err => {
            console.log(err);
        })
    })
});

module.exports = router;