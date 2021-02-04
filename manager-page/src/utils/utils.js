/**
 * 校验是否为url地址
 * @param {String} str_url 要传入的url参数
 */
const IsURL = function (str_url) { // 校验是否为网络地址
    var strRegex =
        "^((https|http|ftp|rtsp|mms)?://)" +
        "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" + //ftp的user@
        "(([0-9]{1,3}.){3}[0-9]{1,3}" + // IP形式的URL- 199.194.52.184
        "|" + // 允许IP和DOMAIN（域名）
        "([0-9a-z_!~*'()-]+.)*" + // 域名- www.
        "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]." + // 二级域名
        "[a-z]{2,6})" + // first level domain- .com or .museum
        "(:[0-9]{1,4})?" + // 端口- :80
        "((/?)|" + // a slash isn't required if there is no file name
        "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$";
    var re = new RegExp(strRegex);
    if (re.test(str_url)) {
        return true;
    } else {
        return false;
    }
}

/**
 * 深拷贝函数
 * @param {Object} target 传入一个需要深度克隆的对象或数组
 */
const deepClone = function (target) {
    // 定义一个变量
    let result;
    // 如果当前需要深拷贝的是一个对象的话
    if (typeof target === 'object') {
        // 如果是一个数组的话
        if (Array.isArray(target)) {
            result = []; // 将result赋值为一个数组，并且执行遍历
            for (let i in target) {
                // 递归克隆数组中的每一项
                result.push(deepClone(target[i]))
            }
            // 判断如果当前的值是null的话；直接赋值为null
        } else if (target === null) {
            result = null;
            // 判断如果当前的值是一个RegExp对象的话，直接赋值    
        } else if (target.constructor === RegExp) {
            result = target;
        } else {
            // 否则是普通对象，直接for in循环，递归赋值对象的所有值
            result = {};
            for (let i in target) {
                result[i] = deepClone(target[i]);
            }
        }
        // 如果不是对象的话，就是基本数据类型，那么直接赋值
    } else {
        result = target;
    }
    // 返回最终结果
    return result;
}

/**
 * 特殊字符转Unicode函数
 * @param {String} str 要转换的特殊字符
 */
const toUnicode = function (str) {
    var value = '';
    for (var i = 0; i < str.length; i++)
        value += '&#' + str.charCodeAt(i) + ';';
    return value;
}

/**
 * 把utf16的emoji表情字符进行转码成八进制的字符
 * @param {String} str 需要转化的emoji
 */
const utf16toEntities = function (str) { // emoji字符转换
    var patt = /[\ud800-\udbff][\udc00-\udfff]/g; // 检测utf16字符正则  
    return str.replace(patt, function (char) {
        var H, L, code;
        if (char.length === 2) {
            H = char.charCodeAt(0); // 取出高位  
            L = char.charCodeAt(1); // 取出低位  
            code = (H - 0xD800) * 0x400 + 0x10000 + L - 0xDC00; // 转换算法  
            return "&#" + code + ";";
        } else {
            return char;
        }
    });
}

//将编码后的八进制的emoji表情重新解码成十六进制的表情字符
const entitiesToUtf16 = function (str) {
    return str.replace(/&#(\d+);/g, function (match, dec) {
        let H = Math.floor((dec - 0x10000) / 0x400) + 0xD800;
        let L = Math.floor(dec - 0x10000) % 0x400 + 0xDC00;
        return String.fromCharCode(H, L);
    })
}

/**
 * 日期格式处理 年y 月M 日d 
 * 调用方式：new Date().Format('yyyy/M/d hh:mm:ss'))
 */
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

/**
 * dom树遍历
 */
const BFS = {
    nodes: [],
    do(roots) {
        var children = [];
        for (let i = 0; i < roots.length; i++) {
            var root = roots[i];
            // 过滤 text 节点、script 节点
            if ((root.nodeType != 3) && (root.nodeName != 'SCRIPT')) {
                if (root.childNodes.length) children.push(...root.childNodes);
                this.nodes.push(root);
            }
        }
        if (children.length) {
            var tmp = this.do(children);
        } else {
            return this.nodes;
        }
        return tmp;
    }
}

/**
 * 驼峰命名法
 * @param {String} str 传入字符串
 */
const camelize = function (str) {
    return str.replace(/-(\w)/g, function (strMatch, p1) {
        return p1.toUpperCase();
    });
}

/**
 * 获取dom最终样式属性值
 * @param {Document} elem dom对象
 * @param {String} property 需要查询的属性值
 */
const getStyle = function (elem, property) {
    if (!elem || !property) {
        return false;
    }
    var value = elem.style[camelize(property)], // 先获取是否有内联样式
        css; // 获取的所有计算样式
    // 无内联样式，则获取层叠样式表计算后的样式
    if (!value) {
        if (document.defaultView && document.defaultView.getComputedStyle) {
            css = document.defaultView.getComputedStyle(elem, null);
            value = css ? css.getPropertyValue(property) : null;
        }
    }
    return value;
}

export { IsURL, deepClone, toUnicode, utf16toEntities, entitiesToUtf16, BFS, camelize, getStyle }