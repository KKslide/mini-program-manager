// proxy.js
const http = require('http');
const request = require('request');
var urltool = require('url');
var querystring = require('querystring');

const hostIp = '127.0.0.1';
const apiPort = 6060;
const data = {
    appid: "xxx",
    secret: "xxx",
    grant_type: "client_credential",
    env: "xxxx"
};
//创建 API 代理服务
const apiServer = http.createServer((req, res) => {
    console.log("***************************************")
    console.log('[请求]来自=' + req.url);
    if (req.url == "/access_token") {
        getAccessToken(res)
    }
});
//监听 API 端口
apiServer.listen(apiPort, hostIp, () => {
    console.log('代理接口，运行于 http://' + hostIp + ':' + apiPort + '/');
});
function getAccessToken (res) {
    const url = 'https://api.weixin.qq.com/cgi-bin/token?appid=' + data.appid + '&secret=' + data.secret + '&grant_type=' + data.grant_type;
    request({
        url: url,//请求路径
        method: "GET",//请求方式，默认为get
        headers: {//设置请求头
            "content-type": "application/json",
        },
        body: JSON.stringify(data)//post参数字符串
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            //编码类型
            res.setHeader('Content-Type', 'text/plain;charset=UTF-8');
            //允许跨域
            res.setHeader('Access-Control-Allow-Origin', '*');
            //返回代理内容
            console.log("返回数据：" + body)
            res.end(body);
        }
    });
}

