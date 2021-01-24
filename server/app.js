var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var auth = require("./handler/auth"); // 登陆权限验证
var adminRouter = require('./routes/admin'); // 各个模块接口
var uploadRouter = require('./routes/upload'); // 上传图片路由接口

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

// auth路由拦截
app.use(auth)

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
