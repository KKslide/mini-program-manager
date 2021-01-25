# 微信小程序后台管理系统

基于`Vue2.6`、`Express` 和 `微信小程序云开发 HTTP API` 的简易前后端分离管理系统。   

## 主要功能：
- 微信小程序分类的增删改查
- 微信小程序文章的增删改查
- 微信小程序用户留言统计
- 管理后台支持访图片裁切上传, 拖拽排序
- 更多后续功能慢慢研究😁

<!-- ## 截图：
<div>    
<img src="./screenshot/snipaste_20200501_172623.jpg" height="200" style="margin-right:10px"/>
<img src="./screenshot/snipaste_20200501_172650.jpg" height="200"/>
</div> 

<div>    
<img src="./screenshot/snipaste_20200501_172731.jpg" height="200"/>
</div>  
<div>
<img src="./screenshot/snipaste_20200501_172836.jpg" height="200"/>
</div>
<div>
<img src="./screenshot/snipaste_20200501_173753.jpg" height="200"/>
</div> -->

********

## 环境：
- Nodejs v10.0+
- Vue v2.5+
- 微信小程序云开发环境(主要是access_token获取和云函数调用)


### 服务端:
+ 目录结构:

     ```
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
    ```

+ 关键文件修改说明:
    + 端口修改
    ```javascript
        // bin/www下 修改它
        var port = normalizePort(process.env.PORT || '你想要的端口');
    ```
    + 小程序appID和密钥、云开发环境ID
    ```javascript
        // 修改 /lib/wxData.js 
        module.exports = {
            "AppID": "你的小程序appID",
            "AppSecret": "你的小程序密钥",
            "env": "你的云开发环境"
        }
    ```
    + 注意❗
    <div style="font-weight:bold">
    <p>因为我使用的是七牛云对象存储, 并非微信云开发存储, </p>
    <p>若仅是学习或参考而不需要<span style="color:red">部署到云服务器</span>的话,</p>
    <p>前端的图片上传接口调用 '/admin/img_upload' 就可以了</p>
    </div>

+ 启动服务:
    ```shell 
    1.下载依赖包
        npm i 
    2.运行服务
        npm start
    ```

### 前端：
+ 目录结构

    ```
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
    ```
+ 说明:
    + 使用Vue-cli3 + Vue2.6.10开发, 以下库均是使用外部链接方式引入, 这样可以使得打包后的app.js体积更小加载更快:
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
        // 修改vue.config.js下
        const proxyUrl = process.env.NODE_ENV === 'production'
            ? 'http://47.112.232.140:9999'  // 生产
            : 'http://127.0.0.1:9999' // 开发
        ```
+ 前端启动
    ```shell
        1.安装依赖
            npm install
        2.启动
            npm run serve
    ```

****

<!-- - 在`/`根目录下 `npm run dev` 运行开发环境
- 在`/server`目录下 `npm start` 运行服务端
- 打开👉[http://localhost:8080](http://localhost:8080)即可

***
## 总结：
虽然博客和个人网站这种类型的项目已经一搜一大把了

纸上得来终觉浅 绝知此事要躬行 🤐

从写静态页面到用Vue框架改造

再自己用express写服务端

买服务器, 备案域名, 实现七牛云对象存储, 搭建CentOS环境, 再部署项目

表面上内容和功能虽然简单,但也感觉获益颇丰了

下一步打算尝试用别的后台语言技术实现服务端😁

🙏🙏🙏 -->


