const cloud = require("wx-server-sdk");

cloud.init({
    appid: 'appid',
    env:"env",
});

module.exports = cloud;