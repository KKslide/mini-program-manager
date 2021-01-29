import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)
/**
 * 状态管理，后期可以考虑拆分成modules
 */
export default new Vuex.Store({
    state: {
        comment_unread_count: 0, // 文章
        msg_unread_count: 0, // 留言
        unread_total: 0 // 总数
    },
    mutations: {
        setState(state, statObj) {
            state.comment_unread_count = statObj ? statObj.comment_unread_count : 0
            state.msg_unread_count = statObj ? statObj.msg_unread_count : 0
            state.unread_total = statObj ? state.comment_unread_count + state.msg_unread_count : 0
        },
        unReadDecrease(state, type) { // 已读减1
            state[type] -= 1
        }
    },
    getters: {
        getComUnreadCount(state) { // 文章
            return state.comment_unread_count
        },
        getMsgUnreadCount(state) { // 评论
            return state.msg_unread_count
        },
        getUnreadTotal(state) { // 未读总数
            return state.comment_unread_count + state.msg_unread_count
        }
    }
})
