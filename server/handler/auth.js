module.exports = (req, res, next) => {
    if (req.url == "/admin/logout" || req.url == "/admin/login") {
        next()
    } else {
        if (req.cookies.userInfo && JSON.parse(req.cookies.userInfo).isadmin) {
            next()
        } else {
            res.status(401).json({
                msg: "未登录!!"
            })
        }
    }
}