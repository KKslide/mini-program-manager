<template>
    <div id="app">
        <div id="site-border-left"></div>
        <div id="site-border-right"></div>
        <div id="site-border-top"></div>
        <div id="site-border-bottom"></div>

        <router-view></router-view>
    </div>
</template>

<script>
export default {
    name: "App",
    data () {
        return {
            /* *****************无操作自动登出****************** */
            isDone: false, // 总开关- 全局变量
            lastTime: new Date().getTime(), // 最后一次点击时间
            currentTime: new Date().getTime(), // 当前时间
            timeOut: 6 * (60 * (60 * 1000)), // 允许最长未操作时间(6小时)
            i: 1, // 辅助标记
            $timer: null,
            /* *****************无操作自动登出****************** */
        };
    },
    methods: {
        isOperate () { // 记录用户操作,计时自动登出
            if (this.$route.path.indexOf('login') > -1) return false; // 登陆页面不操作
            clearInterval(this.$timer)
            this.lastTime = new Date().getTime() // 最后一次点击时间
            this.currentTime = new Date().getTime() // 当前时间
            this.domEvent();
            this.handleInterval(); // 一开始程序 默认执行定制器
            this.isDone = false;
        },
        handleInterval () { // 定时器
            if (this.$route.path.indexOf('login') > -1) return false; // 登陆页面不操作
            this.$timer = setInterval(() => {
                this.currentTime = new Date().getTime() // 当前时间
                // console.log(`${this.i++}-currentTime`, this.currentTime)
                // console.log('最后一次操作时间', this.lastTime)

                if (this.currentTime - this.lastTime > this.timeOut) {
                    // console.log('长时间未操作')

                    clearInterval(this.$timer) // 清除定时器

                    // 长时间未操作逻辑
                    // console.log('太久没动了!!!');
                    this.isDone = true;
                    this.$timer = null;

                    this.$axios.get('/admin/logout').then(res => {
                        if (res.data.code == 1) {
                            this.$message({
                                type: "success",
                                message: "退出登陆!"
                            })
                            this.$router.push('/login')
                        }
                    })
                }
            }, 1000)
        },
        handleReset () { // 重置计时
            // console.log('页面操作！！！！！！')
            this.i = 1;
            this.lastTime = new Date().getTime();
            if (this.$timer) {
                clearInterval(this.$timer)
                this.$timer = null
            }
            if (!this.$timer && !this.isDone) {
                // console.log('真好！重新开始')
                this.handleInterval()
            }
        },
        domEvent () { // 所有dom操作事件
            document.onclick = () => { // 单击事件
                this.handleReset()
            }

            document.ondblclick = () => { // 双击事件
                this.handleReset()
            }

            document.onmousedown = () => { // 按下鼠标键时触发
                this.handleReset()
            }

            document.onmouseup = () => { // 释放按下的鼠标键时触发
                this.handleReset()
            }

            document.onmousemove = () => { // 鼠标移动事件
                this.handleReset()
            }

            document.onmouseover = () => { // 移入事件
                this.handleReset()
            }

            document.onmouseout = () => { // 移出事件
                this.handleReset()
            }

            document.onmouseenter = () => { // 移入事件
                this.handleReset()
            }

            document.onmouseleave = () => { // 移出事件
                this.handleReset()
            }

            document.onkeydown = () => { // 键盘按下
                this.handleReset()
            }

            document.onkeyup = () => { // 键盘按起
                this.handleReset()
            }
        }
    },
    watch: {
        $route: function (nv, ov) {
            this.isOperate()
        }
    },
    created () {
        this.isOperate()
    }
};
</script>

<style lang="less" scoped>
body {
    touch-action: none;
}
</style>