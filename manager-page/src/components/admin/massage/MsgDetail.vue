<template>
    <div>
        <el-dialog
            title="留言详情"
            :visible.sync="dialogTableVisible"
            :close-on-click-modal="false"
            :before-close="cancelReplyHandler"
        >
            <el-form label-position="right" label-width="100px" v-loading="detailLoading" >
                <el-form-item label="时间">
                    <div class="chosen_content">{{addtime}}</div>
                </el-form-item>
                <el-form-item label="昵称">
                    <el-input v-model="guest_name" disabled class="disabled" ></el-input>
                </el-form-item>
                <el-form-item label="内容">
                    <div v-html="message" class="chosen_content"></div>
                </el-form-item>
                <el-form-item class="comment_reply" v-if="auth_response.length!=0">
                    <span>回复: </span>
                    <div v-for="(item,index) in auth_response" :key="index" v-html="item.reply_content"></div>
                </el-form-item>
                <el-form-item v-if="replyVisible">
                    <el-input type="textarea" autosize placeholder="请输入回复内容" v-model="responseText"></el-input>
                </el-form-item>
                <el-form-item v-if="replyVisible">
                    <el-button round size="mini" type="primary" @click="sendReply">发送</el-button>
                    <el-button round size="mini" @click="cancelReply">取消</el-button>
                </el-form-item>
                <el-form-item v-if="!replyVisible&&auth_response.length==0">
                    <el-button round size="mini" @click="replyVisible=true">回复</el-button>
                </el-form-item>
            </el-form>
            <!-- <span slot="footer" class="dialog-footer">
                <el-button type="primary" @click="dialogTableVisible=false" >确定</el-button >
            </span> -->
        </el-dialog>
    </div>
</template>

<script>
export default {
    props: ['msgDetailData'],
    data () {
        return {
            detailLoading: false, // 表单loading
            dialogTableVisible: false, // 回复弹窗显示/关闭
            replyVisible: false,
            responseText:"",
            index:0, // 当前选中评论的索引
            msgId:"",
            addtime: "",
            auth_is_read: "",
            auth_response: [],
            guest_avatar: "",
            guest_name: "",
            message: "",
            openid:""
        }
    },
    methods: {
        readMsg(readFalg,id){ // 变更读取状态
            if(readFalg==0){
                this.detailLoading = true;
                this.$axios({
                    url:"/admin/message/read",
                    method:"post",
                    data:{
                        id:id
                    }
                }).then(res=>{
                    // console.log(res);
                    // if(res.data.code == 1){ // 变更读取状态
                    //     this.$message()
                    // }
                }).catch(err=>{
                    console.log(err);
                }).finally(_=>{
                    this.detailLoading = false
                })
            }
        },
        sendReply(){ // 发送回复
            this.replyVisible=false // 1- 关闭回复按钮
            this.auth_response.push({
                reply_content: this.responseText,
                reply_time: new Date().getTime(),
                user_is_read: false
            })
            let reqObj = {
                openid: this.openid,
                msgId: this.msgId,
                replyContent: this.responseText,
                authResponse: this.auth_response
            }
            this.$axios({
                url:"/admin/message/reply",
                data:reqObj,
                method:"post"
            }).then(res=>{
                console.log(res);
                if(res.data.code == 1){
                    this.$message({ type: 'success', message: "回复成功! 对方将收到你的回复信息" });
                }else{
                    this.$message({ type: 'warning', message: res.data.errMsg });
                }
            }).catch(err=>{
                console.log('请求错误: ', err);
            }).finally(_=>{
                this.$parent.setRespliedStatus(this.index,this.auth_response) // 2- 变更父组件未回复状态
                this.responseText="" // 3- 清空输入框
            })
        },
        cancelReply(){ // 取消回复
            this.responseText="";
            this.replyVisible=false;
        },
        cancelReplyHandler (done) { // 关闭modal窗口
            this.$parent.clearCurChosenMSG()
            done()
        },
    },
    mounted () {
    },
    watch: {
        msgDetailData (nv, ov) {
            this.index = nv.index;
            this.msgId = nv._id;
            this.addtime = nv.addtime;
            this.auth_is_read = nv.auth_is_read;
            this.auth_response = JSON.parse(JSON.stringify(nv.auth_response));
            this.guest_avatar = nv.guest_avatar;
            this.guest_name = nv.guest_name;
            this.message = nv.message;
            this.openid = nv.openid;
            this.readMsg(this.auth_is_read,this.msgId)
            this.dialogTableVisible = true;
        }
    }
}
</script>

<style lang="less" scoped>
</style>