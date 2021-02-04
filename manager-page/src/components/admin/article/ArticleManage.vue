<template>
    <div id="article">
        <!-- 文章搜索 -->
        <el-form :inline="true" :model="articleSearch" class="article_search" label-width="80px" size="mini">
            <el-form-item label="文章标题">
                <el-input v-model="articleSearch.title" placeholder="请输入要搜索的文章标题" clearable></el-input>
            </el-form-item>
            <el-form-item label="文章分类">
                <el-select v-model="articleSearch.category" placeholder="选择分类" clearable popper-class="more_padding_bottom">
                    <el-option v-for="v in categoryData.filter(v=>{return v.name!='HOT'})" :key="v.id"  :label="v.name" :value="v.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
                <el-date-picker
                    v-model="articleSearch.rangeTime"
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
            <el-form-item>
                <el-button type="primary" @click="searchHandler" class="el-icon-search"> 查询</el-button>
            </el-form-item>
        </el-form>
        
        <!-- 文章列表 -->
        <el-table :data="articleData" v-loading="tableLoading" border height="600" :cell-class-name="setIdColumn">
            <el-table-column prop="id" label="文章ID"></el-table-column>
            <el-table-column prop="poster" label="缩略图" width="130px">
                <template slot-scope="scope">
                    <!-- 120 x 96 -->
                    <el-image style="width: 80px; height: 64px" :src="scope.row.poster" fit="cover" ></el-image>
                </template>
            </el-table-column>
            <el-table-column prop="title" label="文章标题"></el-table-column>
            <el-table-column prop="category" label="文章分类" width="120px"></el-table-column>
            <el-table-column prop="addtime" label="添加时间" sortable>
                <template slot-scope="scope">
                    <p>{{scope.row.addtime|date}}</p>
                </template>
            </el-table-column>
            <el-table-column prop="edittime" label="修改时间" sortable>
                <template slot-scope="scope">
                    <p>{{scope.row.edittime|date}}</p>
                </template>
            </el-table-column>
            <el-table-column prop="viewnum" label="阅读量" width="100px" sortable></el-table-column>
            <el-table-column prop="comment" label="评论" width="100px">
                <!--  :class="scope.row.comment.filter(v=>{return v.auth_is_read==0}).length>0?'hasNew':''" -->
                <template slot-scope="scope">
                    <el-button @click="checkComment(scope.row)" type="text" size="normal" >
                        {{scope.row.comment.length}}
                    </el-button>
                    <span class="hasNew" v-if="scope.row.comment.filter(v=>{return v.auth_is_read==0}).length>0">new</span>
                </template>
            </el-table-column>
            <el-table-column prop="isShow" label="是否显示" width="120px" sortable>
                <template slot-scope="scope">
                    <p>{{scope.row.isShow=="1"?"是":"否"}}</p>
                </template>
            </el-table-column>
            <el-table-column prop="isHot" label="是否热文" width="120px" sortable>
                <template slot-scope="scope">
                    <p>{{scope.row.isHot=="1"?"是":"否"}}</p>
                </template>
            </el-table-column>
            <el-table-column label="操作">
                <template slot-scope="scope">
                    <el-button size="mini" @click="dialog=true; editorInit(); handleEdit(scope.$index, scope.row)" >编辑</el-button>
                    <el-button size="mini" type="danger" @click="handleDelete(scope.$index, scope.row)" >删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 评论列表弹窗 -->
        <el-dialog :title="'文章【'+curChosenArcData.title+'】的评论'" :visible.sync="commentModel" :modal-append-to-body="true" width="80%" center :close-on-click-modal="false">
            <CommentCom :curChosenArcComment="curChosenArcData" :upDateArc="upDateComment"></CommentCom>
        </el-dialog>
        <!-- 评论列表弹窗 -->

        <!-- 添加文章按钮 -->
        <el-button
            type="text"
            class="el-icon-circle-plus"
            @click="
                dialog = true;
                dialogType = 'add';
                drawer_title = '添加文章';
                minpic_url_list = [];
                imageUrl = '';
                rest();
                editorInit();
            "
            > 添加文章</el-button
        >

        <el-divider class="pager_divider"></el-divider>
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

        <!-- 抽屉组件 - 新增或者编辑 -->
        <el-drawer
            :title="drawer_title"
            :before-close="handleClose"
            :visible.sync="dialog"
            :destroy-on-close="true"
            direction="btt"
            custom-class="demo-drawer"
            ref="drawer"
            size="95%"
            :modal-append-to-body="true"
            v-loading="drawerLoading"
        >
            <div class="demo-drawer__content" style="padding:0 15px 10px 15px;">
                <el-form :model="form" ref="form" :rules="rules">
                    <!-- 文章标题 -->
                    <el-form-item label="文章标题" :label-width="formLabelWidth" prop="title">
                        <el-input v-model="form.title" autocomplete="off" placeholder="文章标题不要太长"></el-input>
                    </el-form-item>
                    <!-- 是否显示 -->
                    <el-form-item label="显示与推送" :label-width="formLabelWidth">
                        <el-col :span="10">
                            <span>是否显示 </span>
                            <el-switch
                                v-model="form.isShow"
                                active-color="#13ce66"
                                inactive-color="#ff4949"
                                active-value="1"
                                inactive-value="0"
                            ></el-switch>(绿色为开启显示,选择关闭则不会在页面中显示)
                        </el-col>
                        <el-col :span="11">
                            <span>是否推送热文 </span>
                            <el-switch
                                v-model="form.isHot"
                                active-color="#13ce66"
                                inactive-color="#ff4949"
                                active-value="1"
                                inactive-value="0"
                            ></el-switch>(绿色为推送热文,选择关闭则不会在热文中显示)
                        </el-col>
                    </el-form-item>
                    <!-- 文章分类 -->
                    <el-form-item label="文章分类" :label-width="formLabelWidth" prop="category">
                        <el-select v-model="form.category" placeholder="请选文章分类" popper-class="contentManageDialog">
                            <el-option v-for="(v,i) in categoryData" :key="i" :label="v.name" :value="v.id" ></el-option>
                        </el-select>
                    </el-form-item>
                    <!-- 文章简介 -->
                    <el-form-item label="文章简介" :label-width="formLabelWidth" prop="description">
                        <el-input v-model="form.description" autocomplete="off" placeholder="请填写简介"></el-input>
                    </el-form-item>
                    <!-- 视频链接 -->
                    <el-form-item label="视频链接" :label-width="formLabelWidth" >
                        <el-input v-model="form.video_src" autocomplete="off" placeholder="请填写常规视频地址"></el-input>
                    </el-form-item>
                    <!-- 缩略图 -->
                    <el-form-item label="缩略图" :label-width="formLabelWidth" prop="poster">
                        <form id="minPicForm" method="post" enctype="multipart/form-data">
                            <!-- 单图片上传 -->
                            <el-upload
                                class="avatar-uploader"
                                v-model="form.poster"
                                action="'string'"
                                list-type="picture-card"
                                :auto-upload="false"
                                :show-file-list="false"
                                :on-change="handleCrop"
                                :http-request="upload"
                            >
                                <img
                                    v-if="imageUrl"
                                    :src="imageUrl"
                                    class="avatar"
                                    ref="singleImg"
                                    @mouseenter="mouseEnter"
                                    @mouseleave="mouseLeave"
                                    :style="{width:width+'px',height:height+'px'}"
                                />
                                <i
                                    v-else
                                    class="el-icon-plus avatar-uploader-icon"
                                    :style="{width:width+'px',height:height+'px','line-height':height+'px','font-size':height/6+'px'}"
                                ></i>
                                <!-- 单图片上传状态显示 -->
                                <!-- <div v-if="imageUrl" class="reupload" ref="reupload" @click.stop="handlePreviewSingle" @mouseenter="mouseEnter" @mouseleave="mouseLeave" :style="{width:reuploadWidth+'px',height:reuploadWidth+'px','line-height':reuploadWidth+'px','font-size':reuploadWidth/5+'px'}">重新上传</div> -->
                                <div
                                    id="uploadIcon"
                                    v-if="imageUrl"
                                    ref="reupload"
                                    @mouseenter="mouseEnter"
                                    @mouseleave="mouseLeave"
                                    :style="{width:'100%'}"
                                >
                                    <i
                                        class="el-icon-zoom-in"
                                        title="查看原图"
                                        @click.stop="handlePreviewSingle"
                                        :style="{color:'#2E2E2E',fontSize:'25px',display:'inline-block',paddingRight:'15px'}"
                                    ></i>
                                    <i
                                        class="el-icon-refresh-right"
                                        title="重新上传"
                                        :style="{color:'#2E2E2E',fontSize:'25px',display:'inline-block'}"
                                    ></i>
                                </div>
                                <div
                                    class="reupload"
                                    ref="uploading"
                                    :style="{width:reuploadWidth+'px',height:reuploadWidth+'px','line-height':reuploadWidth+'px','font-size':reuploadWidth/5+'px'}"
                                >上传中..</div>
                                <div
                                    class="reupload"
                                    ref="failUpload"
                                    :style="{width:reuploadWidth+'px',height:reuploadWidth+'px','line-height':reuploadWidth+'px','font-size':reuploadWidth/5+'px'}"
                                >上传失败</div>
                            </el-upload>
                            <el-dialog :visible.sync="posterDialogVisible" :modal-append-to-body="true">
                                <img width="100%" :src="dialogImageUrl" alt />
                            </el-dialog>
                            <!-- 剪裁组件弹窗 -->
                            <el-dialog :visible.sync="cropperModel" width="800px" :before-close="beforeClose" :modal-append-to-body="true" >
                                <Cropper :img-file="file" ref="vueCropper" :fixedNumber="fixedNumber" @upload="upload" ></Cropper>
                            </el-dialog>
                            <!-- 剪裁组件弹窗 -->
                            <!-- 新上的cropper组件 -->
                        </form>
                    </el-form-item>
                    <!-- 文章内容 -->
                    <el-form-item label="文章内容" :label-width="formLabelWidth" prop="composition">
                        <div id="wangEditor"></div>
                    </el-form-item>
                </el-form>
                <div class="demo-drawer__footer" style="margin-bottom:10px;">
                    <el-button @click="dialog = false; editorDestroy();">取 消</el-button>
                    <el-button type="primary" @click="submit" :loading="loading" >{{ loading ? '提交中 ...' : '确 定' }}</el-button>
                </div>
            </div>
        </el-drawer>
    </div>
