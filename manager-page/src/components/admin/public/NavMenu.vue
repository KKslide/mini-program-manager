<template>
    <div id="nav">
        <div class="line"></div>
        <el-menu
            :default-active="activeIndex"
            class="el-menu-demo"
            mode="horizontal"
            @select="handleSelect"
            background-color="#545c64"
            text-color="#fff"
            active-text-color="#ffd04b"
        >
            <!-- <el-menu-item index="admhome">首页</el-menu-item> -->
            <!-- <el-menu-item index="user" data-url="user">用户管理</el-menu-item> -->
            <el-menu-item index="category" data-url="category" >分类管理</el-menu-item >
            <el-menu-item index="article">文章管理</el-menu-item>
            <el-menu-item index="massage">留言管理</el-menu-item>
        </el-menu>
        <div class="admin_tip">
            <el-dropdown @command="(fn) => fn()">
                <span class="el-dropdown-link">
                    <i class="el-icon-bell el-icon--left"></i>
                    <span style="color: red">{{ unread_total }}</span>
                </span>
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item :command="go2Article" >评论消息 {{ comment_unread_count }}</el-dropdown-item >
                    <el-dropdown-item :command="go2msg" >留言消息 {{ msg_unread_count }}</el-dropdown-item >
                    <el-dropdown-item>全部已读</el-dropdown-item>
                </el-dropdown-menu>
            </el-dropdown>
            <span class="el-dropdown-link" @click="logout">
                <i class="el-icon-switch-button"></i>
                退出登陆
            </span>
        </div>
    </div>
</template>

<script>
export default {
    data () {
        return {
            activeIndex: this.$route.name,
            unread_data: null
        };
    },
    created () {
        this.getUnreadMSG(_ => {
            window.$timer = setInterval(() => {
                this.getUnreadMSG()
            }, 1000 * 60 * 3);
            console.log('timerID: ', window.$timer);
        })
    },
    beforeDestroy () {
        console.log('组件销毁, 清空定时器');
        clearInterval(window.$timer)
    },
    methods: {
        handleSelect (key, keyPath) { // 路由跳转
            if (key != null) this.$router.push({ name: key })
        },
        go2Article () {
            this.$router.push({ name: 'article', params: { isCheckUnread: true } })
            // console.log(this.$store.getters.isCheckUnread);
            this.$EventBus.$emit("navUnreadMSGClick", "get unread comment")
        },
        go2msg () {
            this.$router.push({ name: 'massage', params: { isCheckUnread: true } })
        },
        getUnreadMSG (callback) { // 获取未读消息数量
            this.$axios({
                url: "/admin/getUnread",
                method: "post"
            }).then(res => {
                // console.log(res);
                if (res.data.code == 1) {
                    this.$store.commit('setState', res.data.data)
                }
                console.log('current Time:\n', new Date().toLocaleString(), '\nlatest comment!');
                if (callback) callback()
            })
        },
        logout () { // 登出
            this.$axios.get('/admin/logout').then(res => {
                if (res.data.code == 1) {
                    this.$message({
                        type: "success",
                        message: "退出登陆!"
                    })
                    this.$router.push('/login')
                }
            })
        },
    },
    watch: {
        $route (to, from) {
            this.activeIndex = to.name
        }
    },
    computed: {
        comment_unread_count: function () {
            return this.$store.getters.getComUnreadCount < 0 ? 0 : this.$store.getters.getComUnreadCount
        },
        msg_unread_count: function () {
            return this.$store.getters.getMsgUnreadCount < 0 ? 0 : this.$store.getters.getMsgUnreadCount
        },
        unread_total: function () {
            return this.$store.getters.getUnreadTotal < 0 ? 0 : this.$store.getters.getUnreadTotal
        }
    }
}
</script>

<style lang="less" scoped>
#nav {
    position: relative;
    .admin_tip {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        right: 10px;
        span.el-dropdown-link {
            margin-left: 20px;
        }
    }
}
.el-dropdown-link {
    cursor: pointer;
    color: #fff;
    font-size: 14px;
}
.el-icon-arrow-down {
    font-size: 12px;
}
</style>