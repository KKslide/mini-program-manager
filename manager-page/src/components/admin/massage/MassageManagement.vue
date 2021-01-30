<template>
    <div id="massage_list">
        <!-- 留言查询 -->
        <el-form :inline="true" :model="msgSearch" class="article_search" label-width="80px" size="mini">
            <el-form-item label="时间范围">
                <el-date-picker
                    v-model="msgSearch.rangeTime"
                    type="datetimerange"
                    value-format="timestamp"
                    :picker-options="pickerOptions"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    clearable
                    align="right">
                </el-date-picker>
            </el-form-item>
            <el-form-item label="用户昵称">
                <el-input v-model="msgSearch.guest_name" placeholder="请输入要搜索的用户昵称" clearable></el-input>
            </el-form-item>
            <el-form-item label="留言内容">
                <el-input v-model="msgSearch.message" placeholder="请输入要搜索的留言内容" clearable></el-input>
            </el-form-item>
            <el-form-item label="是否已读">
                <el-select v-model="msgSearch.auth_is_read" placeholder="选择是否已读" clearable popper-class="more_padding_bottom">
                    <el-option label="已读" :value="1"></el-option>
                    <el-option label="未读" :value="0"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="searchHandler" class="el-icon-search"> 查询</el-button>
            </el-form-item>
        </el-form>
        <!-- 留言列表 -->
        <el-table :data="tableData" v-loading="tableLoading" border stripe style="width: 100%" :cell-class-name="setCell">
            <el-table-column prop="addtime" label="日期" sortable>
                <template slot-scope="scope">
                    <span>{{scope.row.addtime|date}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="guest_name" label="微信头像/昵称">
                <template slot-scope="scope">
                    <img :src="scope.row.guest_avatar" width="60px" style="border-radius:50%;margin-right:15px;">
                    <span v-html="scope.row.guest_name"></span>
                </template>
            </el-table-column>
            <el-table-column prop="message" label="内容"></el-table-column>
            <el-table-column prop="auth_is_read" label="已读" sortable>
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
                    <el-button size="mini" @click="dialog=true; handleCheck(scope.$index, scope.row)" >查看</el-button>
                    <el-button size="mini" type="danger" @click="handleDelete(scope.$index, scope.row)" >删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <!-- 弹窗组件 -->
        <msg-detail :msgDetailData="chosenMSG"></msg-detail>
        <!-- 弹窗组件 -->
        <el-divider></el-divider>
        <!-- 分页组件 -->
        <el-pagination
            background
            layout="prev, pager, next"
            :page-size="pageSize"
            :page-count="pages"
            :total="total"
            @current-change="pageChange"
        ></el-pagination>
        <!-- 分页组件 -->
    </div>
</template>

<script>
import msgDetail from "./MsgDetail"
import {deepClone} from "../../../utils/utils"
export default {
    data() {
        return {
            tableData: [],
            curPage: 1,
            pageSize:5,
            total: 1,
            pages: 1,
            detailLoading: false, // 留言回复框loading
            chosenMSG: {},
            tableLoading:true,
            msgSearch:{
                rangeTime: "",
                auth_is_read: "",
                guest_name: "",
                message: ""
            }, 
            pickerOptions: {
                shortcuts: [{
                    text: '最近一周',
                    onClick(picker) {
                    const end = new Date();
                    const start = new Date();
                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                    picker.$emit('pick', [start, end]);
                    }
                }, {
                    text: '最近一个月',
                    onClick(picker) {
                    const end = new Date();
                    const start = new Date();
                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                    picker.$emit('pick', [start, end]);
                    }
                }, {
                    text: '最近三个月',
                    onClick(picker) {
                    const end = new Date();
                    const start = new Date();
                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
                    picker.$emit('pick', [start, end]);
                    }
                }]
            },
        }
    },
    components:{
        'msg-detail':msgDetail
    },
    mounted() {
        this.getMassageList()
    },
    methods: {
        handleCheck(index, row) { // 点击查看评论
            this.chosenMSG = deepClone(Object.assign({index:index},row));
            this.tableData[index].auth_is_read=1
        },
        setRespliedStatus(index,data){ // 变更状态
            this.tableData[index].auth_response = data
        },
        clearCurChosenMSG() { // 清除掉当前选中的评论状态
            Object.keys(this.chosenMSG).forEach(v => {
                this.chosenMSG[v] = ""
            })
        },
        handleDelete(index, row) { // 删除评论操作
            this.$confirm('永久删除该条留言吗, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.$axios({
                    url: "/admin/message/del",
                    data: { id: row._id },
                    method: "post"
                }).then(res => {
                    if (res.data.code == 0) {
                        this.$message({ type: 'success', message: res.data.msg });
                    } else {
                        this.$message({ type: 'warning', message: res.data.msg });
                    }
                    this.$store.commit('unReadDecrease', 'msg_unread_count')
                }).then(_ => {
                    this.tableLoading=true;
                    this.getMassageList();
                });
            });
        },
        setCell(row, column, rowIndex, columnIndex) { // 设置类名来更改样式
            if (row.column.label === '内容') {
                return 'cell_nowrap'
            }
        },
        getMassageList() { // 获取留言数据
            this.$axios({
                url: "/admin/message/get",
                method: "post",
                params: Object.assign( this.msgSearch || {}, { pageNo: this.curPage, pageSize: this.pageSize })
            }).then(res => {
                this.tableData = res.data.data;
                this.total = res.data.total;
                this.pages = Math.ceil(this.total / this.pageSize); // 总页数
                this.tableLoading=false
            }).catch(err=>{
                console.log(err);
                if(err.response.status == 401){
                    this.$notify.error({
                        customClass:'notify_no_border',
                        title: '提示',
                        message: '没有登陆, 要先去登陆先',
                        duration: 0
                    });
                }
                this.tableLoading=false;
                this.$router.push({ name: 'login' })
            })
        },
        pageChange(currentPage) { // 翻页
            this.tableLoading=true;
            this.curPage = currentPage;
            this.getMassageList();
        },
        searchHandler(){ // 留言搜索
            // console.log('搜索');
            // console.log(this.msgSearch);
            this.tableLoading=true;
            this.getMassageList()
        },
        fixedTime (val) { // 双精度字符串转日期
            let date = new Date(Number(val));
            return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours() >= 10 ? date.getHours() : '0' + date.getHours()}:${date.getMinutes() >= 10 ? date.getMinutes() : '0' + date.getMinutes()}:${date.getSeconds() >= 10 ? date.getSeconds() : '0' + date.getSeconds()}`
        }
    },
}
</script>

<style lang="less" scoped>
#massage_list {
    padding: 15px;
}
.chosen_content {
    border: 1px solid #e4e7ed;
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 0 15px;
}
</style>