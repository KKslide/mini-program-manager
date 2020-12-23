const axios = require("axios"); // axios网络请求模块
const wxData = require("../lib/wxData"); // 微信端数据

module.exports = {
    dateFormat(tplDate) { // 时间格式化
        let date = new Date(tplDate + '');
        return ` ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours() >= 10 ? date.getHours() : '0' + date.getHours()}:${date.getMinutes() >= 10 ? date.getMinutes() : '0' + date.getMinutes()}:${date.getSeconds() >= 10 ? date.getSeconds() : '0' + date.getSeconds()} `;
    },
    getNow() { // 获取当前时间字符串
        let date = new Date();
        return ` ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours() >= 10 ? date.getHours() : '0' + date.getHours()}:${date.getMinutes() >= 10 ? date.getMinutes() : '0' + date.getMinutes()}:${date.getSeconds() >= 10 ? date.getSeconds() : '0' + date.getSeconds()} `;
    },
    /**
    * 获取用户ip
    */
    getClientIp(req) {
        try {
            return req.headers['x-wq-realip'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.connection.socket.remoteAddress;
        } catch (e) {
            logger.info("getClientIp error");
            return "";
        }
    },
    /**
     * 获取微信access_token
     */
    getAccessToken(req) {
        return new Promise((resolve, reject) => {
            axios({
                url: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wxData.AppID}&secret=${wxData.AppSecret}`,
                headers: {
                    "content-type": "application/json"
                }
            }).then(res => {
                if (res.status == 200) {
                    resolve(res.data);
                } else {
                    reject(res.data);
                }
            }).catch(err => {
                console.log('获取access_token出错了 ', err);
                return err;
            })
        })
    }
}