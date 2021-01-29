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
            <el-dropdown>
                <span class="el-dropdown-link">
                    <i class="el-icon-bell el-icon--left"></i>
                    <span style="color: red">{{unread_total}}</span>
                </span>
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item>评论消息{{comment_unread_count}}</el-dropdown-item>
                    <el-dropdown-item>留言消息{{msg_unread_count}}</el-dropdown-item>
                    <el-dropdown-item>全部已读</el-dropdown-item>
                </el-dropdown-menu>
            </el-dropdown>
            <span class="el-dropdown-link" @click="logout">
                <i class="el-icon-thumb"></i>
                退出登陆
            </span>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            activeIndex: this.$route.name,
            unread_data: null
        };
    },
    created() {
        this.$axios({
            url: "/admin/getUnread",
            method: "post"
        }).then(res => {
            console.log(res);
            if (res.data.code == 1) {
                this.$store.commit('setState', res.data.data)
            }
        })
    },
    beforeDestroy() {
        // console.log('页面销毁');
    },
    methods: {
        handleSelect(key, keyPath) {
            if (key != null) this.$router.push({ name: key })
        },
        logout() {
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
        $route(to, from) {
            this.activeIndex = to.name
        }
    },
    computed: {
        comment_unread_count: function() {
            return this.$store.getters.getComUnreadCount
        },
        msg_unread_count: function() {
            return this.$store.getters.getMsgUnreadCount
        },
        unread_total: function() {
            return this.$store.getters.getUnreadTotal
        }
    }
}
</script>

<style lang="less" scoped>
#nav {
    margin-top: 10px;
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
}
.el-icon-arrow-down {
    font-size: 12px;
}
</style>