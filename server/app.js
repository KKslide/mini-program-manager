var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
var uploadRouter = require('./routes/upload'); // 上传图片路由接口

//加载mongoose数据库，这个中间件是nodejs与mongoDB数据库的桥梁
var mongoose = require("mongoose");

// 连接数据库
// mongoose.connect(‘mongodb://username:password@host:port/database?options…’);
mongoose.connect("mongodb://root:root@localhost:27017/myBlog");

var db = mongoose.connection;
db.once("open", function () {
    console.log("Mongo Connected");
});
db.on("error", console.error.bind(console, "Mongoose Connection Error"));

var app = express();

app.set('view engine', 'html')

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// 静态资源托管
app.use(express.static(path.join(__dirname, 'upload')));
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', function (req, res, next) {
    res.type('html');
    res.render('index');
});

app.use('/index', indexRouter);
app.use('/admin', adminRouter);
app.use('/pic', uploadRouter);

app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
