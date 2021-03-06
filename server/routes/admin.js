const express = require("express");
const path = require("path");
const router = express.Router();
const formidable = require("formidable"); // 用来处理上传图片的

const categoryHandler = require("../handler/categoryHandler");
const articleHandler = require("../handler/articleHandler");
const msgHandler = require("../handler/msgHandler");
const accessHandler = require("../handler/accessHandler");
const commentHandler = require("../handler/commentHandler");

/* ************ 登陆 ************* */
// 登陆接口
router.post('/login', accessHandler.login);

// 退出登陆接口
router.get('/logout', accessHandler.logout);
/* ************ 登陆 ************* */


/* ************ 分类 ************* */
// 获取文章分类接口
router.post("/category/get", categoryHandler.getCateList)

// 新增文章分类
router.post("/category/add", categoryHandler.addCate)

// 删除文章分类
router.post('/category/del', categoryHandler.delCate);

// 修改文章分类
router.post('/category/edit', categoryHandler.editCate);

// 文章分类排序
router.post('/category/sort', categoryHandler.sortCate);
/* ************ 分类 ************* */


/* ************ 文章 ************* */
// 获取文章接口
router.post("/articles", articleHandler.getArticle);

// 获取有未读评论的文章
router.post("/articles/commentunread", articleHandler.getUnreadCmtArticle);

// 添加文章接口
router.post('/articles/add', articleHandler.addArticle);

// 删除文章接口
router.post('/articles/del', articleHandler.delArticle);

// 删除文章评论
router.post('/comment/del', articleHandler.delComment);

// 编辑文章接口
router.post("/articles/edit", articleHandler.editArticle);
/* ************ 文章 ************* */


/* ************ 留言 ************* */
// 获取留言列表
router.post("/message/get", msgHandler.getMSG);

// 留言删除接口
router.post("/message/del", msgHandler.delMSG);

// 留言读取
router.post("/message/read",msgHandler.readMSG);

// 留言回复并发送订阅消息
router.post("/message/reply", msgHandler.replyMSG);
/* ************ 留言 ************* */


/* ************ 评论 ************* */
router.post("/comment/read", commentHandler.readComment)

router.post("/comment/reply", commentHandler.replyComment)
/* ************ 评论 ************* */

/* ************ 获取未读取总数(包括文章评论和留言) ************* */
router.post("/getUnread", msgHandler.getUnread);

// 图片上传接口(本地调试)
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
            setTimeout(() => {
                res.json({
                    code: 1,
                    msg: "上传成功！",
                    errno: 0,
                    path: 'http://' + ip + '/' + path.basename(image.path),
                    imageUrl: 'http://' + ip + '/' + path.basename(image.path),
                    data: ['http://' + ip + ':9999' + '/' + path.basename(image.path)]
                })
            }, 1500);
        }
    })
});

module.exports = router;