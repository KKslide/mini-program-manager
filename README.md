# 微信小程序后台管理系统

#### 基于`Vue2.6`、`Express` 和 `微信小程序云开发 HTTP API` 的简易前后端分离管理系统。 
#### 另外,小程序前端github地址: [https://github.com/KKslide/mini-program-cloud.git](https://github.com/KKslide/mini-program-cloud.git)

## 此管理系统主要功能：
- 微信小程序分类的增删改查
- 微信小程序文章的增删改查
- 微信小程序用户留言管理
- 管理后台支持访图片裁切上传, 拖拽排序
- 集成WangEditor富文本编辑器
- 更多后续功能慢慢研究😁

## 截图：
<div>    
<img src="http://example.kkslide.fun/readme-pic-1.png" height="200"/>
</div>
<div>    
<img src="http://example.kkslide.fun/readme-pic-2.jpg" height="200"/>
</div>  
<div>
<img src="http://example.kkslide.fun/readme-pic-3.png" height="200"/>
</div>
<div>
<img src="http://example.kkslide.fun/readme-pic-4.png" height="200"/>
</div>

********

## 环境和准备：
- Nodejs v10.0+
- Vue v2.6+
- 微信小程序云开发环境(主要是AccessToken凭证获取和云函数调用)
    - 可参考: [3小时零基础入门微信小程序云开发](https://www.bilibili.com/video/BV1pE411C7Ca)
- 在微信开发工具-云开发控制台-数据库 中建立以下几个集合:
    - **user** (用户表)
        - username
        - password
    - **category** (分类表)
    - **content** (文章内容表)
    - **comment** (文章评论表)
    - **message** (留言表)


## 服务端(NodeJS):
+ 目录结构:

    <details>
        <summary><mark><font color=darkred>- 查看 -</font></mark></summary>
        <pre><code>
            /server
            ├─app.js
            ├─package-lock.json
            ├─package.json
            ├─util
            |  └util.js
            ├─upload
            ├─routes
            |   ├─admin.js
            |   └upload.js
            ├─lib
            |  ├─access_token.json
            |  └wxData.js
            ├─handler
            |    ├─accessHandler.js
            |    ├─articleHandler.js
            |    ├─auth.js
            |    ├─categoryHandler.js
            |    └msgHandler.js
            ├─bin
            |  └www
        </code></pre>
    </details>

+ 关键文件修改说明:
    + 端口修改
    ```javascript
        // bin/www下 修改它
        var port = normalizePort(process.env.PORT || '你想要的端口');
    ```
    + 小程序appID和密钥、云开发环境ID, 这些都需要自己去申请
    ```javascript
        // 修改 /lib/wxData.js 
        module.exports = {
            "AppID": "你的小程序appID",
            "AppSecret": "你的小程序密钥",
            "env": "你的云开发环境"
        }
    ```
    + AccessToken存储逻辑:
        + 读取 access_token.json 文件, 
        + 判断 access_token 字段是否存在, 
        + 并且判断 record_time 字段时常是否超出2小时
        + -> 未超出: 使用它
        + -> 超出: 重新请求并存储
        + 👉 [官方文档: auth.getAccessToken](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/access-token/auth.getAccessToken.html)

    + 图片上传需要注意❗❗❗
        <div style="font-weight:bold">
        <p>因为该项目使用的是七牛云对象存储, 并非微信云开发存储, </p>
        <p>七牛云对象存储需要有域名备案</p>
        <p>若仅是学习或参考而不需要<span style="color:red">部署到云服务器</span>的话,</p>
        <p>前端的图片上传接口调用 '/admin/img_upload' 就可以了</p>
        <p>
            Nodejs集成七牛云可以参考这篇文章:
            <a href="https://www.jianshu.com/p/7b8bf616222f">Nodejs集成七牛云</a>
        </p>
        <p>
            七牛云官方开发文档: 
            <a href="https://developer.qiniu.com/kodo/1289/nodejs">对象存储 Node.js SDK</a>
        </p>
        </div>

+ 启动后端服务:
    ```shell 
    1.下载依赖包
        npm i 
    2.运行服务
        npm start
    ```

## 前端(Vue.js 2.6.10)：
+ 目录结构
    <details>
        <summary><mark><font color=darkred>- 查看 -</font></mark></summary>
        <pre><code>
            manager-page
            ├─.browserslistrc
            ├─.eslintrc.js
            ├─.gitignore
            ├─babel.config.js
            ├─package-lock.json
            ├─package.json
            ├─vue.config.js
            ├─src
            |  ├─App.vue
            |  ├─main.js
            |  ├─utils
            |  |   └utils.js
            |  ├─styles
            |  ├─router
            |  |   ├─index.js
            |  |   └routerGuard.js
            |  ├─filter
            |  |   └index.js
            |  ├─components
            |  |     ├─admin
            |  |     |   ├─index.vue
            |  |     |   ├─user
            |  |     |   |  └UserManage.vue
            |  |     |   ├─resume
            |  |     |   |   └ResumeManagement.vue
            |  |     |   ├─public
            |  |     |   |   ├─Footer.vue
            |  |     |   |   └NavMenu.vue
            |  |     |   ├─massage
            |  |     |   |    └MassageManagement.vue
            |  |     |   ├─login
            |  |     |   |   └Login.vue
            |  |     |   ├─home
            |  |     |   |  └Home.vue
            |  |     |   ├─category
            |  |     |   |    └CategoryManage.vue
            |  |     |   ├─article
            |  |     |   |    ├─ArticleManage.vue
            |  |     |   |    ├─CommentManage.vue
            |  |     |   |    └Cropper.vue
            |  ├─assets
            ├─public
        </code></pre>
    </details>

+ 说明:
    + 使用Vue-cli4 + Vue2.6.10开发, 以下库均是使用外部链接方式引入, 这样可以使得打包后的app.js体积更小加载更快:
        - Vue
        - vue-router
        - axios
        - elementUI
        - wangEditor
        - Sortable.js
        - vuedragable.js
        ``` html
        HTML中引入: 
            <link href="https://cdn.bootcss.com/element-ui/2.12.0/theme-chalk/index.css" rel="stylesheet">
            <script src="https://cdn.bootcss.com/vue/2.6.10/vue.js"></script>
            <script src="https://cdn.bootcss.com/vue-router/3.1.3/vue-router.min.js"></script>
            <script src="https://cdn.bootcss.com/axios/0.19.0/axios.min.js"></script>
            <script src="https://cdn.bootcss.com/element-ui/2.12.0/index.js"></script>
            <script src="http://example.kkslide.fun/wangEditor.js"></script>
            <script src="https://cdn.bootcdn.net/ajax/libs/highlight.js/8.0/highlight.min.js"></script>
            <script src="https://cdn.bootcss.com/qs/6.8.0/qs.min.js"></script>
            <script src="https://cdn.bootcdn.net/ajax/libs/Sortable/1.11.2-alpha.3/Sortable.js"></script>
            <script src="https://cdn.bootcdn.net/ajax/libs/Vue.Draggable/2.24.3/vuedraggable.umd.js"></script>
        ```

        ```javascript
        Vue.config.js配置如下: 
            configureWebpack: {
                // 把原本需要写在webpack.config.js中的配置代码 写在这里 会自动合并
                // 在main.js中无需use 也能正常使用
                externals: {
                    'axios': 'axios',
                    'vue': 'Vue',
                    'element-ui': 'element-ui',
                    'axios': 'axios',
                    'qs': 'qs',
                    'vue-router': 'VueRouter',
                    'vuedraggable':'vuedraggable'
                }
            },
        ```
    + 开发端口修改和axios代理配置
        ```javascript
        // vue.config.js 代理端口修改成和服务端端口号一致
        const proxyUrl = process.env.NODE_ENV === 'production'
            ? 'http://47.112.232.140:9999'  // 生产(如果不需要部署到自己服务器,就忽略它)
            : 'http://127.0.0.1:9999' // 开发
        // vue.config.js代理配置
        module.exports = {
            devServer: {
                // 代理配置
                proxy: {
                    '/index': {
                        changeOrigin: true,
                        target: proxyUrl
                    },
                    '/index/*': {
                        changeOrigin: true,
                        target: proxyUrl
                    },
                    '/admin/*': {
                        changeOrigin: true,
                        target: proxyUrl
                    },
                    '/pic/*': {
                        changeOrigin: true,
                        target: proxyUrl
                    }
                }
            }
        }
        ```
+ 前端启动
    ```shell
        1.安装依赖
            npm install
        2.启动
            npm run serve
    ```

+ 打开👉[http://localhost:8080] 启动后台管理页
+ 注意: 目前是死密码,加密方式为 md5(账号+密码), 后期将尝试改为微信扫码二维码的方式登陆
****

## 总结：
虽然博客和个人网站这种类型的项目已经一搜一大把了

纸上得来终觉浅 绝知此事要躬行 🤐

从写静态页面到用Vue框架改造

再自己用Nodejs写服务端

准备服务器, 备案域名, 实现七牛云对象存储, 搭建CentOS环境, 再部署项目

表面上内容和功能虽然简单,但也感觉获益颇丰了

想想出道至今都还很少有接触过微信相关的项目 有点吃亏呀😁

🙏🙏🙏 


