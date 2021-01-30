// import Vue from 'vue'
// import Router from 'vue-router'
import AdminComponent from '@/components/admin/index.vue'

/* ********* 管理端 ********** */
import HomeComponent from '@/components/admin/home/Home.vue'
import UserManageComponent from '@/components/admin/user/UserManage.vue'
import CategoryManageComponent from '@/components/admin/category/CategoryManage.vue'
import ArticleManageComponent from '@/components/admin/article/ArticleManage.vue'
import MassageManageComponent from '@/components/admin/massage/MassageManagement.vue'
import LoginComponent from '@/components/admin/login/Login'
// import ResumeComponent from "@/components/admin/resume/ResumeManagement"
/* ********* 管理端 ********** */

//import VueRouter from 'vue-router'  引入的vue-router
const VueRouterPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(to) {
   	return VueRouterPush.call(this, to).catch(err=> err)
}


export default new VueRouter({
    routes: [
        {
            path: '/',
            name: 'home',
            redirect: { name: "adminhome" }
        },
        // 后台管理页登陆页面
        {
            path: '/login',
            name: 'login',
            component: LoginComponent
        },
        // 管理后台路由
        {
            path: '/admin',
            name: 'admin',
            component: AdminComponent,
            children: [
                {
                    path: 'home',
                    name: 'adminhome',
                    component: HomeComponent
                },
                {
                    path: 'category',
                    name: 'category',
                    component: CategoryManageComponent
                },
                {
                    path: 'article',
                    name: 'article',
                    component: ArticleManageComponent
                },
                {
                    path: 'massage',
                    name: 'massage',
                    component: MassageManageComponent
                },
                // {
                //     path: 'resume',
                //     name: 'resume',
                //     component: ResumeComponent
                // }
            ]
        }
    ],
    scrollBehavior(to, from, savedPosition) {
        return {
            x: 0,
            y: 0
        }
    }
});

