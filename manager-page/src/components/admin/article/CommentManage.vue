<template>
    <div>
        <el-table
            :data="curComment"
            border
            style="width: 100%"
            height="400"
            :cell-class-name="setCell"
            v-loading="tableLoading"
        >
            <el-table-column prop="com_time" label="日期" width>
                <template slot-scope="scope">
                    <p>{{scope.row.com_time|date}}</p>
                </template>
            </el-table-column>
            <el-table-column prop="guest_id" label="微信名"></el-table-column>
            <el-table-column prop="com_content" label="评论内容" width="250"></el-table-column>
            <el-table-column prop="auth_is_read" label="已读">
                <template slot-scope="scope">
                    <span style="color:green;" v-if="scope.row.auth_is_read==1">是</span>
                    <span style="color:red;" v-else>否</span>
                </template>
            </el-table-column>
            <el-table-column prop="auth_response" label="已回复">
                <template slot-scope="scope">
                    <span style="color:green;" v-if="scope.row.auth_response.length!=0">是</span>
                    <span style="color:red;" v-else>否</span>
                </template>
            </el-table-column>
            <el-table-column label="操作">
                <template slot-scope="scope">
                    <el-button size="small" type="normal" @click="handleCheckComment(scope.$index, scope.row)" >查看</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)" >删除</el-button>
                </template>
            </el-table-column>
            <el-dialog
                title="评论详情"
                id="comment_detail"
                width="30%"
                :visible.sync="innerVisible"
                :append-to-body="true"
                :close-on-click-modal="false"
                :before-close="cancelReplyHandler"
            >
                <el-form label-width="100px" v-loading="detailLoading">
                    <el-form-item class="comment_detail">
                        <div class="chosen_content" v-html="commentDetail"></div>
                    </el-form-item>
                    <el-form-item class="comment_reply" v-if="responseDetail.length!=0">
                        <span>回复: </span>
                        <div v-for="(item,index) in responseDetail" :key="index" v-html="item.reply_content"></div>
                    </el-form-item>
                    <el-form-item v-if="replyVisible">
                        <el-input type="textarea" autosize placeholder="请输入回复内容" v-model="responseText"></el-input>
                    </el-form-item>
                    <el-form-item v-if="replyVisible">
                        <el-button round size="mini" type="primary" @click="sendReply">发送</el-button>
                        <el-button round size="mini" @click="cancelReply">取消</el-button>
                    </el-form-item>
                    <el-form-item v-if="!replyVisible&&responseDetail.length==0">
                        <el-button round size="mini" @click="replyVisible=true">回复</el-button>
                    </el-form-item>
                </el-form>
            </el-dialog>
        </el-table>
    </div>
</template>

<script>
export default {
    data() {
        return {
            innerVisible: false,
            commentDetail: null, // 当前选中的评论内容
            responseDetail: [], // 当前选中评论的回复列表内容
            commentID: null, // 当前评论的ID
            curComment: [], // 当前文章的评论列表
            tableLoading: false,
            detailLoading: false,
            replyVisible: false , // 回复弹窗是否出现
            responseText:"",  // 回复内容
        };
    },
    methods: {
        handleDelete(index, row) {  // 删除评论
            this.$confirm('永久删除该评论, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(_ => {
                this.tableLoading=true;
                this.$axios({
                    url: '/admin/comment/del',
                    method: 'post',
                    data: {
                        id: row._id
                    }
                }).then(res => {
                    if (res.data.code == 1) {
                        this.$message({
                            type: 'success',
                            message: "成功删除评论 !"
                        });
                        this.curComment = this.curComment.filter(v=>{
                            return v._id != row._id
                        });
                        this.upDateArc(row)
                    } else {
                        this.$message({
                            type: 'danger',
                            message: '删除失败, 请联系程序员 !'
                        });
                    }
                }).finally(_=>{
                    this.tableLoading=false
                })
            })
        },
        setCell(row, column, rowIndex, columnIndex) { // 设置类名来更改样式
            if (row.column.label === '评论内容'|| row.column.label === '日期') {
                return 'cell_content';
            }
        },
        handleCheckComment(index, row) { // 点击查看
            this.innerVisible = true;
            this.detailLoading=true;
            this.commentID = row._id;
            if(row.auth_is_read==0){ // 未读状态
                this.$axios({
                    url:"/admin/comment/read",
                    method:"post",
                    data:{
                        id:row._id
                    }
                }).then(res => {
                    // console.log('checked!!!',res);
                    if(res.data.code == 1){
                        this.commentDetail = row.com_content; // 当前评论内容
                        this.responseDetail = row.auth_response; // 当前评论的回复列表
                        this.curComment[index]['auth_is_read'] = 1; // 设置已读消息
                    }
                }).finally( _ => this.detailLoading = false )
            } else { // 已读状态
                this.detailLoading=false
                this.commentDetail = row.com_content // 当前评论内容
                this.responseDetail = row.auth_response; // 当前评论的回复列表
                this.curComment[index]['auth_is_read'] = 1; // 设置已读消息
            }
        },
        sendReply(){ // 发送回复
            // console.log(this.responseText);
            // console.log('当前选中文章的所有评论信息',this.curComment);
            // console.log("当前评论ID",this.commentID);
            this.detailLoading=true;
            let currentComment = this.curComment.filter(v => { // 获取当前评论的回复内容
                return v._id == this.commentID
            })[0];
            // 更新当前评论的回复内容
            currentComment.auth_response.push({
                reply_content: this.responseText,
                reply_time: new Date().getTime(),
                user_is_read: 0
            })
            // console.log('------------------');
            // console.log('currentComment:' , currentComment);
            // console.log(this.curChosenArcComment)
            // return
            this.$axios({
                url:"/admin/comment/reply",
                method:"post",
                data:{
                    id: this.commentID, // 评论id
                    openid: currentComment.openid, // 用户openid
                    content_id:currentComment.content_id, // 文章id
                    content_title: this.curChosenArcComment.title, // 文章标题
                    com_content: currentComment.com_content, // 用户评论内容
                    authResponse: currentComment["auth_response"] // 回复内容
                }
            }).then(res => {
                console.log(res);
                if(res.data.code == 1){
                    this.$message({ type: 'success', message: "回复成功! 对方将收到你的回复信息" });
                }else{
                    this.$message({ type: 'warning', message: res.data.errMsg });
                }
            }).finally(_=>{
                this.responseText = ""
                this.replyVisible = false
                this.detailLoading = false
            })
        },
        cancelReply(){ // 取消回复
            this.responseText="";
            this.replyVisible=false;
        },
        cancelReplyHandler(done){ // 关闭回复窗口
            this.responseText = ""
            this.replyVisible = false
            this.responseDetail = []
            done()
        }
        // replyVisible(){ // 

        // }
    },
    props: ['curChosenArcComment', 'upDateArc'],
    mounted() {
        this.curComment = this.curChosenArcComment.comment;
    },
    watch: {
        curChosenArcComment(nv, ov) {
            this.curComment = nv.comment;
        }
    }
};
</script>

<style lang="less" scoped></style>