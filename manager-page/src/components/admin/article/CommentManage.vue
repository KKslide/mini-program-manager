<template>
    <div>
        <el-table
            :data="curComment"
            border
            style="width: 100%"
            :cell-class-name="setCell"
            v-loading="tableLoading"
        >
            <el-table-column prop="com_time" label="日期" width>
                <template slot-scope="scope">
                    <p>{{scope.row.com_time|date}}</p>
                </template>
            </el-table-column>
            <el-table-column prop="guest_id" label="微信名"></el-table-column>
            <el-table-column prop="com_content" label="评论内容" width="400"></el-table-column>
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
                append-to-body
            >
                <el-form label-width="100px">
                    <el-form-item>
                        <div class="chosen_content" v-html="commentDetail"></div>
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
            commentDetail: '',
            curID: null, // 当前文章ID
            curComment: [], // 当前文章的评论列表
            tableLoading:false
        };
    },
    methods: {
        handleDelete(index, row) {
            this.$confirm('永久删除该评论, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(_ => {
                this.tableLoading=true;
                /* 删除评论操作 */
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
            if (row.column.label === '留言内容') {
                return 'cell_content';
            }
        },
        handleCheckComment(index, row) {
            this.innerVisible = true;
            this.commentDetail = row.com_content;
        },
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

<style lang="less" scoped>
.chosen_content {
    border: 1px solid #e4e7ed;
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 0 15px;
}
</style>