</template>

<script>
import CommentCom from './CommentManage' // 评论模块
import Cropper from './cropper/Cropper' // 裁切模块
// import hljs from 'highlight.js'
import cropper_config from './cropper/cropper_config' // Cropper插件的配置
import { IsURL, deepClone, BFS, getStyle } from "../../../utils/utils" // util函数
export default {
    data() {
        return {
            originArticleData: null, // 接口传过来的
            articleData: [], // 转化好的文章列表格式
            // 搜索功能配置-----------------------------------
            articleSearch:{ // 文章搜索form表单
                title:"", // 标题
                category:"", // 分类
                rangeTime:"", // 时间范围
                isShow: "1"
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
            // 搜索功能配置-----------------------------------
            total: 1, // 总条数
            pages: 1, // 总页数
            pageSize: 10, // 页容量(每页多少条)
            curPage: 1, // 当前页
            drawer_title: '',
            imageUrl: '', // 文章title缩略图
            categoryData: [], // 分类列表
            table: false,
            dialog: false,
            dialogType: null, // 判断是添加还是编辑
            loading: false,
            tableLoading:true, // 表格loading
            drawerLoading: false, // 编辑框上传图片时的loading
            editorLoading: null, // 编辑器文案添加图片的loading
            curChosenArcData: {}, // 当前选中文章的评论数据
            commentModel: false, // 评论模块弹窗
            hideUpload: false, //   缩略图上传按钮隐藏
            limitCount: 1, //   缩略图上传按钮隐藏
            minpic_url_list: [], // 缩略图列表
            //   cropper配置------------------------------------------------------
            file: '', // 当前被选择的图片文件
            imageUrl: '', // 单图情况框内图片链接
            dialogImageUrl: '', // 多图情况弹窗内图片链接
            uploadList: [], // 上传图片列表
            reupload: true, // 控制"重新上传"开关
            dialogVisible: false, // 展示弹窗开关
            posterDialogVisible: false,
            cropperModel: false, // 剪裁组件弹窗开关
            reuploadWidth: this.height * 0.7, // 动态改变”重新上传“大小
            //   cropper配置------------------------------------------------------

            form: {
                title: '', // 文章标题
                category: '', // 文章分类
                description: '', // 文章简述
                video_src: '', // 视频地址
                composition: '', // 文章内容
                poster: '', // 缩略图
                isShow:"1", // 文章是否显示  "1"-显示;"0"-不显示
                isHot: "1", // 文章是否推送到HOT类目  "1"-推送;"0"-不推送
            },
            isShow: "1", // 文章是否显示
            isHot: "1", // 文章是否推送热文
            formLabelWidth: '100px',
            editor: null, // wangEditor编辑器实例
            rules: { // 校验规则
                title: [{ required: true, message: '写一下文章标题啦', trigger: 'blur' }],
                category: [{ required: true, message: '选一下文章类型啦', trigger: 'blur' }],
                poster: [{ required: true, message: '没有上传封面图片噢', trigger: 'blur' }],
                description: [{ required: true, message: '写一下文章描述啦', trigger: 'blur' }],
                composition: [{ required: true, message: '文章没有写东西呢', trigger: 'blur' }],
            },
        }
    },
    //   *************cropper组件配置****************
    props: cropper_config,
    //   *************cropper组件配置****************
    components: {
        Cropper,
        CommentCom
    },
    created() {
        this.getCates().then(_=>{
            this.getArticles();
        })
    },
    mounted() {
        if (typeof this.initUrl === 'string') {
            this.imageUrl = this.initUrl
        } else {
            this.uploadList = this.formatImgArr(this.initUrl)
        }
        this.$EventBus.$on("navUnreadMSGClick", (msg) => {
            this.$store.commit('setIscheckUnread',true)
            console.log(msg);
            this.tableLoading=true
            this.getArticles()
        });
    },
    updated() {
        if (this.$refs.vueCropper) {
            this.$refs.vueCropper.Update()
        }
    },
    computed: {
        isCheckUnread: function(){ // 是否为检索有未读消息的文章
            return this.$store.getters.isCheckUnread
        }
    },
    watch: {
        initUrl: function (val) {
            // 监听传入初始化图片
            console.info('watch')
            console.info(val)
            if (val) {
                if (typeof this.initUrl === 'string') {
                    this.imageUrl = val
                } else {
                    this.uploadList = this.formatImgArr(val)
                }
            }
        },
        // isCheckUnread(nv,ov){
        //     this.getArticles(this.articleSearch)
        // }
    },
    methods: {
        rest() { //   重置表单
            for (var key in this.form) {
                this.form[key] = ''
            }
        },
        handleClose(done) { //   在关闭窗口前的处理操作
            this.confirmClose(this.close, done)
        },
        confirmClose(flag, done) { // 确认删除
            if (flag) {
                done();
                this.flag = null;
                return false;
            }
            this.$confirm('保存草稿功能未开放, 确定要关闭吗 ?')
                .then(_ => {
                    this.editorDestroy()
                    done();
                })
                .catch(_ => { });
        },
        setIdColumn({ row, column, rowIndex }) { // cell不换行
            if (column.property == 'id' || column.property == 'title' || column.property == 'addtime' || column.property == 'edittime') {
                return 'cell_nowrap'
            }
            else if (column.label == '操作') {
                return 'btn_flex'
            }
        },
        getArticles(searchObj) {  // 获取文章列表
            let postUrl = !this.isCheckUnread
                ? "/admin/articles" 
                : "/admin/articles/commentunread" // 不查询未读消息的文章列表
            this.$axios({ url: postUrl, params:Object.assign(searchObj||{}, { pageNo: this.curPage, pageSize: this.pageSize }), method: 'post' })
                .then(res => {
                    this.total = res.data.total; // 总共的数量
                    this.pages = Math.ceil(this.total / this.pageSize); // 总页数
                    // 先保存原格式的文章信息
                    this.originArticleData = res.data.data;
                    var newContents = [];
                    res.data.data.forEach(v => {
                        newContents.push({
                            id: v._id,
                            title: v.title,
                            category:v.category[0].name,
                            addtime: v.addtime,
                            edittime:v.edittime,
                            viewnum: v.viewnum,
                            isShow: v.isShow,
                            isHot: v.isHot,
                            comment: v.comment,
                            poster:v.poster
                        })
                    })
                    this.articleData = newContents; // 格式化后的文章信息
                    this.tableLoading = false;
                })
        },
        upDateComment(params) { // 更新评论数
            // console.log(params);
            // console.log(this.curChosenArcData);
            this.curChosenArcData.comment = this.curChosenArcData.comment.filter(v=>{
                return v._id != params._id
            })
        },
        checkComment(params) { // 查看评论模块
            this.commentModel = true;
            this.curChosenArcData = params;
        },
        pageChange(currentPage) { // 点击分页按钮
            this.curPage = currentPage;
            this.tableLoading=true;
            this.getArticles();
        },
        getCates() { // 获取文章分类
            var params = { serchType:'all'};
            return new Promise((resolve,reject)=>{
                this.$axios({ url: '/admin/category/get',params, method:"post" })
                    .then(res => {
                        this.categoryData = res.data.data.filter(v=>{
                            return v.name!='HOT'
                        }).map((v,i)=>{
                            return {
                                name: v.name,
                                id:v._id
                            }
                        })
                        resolve()
                    })
                    .catch(err=>{
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
            })
        },
        submit() { // 文章提交事件
            this.$refs.form.validate((valid) => {
                if (!valid) { // 如果不合法
                    return
                } else {
                    if (this.form.category == 'unknown') {
                        this.$message({ type: 'warning', message: '请选择一个文章分类' })
                        return
                    }
                    if (this.dialogType == 'add') { // 添加文章
                        // this.form.composition = this.transFormedArticle(this.form.composition);
                        this.$axios({
                            url: "/admin/articles/add",
                            method: "post",
                            data: this.form
                        }).then(res => {
                            if (res.data.code == 1) {
                                this.$message({
                                    type: 'success',
                                    message: "添加文章成功 !"
                                });
                            } else {
                                this.$message({
                                    type: 'danger',
                                    message: '添加失败, 请联系管理员 !'
                                });
                            }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
                        }).then(() => {
                            this.tableLoading=true;
                            this.getArticles();
                            this.close = true;
                            this.$refs.drawer.closeDrawer();
                        })
                    }
                    if (this.dialogType == 'edit') { // 编辑文章
                        // this.form.composition = this.transFormedArticle(this.form.composition);
                        this.$axios({
                            url: '/admin/articles/edit',
                            method: 'post',
                            data: this.form
                        }).then(res => {
                            if (res.data.code == 1) {
                                this.$message({
                                    type: 'success',
                                    message: "修改文章成功 !"
                                });
                            } else {
                                this.$message({
                                    type: 'danger',
                                    message: '修改失败, 请联系管理员 !'
                                });
                            }
                        }).then(() => {
                            this.tableLoading=true;
                            this.getArticles(this.articleSearch);
                            this.close = true;
                            this.$refs.drawer.closeDrawer();
                        })
                    }
                }
            });
        },
        handleDelete(index, row) { // 删除文章
            this.$confirm('永久删除文章【"' + row.title + '】", 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.$axios({
                    url: '/admin/articles/del',
                    method: 'post',
                    data: { id: row.id }
                }).then(res => {
                    if (res.data.code == 1) {
                        this.$message({
                            type: 'success',
                            message: "删除文章成功 !"
                        });
                    } else {
                        this.$message({
                            type: 'danger',
                            message: '删除失败, 请联系管理员 !'
                        });
                    }
                }).then(() => {
                    this.tableLoading=true;
                    this.getArticles();
                })
            }).catch(() => {
                this.$message({
                    type: 'info',
                    message: '已取消删除'
                });
            });

        },
        handleEdit(index, row) { // 编辑文章
            this.$nextTick(_=>{
                this.minpic_url_list = [] // 1-清空缩略图
                let nowForm = deepClone(this.originArticleData.filter(v => { return v._id == row.id })[0]); // 2-过滤出当前编辑的数据
                nowForm.category = this.categoryData.filter(v=>{ return v.name == row.category })[0].id; // 4-重新设置分类id
                if (nowForm.poster != "") { // 5-重新设置当前数据的文章缩略图
                    this.minpic_url_list.push({ url: nowForm.poster })
                    this.imageUrl = nowForm.poster
                } else {
                    this.hideUpload = false
                }
                this.form = nowForm; // 6-覆盖当前正在编辑的数据
                this.dialogType = 'edit'; // 7-设置当前状态为编辑状态
                this.$nextTick(_=>{
                    this.editor.txt.html(this.form.composition);
                })
            })
        },
        searchHandler(){ // 文章搜索 - 要将是否为未回复查询的状态改回false
            this.$store.commit('setIscheckUnread',false)
            this.tableLoading = true;
            this.getArticles(this.articleSearch)
        },

        /* ********* wangEditor编辑器的配置 *********** */
        editorInit () { // wangEditor编辑器的配置
            this.$nextTick(_=>{
                this.editor = new wangEditor("#wangEditor");
                // this.editor.highlight = hljs; // 代码高亮
                Object.assign(this.editor.config, {
                    height:180,
                    showFullScreen: true, // 是否显示全屏按钮
                    uploadImgAccept: ["jpg", "jpeg", "png", "gif", "bmp"], // 限制上传图片类型
                    uploadImgMaxLength: 1, // 一次最多上传 1张图片
                    // uploadImgServer: "/pic/upload", // 图片上传接口图片
                    uploadImgServer: "/admin/img_upload", // 图片上传接口图片
                    zIndex : 500, // 编辑器层级
                    // linkImgCallback: this.internetPic, // 上传网络图片成功回调
                    uploadImgMaxSize: 2 * 1024 * 1024, // 限制上传图片大小为 2M
                    uploadImgTimeout: 60 * 1000, // 上传图片超时时间
                    uploadFileName: "file",
                    uploadImgHooks:{
                        before: _ => {
                            this.editorLoading = this.$loading({
                                lock: true,
                                text: '图片上传中...',
                                spinner: 'el-icon-loading',
                                background: 'rgba(0, 0, 0, 0.7)'
                            })
                        },
                        success: _ => {
                            // console.log('success~~~');
                            this.editorLoading.close()
                        },
                        faile: _ => {
                            // console.log('failed!!!!!');
                            this.editorLoading.close()
                        },
                        timeout: _ => {
                            this.editorLoading.close()
                        },
                        customInsert: (insertImgFn, result) => {
                            this.editorLoading.close()
                            // result 即服务端返回的接口
                            // console.log('customInsert', result)
                            // insertImgFn 可把图片插入到编辑器，传入图片 src ，执行函数即可
                            insertImgFn(result.data[0])
                        }
                    },
                    linkCheck (text, link) {
                        return IsURL(link) ? true : "插入的不是URL地址, 请重新输入";
                    },
                    pasteFilterStyle: false, // 关闭粘贴样式过滤
                    pasteIgnoreImg: false, // 忽略粘贴的图片 - 先不忽略
                    onblur: html => this.form.composition = html, // 编辑区域 和 blur（失焦）- 同步form表单
                    onfocus: html => this.form.composition = html, // 编辑区域 focus（聚焦）- 同步form表单
                    onchange: html => this.form.composition = html, // 编辑区域 focus（鼠标点击、键盘打字等）- 同步form表单
                });
                this.editor.create();
            })
        },
        editorDestroy () { // 销毁编辑器
            this.editor.destroy()
            this.editor = null
        },
        /* ********* wangEditor编辑器的配置 *********** */

        /* ************* cropper截图上传 ************** */
        handlePreviewSingle(file) {//点击进行图片展示
            // console.log('aaaaa',this.dialogImageUrl);
            // console.log(this.imageUrl);
            this.dialogImageUrl = this.imageUrl
            this.posterDialogVisible = true
        },
        mouseEnter() { // 鼠标移入显示“重新上传”
            this.$refs.reupload.style.display = 'block'
            if (this.$refs.failUpload.style.display === 'block') {
                this.$refs.failUpload.style.display = 'none'
            }
            this.$refs.singleImg.style.opacity = '0.6'
        },
        mouseLeave() { // 鼠标移出去掉"重新上传"
            this.$refs.reupload.style.display = 'none'
            this.$refs.singleImg.style.opacity = '1'
        },
        handleCrop(files, fileList) { // 点击弹出剪裁框
            this.cropperModel = true
            this.file = files
        },
        upload(data) { // 自定义upload事件
            this.$refs.uploading.style.display = 'block'
            let imgData = new FormData();
            let fileOfBlob = new File([data],'uploadPic.'+data.type.split('/')[1]);
            imgData.append('file', fileOfBlob);
            imgData.image = fileOfBlob;
            this.drawerLoading = true;
            this.$axios.post(this.targetUrl, imgData).then(res => {
                // 上传完成后隐藏正在上传
                this.$refs.uploading.style.display = 'none'
                if (res.status === 200) {
                    // 上传成功将照片传回父组件
                    const currentPic = res.data.imageUrl
                    this.$emit('imgupload', currentPic)
                    this.imageUrl = currentPic
                    this.form.poster = currentPic
                    // console.log('上传成功,url为 ', this.imageUrl)
                } else {
                    // 上传失败则显示上传失败，如多图则从图片列表删除图片
                    this.$refs.failUpload.style.display = 'block'
                }
                this.drawerLoading = false;
            })
            this.cropperModel = false
        },
        formatImgArr(arr) {
            const result = arr.map((item, index) => {
                if (typeof item === 'string') {
                    return {
                        url: item,
                        uid: `index${index}`
                    }
                } else {
                    return item.url
                }
            })
            return result
        },
        beforeClose(done) { // 关闭截图弹窗组件回调
            this.uploadList.pop()
            this.cropperModel = false
        },
        /* ************* cropper截图上传 ************** */

        transFormedArticle(composition) { // 转换垃圾font标签的属性为style属性
            // console.log('origin dom: ', composition);
            let dom = new DOMParser().parseFromString(composition, "text/html");
            let domTree = BFS.do(dom.childNodes);
            // console.log(dom.childNodes);
            // console.log(domTree);
            domTree.forEach(v => {
                if (v.tagName == "FONT") {
                    let _color = (v.getAttribute("color") || 'inherit')
                    let _fontSize = (this.getFontSize(v.getAttribute("size")) || 'inherit')
                    let _fontFamily = v.getAttribute("face") || 'inherit'
                    let _backgroundColor = getStyle(v, 'background-color') || 'inherit'
                    v.setAttribute("style", ` color: ${_color}; font-size: ${_fontSize}; font-family: ${_fontFamily}; background-color: ${_backgroundColor}; `)
                }
            })
            // console.log('transformed dom: ', dom.body.innerHTML);
            return dom.body.innerHTML;
        },
        getFontSize(val) { // 过滤font标签字体的大小
            let res = null
            switch (parseInt(val)) {
                case 1:
                    res = '10px;'
                    break;
                case 2:
                    res = '13px;'
                    break;
                case 3:
                    res = '16px;'
                    break;
                case 4:
                    res = '18px;'
                    break;
                case 5:
                    res = '24px;'
                    break;
                case 6:
                    res = '32px;'
                    break;
                default:
                    res = 'inherit;'
                    break;
            }
            return res;
        }
    }
}
</script>

<style lang="less" scoped>
// 分割线样式
.pager_divider{
    margin: 10px 0;
}
.avatar {
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    width: 120px;
    height: 96px;
    max-height: 96px;
    display: block;
    margin: 0 auto;
}
.avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.avatar-uploader .el-upload:hover {
    border-color: #409eff;
}
.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 120px;
    height: 96px;
    line-height: 96px;
    text-align: center;
}

// 新增的上传组件样式
.avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}
.avatar-uploader .el-upload:hover {
    border-color: #409eff;
}
.avatar-uploader-icon {
    color: #8c939d;
    text-align: center;
}
.avatar {
    display: block;
}
.reupload {
    border-radius: 50%;
    position: absolute;
    color: #fff;
    background-color: #000000;
    opacity: 0.6;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: none;
}
#uploadIcon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: none;
}

.avatar-uploader .el-upload.el-upload--picture-card {
    width: unset !important;
    height: unset !important;
}

// *********************** wangEditor富文本编辑器 ************************
#wangEditor{
    padding: 10px;
}
// *********************** wangEditor富文本编辑器 ************************
#article {
    padding: 30px 15px 15px 15px;
}
</style>