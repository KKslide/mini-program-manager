export default {
    targetUrl: {
        // 上传地址
        type: String,
        default: '/pic/upload' // 线上环境
        // default: '/admin/img_upload' // 本地测试
    },
    multiple: {
        // 多图开关
        type: Boolean,
        default: false
    },
    initUrl: {
        // 初始图片链接
        default: ''
    },
    fixedNumber: {
        // 剪裁框比例设置
        default: function () {
            return [5, 4]
        }
    },
    width: {
        // 单图剪裁框宽度
        type: Number,
        default: 120
    },
    height: {
        // 单图剪裁框高度
        type: Number,
        default: 96
    }
}