<template>
    <div id="category" v-loading.fullscreen.lock="fullscreenLoading">
        <el-table :data="categoryData" v-loading="tablaLoading" border style="width: 100%" :cell-class-name="setIdColumn">
            <el-table-column prop="_id" label="分类ID">
                <template slot-scope="scope">
                    <p :title="scope.row._id">{{scope.row._id.slice(0,10)}}...</p>
                </template>
            </el-table-column>
            <el-table-column type="index" label="分类顺序" width="100px"></el-table-column>
            <el-table-column prop="name" label="分类名称"></el-table-column>
            <el-table-column prop="addtime" label="新增时间">
                <template slot-scope="scope">
                    <p>{{scope.row.addtime|date}}</p>
                </template>
            </el-table-column>
            <el-table-column prop="edittime" label="上次修改">
                <template slot-scope="scope">
                    <p>{{scope.row.edittime|date}}</p>
                </template>
            </el-table-column>
            <el-table-column prop="banner" label="分类缩略图">
                <template slot-scope="scope">
                    <el-image
                        style="width: 150px; height: 34px"
                        :src="scope.row.banner"
                        fit="cover"
                    ></el-image>
                </template>
            </el-table-column>
            <el-table-column prop="isShow" label="是否显示">
                <template slot-scope="scope">
                    <span v-if="scope.row.isShow=='1'" style="color:#5fc971">是</span>
                    <span v-else style="color:#ec5851">否</span>
                </template>
            </el-table-column>
            <el-table-column label="操作">
                <template slot-scope="scope">
                    <el-button size="mini" :disabled="scope.row.name=='HOT'" @click="edit(scope.$index, scope.row)">编辑</el-button>
                    <el-button size="mini" :disabled="scope.row.name=='HOT'" type="danger" @click="del(scope.$index, scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-button type="text" @click='open' icon="el-icon-circle-plus-outline">新增分类</el-button>
        <span> | </span>
        <el-button type="text" @click="sortDialogVisible=true;" icon="el-icon-s-operation">分类排序</el-button>
        <!-- 新增或编辑dialog组件 -->
        <el-dialog :title="handleType=='add'?'添加分类':'编辑分类'" :visible.sync="dialogVisible" width="50%" :before-close="handleClose">
            <el-form :model="categoryDetail" ref="categoryDetail" label-width="120px" :rules="rules" @submit.native.prevent="">
                <el-form-item label="分类名称" prop="name">
                    <el-input v-model="categoryDetail.name" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="是否显示" prop="isShow">
                    <el-switch
                        v-model="categoryDetail.isShow"
                        active-color="#13ce66"
                        inactive-color="#ff4949"
                        active-value="1"
                        inactive-value="0"
                    ></el-switch>(绿色为开启显示,选择关闭则不会在页面中显示)
                </el-form-item>
                <el-form-item label="分类缩略图" prop="banner">
                    <span>(banner长宽要求：2278x516)</span>
                    <form id="minPicForm" method="post" enctype="multipart/form-data">
                        <!-- 单图片上传 -->
                        <el-upload
                            class="avatar-uploader"
                            v-model="categoryDetail.banner"
                            action="'string'"
                            list-type="picture-card"
                            :auto-upload="false"
                            :show-file-list="false"
                            :on-change="handleCrop"
                        >
                            <!-- :http-request="upload" -->
                            <img 
                                v-if="categoryDetail.banner" 
                                :src="categoryDetail.banner" 
                                class="avatar" 
                                ref="singleImg" 
                                @mouseenter="mouseEnter" 
                                @mouseleave="mouseLeave" 
                                :style="{width:bannerWidth+'px',height:bannerHeight+'px'}" 
                            />
                            <i v-else class="el-icon-plus avatar-uploader-icon" :style="{width:bannerWidth+'px',height:bannerHeight+'px','line-height':bannerHeight+'px','font-size':bannerHeight/6+'px'}" ></i>
                            <div id="uploadIcon" v-if="categoryDetail.banner" ref="reupload" @mouseenter="mouseEnter" @mouseleave="mouseLeave" :style="{width:'100%'}" >
                                <i class="el-icon-zoom-in" title="查看原图" :style="{color:'#2E2E2E',fontSize:'25px',display:'inline-block',paddingRight:'15px'}" ></i>
                                <i class="el-icon-refresh-right" title="重新上传" :style="{color:'#2E2E2E',fontSize:'25px',display:'inline-block'}" ></i>
                            </div>
                            <div class="reupload icon" ref="uploading" :style="{width:reuploadWidth+'px',height:reuploadWidth+'px','line-height':reuploadWidth+'px','font-size':reuploadWidth/5+'px'}" >上传中..</div>
                            <div class="reupload icon" ref="failUpload" :style="{width:reuploadWidth+'px',height:reuploadWidth+'px','line-height':reuploadWidth+'px','font-size':reuploadWidth/5+'px'}" >上传失败</div>
                        </el-upload>
                        <!-- <el-dialog :visible.sync="dialogVisible">
                            <img width="100%" :src="dialogImageUrl" alt />
                        </el-dialog> -->
                    </form>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="commitHandle(handleType)">确 定</el-button>
            </span>
        </el-dialog>
        <!-- 分类排序组件 -->
        <el-dialog title="分类排序" :visible.sync="sortDialogVisible" width="50%" :before-close="handleCancelSort">
            <div class="sortDialogVisible">
                <div>{{ drag ? "排序中" : "拖拽可排序" }}</div>
                <draggable
                    v-model="sortableCatetegoryData"
                    chosenClass="chosen"
                    forceFallback="true"
                    group="people"
                    animation="1000"
                    @start="onStart"
                    @end="onEnd"
                >
                    <transition-group>
                        <div class="item" v-for="element in sortableCatetegoryData" :key="element._id">
                            {{ element.name }}
                        </div>
                    </transition-group>
                </draggable>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="handleSortConfirm">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
//导入draggable组件
import draggable from 'vuedraggable'
import {deepClone} from '../../../utils/utils'
export default {
    data() {
        return {
            handleType:"add",
            dialogVisible: false,
            sortDialogVisible: false, // 排序模态框显示
            bannerWidth:396,
            bannerHeight:88,
            file:'',
            reupload: true, // 控制"重新上传"开关
            reuploadWidth: this.height * 0.7, // 动态改变”重新上传“大小
            categoryData: [],
            isShow:true, // 是否显示控件
            categoryDetail: {
                id: "",
                name: "",
                banner: "http://example.kkslide.fun/banner.jpg",
                index:"",
                addtime: "",
                edittime: "",
                isShow: "1"
            },
            sortableCatetegoryData:[], // 拖拽排序分类数据
            rules:{
                name:[{ required: true, message: '内容不能为空', trigger: 'blur' }],
                banner:[{required:true,message:'请上传分类图banner',trigger:'blur'}],
                isShow:[{required:true,message:'请选择是否显示',trigger:'blur'}]
            },
            drag: false, // 是否开启拖拽
            fullscreenLoading: false, // 全屏loading
            tablaLoading:false, // 表格loading
        }
    },
    components: {
        draggable, // 注册draggable组件
    },
    methods: {
        getData() {
            this.tablaLoading = true;
            this.$axios({ url: '/admin/category/get',method: "post" })
                .then(res => {
                    let response = res.data.data
                    .map((v,i)=>{
                        return {
                            _id:v._id,
                            name:v.name,
                            banner:v.banner,
                            index:v.index,
                            addtime: v.addtime ,
                            edittime: v.edittime,
                            isShow: v.isShow
                        }
                    });
                    this.categoryData = response
                    this.sortableCatetegoryData = response
                })
                .catch(err=>{
                    if(err.response.status == 401){
                        this.$notify.error({
                            customClass:'notify_no_border',
                            title: '提示',
                            message: '没有登陆, 要先去登陆先',
                            duration: 0
                        });
                        this.$router.push({ name: 'login' })
                    }
                })
                .finally( _ => {
                    this.tablaLoading = false
                })
        },
        commitHandle(type){ // 添加和编辑分类操作
            if(this.categoryDetail.banner==''){
                this.$message({ type: 'info', message: '请添加封面图banner' });
                return false;
            }
            if(type=="add"){
                this.fullscreenLoading=true;
                this.$axios({
                    url:"/admin/category/add",
                    data:{
                        'name':this.categoryDetail.name,
                        'banner':this.categoryDetail.banner,
                        "isShow": this.categoryDetail.isShow,
                        'index': this.categoryData.length // 默认排序在最后一个
                    },
                    method:'post'
                })
                .then(res=>{
                    this.getData();
                    this.dialogVisible = false;
                })
                .finally(_=>{
                    this.fullscreenLoading=false;
                })
            }
            else if(type=="edit"){
                this.tablaLoading=true;
                this.$axios({
                    url: "/admin/category/edit",
                    method: "post",
                    data: {
                        "id": this.categoryDetail.id,
                        "name": this.categoryDetail.name,
                        "isShow": this.categoryDetail.isShow,
                        "banner": this.categoryDetail.banner,
                    }
                }).then(res => {
                    if (res.data.code == 1) {
                        this.$message({
                            type: 'success',
                            message: '更新成功!'
                        });
                    } else {
                        this.$message({
                            type: 'info',
                            message: '更新失败!!'
                        });
                    }
                }).then(() => {
                    this.getData();
                    this.dialogVisible=false;
                })
                .finally(_=>{
                    this.tablaLoading=false;
                })
            }
        },
        open(){ // 打开添加模态框
            this.dialogVisible=true;
            this.categoryDetail.name="";
            this.categoryDetail.isShow="1",
            this.categoryDetail.banner="http://example.kkslide.fun/banner.jpg";
            this.handleType="add";
        },
        del(index, row) { // 删除按钮
            this.$confirm('永久删除分类"' + row.name + '", 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.$axios({
                    url: '/admin/category/del',
                    method: 'post',
                    data: {
                        "id": row._id
                    }
                }).then(res => {
                    if (res.data.code == 1) {
                        this.$message({
                            type: 'success',
                            message: '删除成功!'
                        });
                    } else {
                        this.$message({
                            type: 'info',
                            message: '删除失败啦!'
                        });
                    }
                }).then(() => {
                    this.getData()
                })
            }).catch(() => {
                this.$message({
                    type: 'info',
                    message: '已取消删除'
                });
            });
        },
        edit(index, row) { // 编辑按钮
            this.handleType="edit";
            this.dialogVisible=true;
            this.categoryDetail.id=row._id;
            this.categoryDetail.name=row.name;
            this.categoryDetail.isShow=row.isShow;
            this.categoryDetail.banner=row.banner;
        },
        setIdColumn({ row, column, rowIndex }) { // 设置栏目样式
            if (column.property == 'id') {
                return 'cell_nowrap'
            }
        },
        handleClose(done) { // 关闭新增编辑弹窗
            this.$confirm('确认关闭？')
                .then(_ => {
                    done();
                })
                .catch(_ => { });
        },
        handleCancelSort(done){ // 取消排序操作
            this.$confirm('确认关闭？')
                .then(_ => {
                    done();
                })
                .catch(_ => { });
        },
        handleSortConfirm(){ // 确定排序操作
            let sortedData = this.sortableCatetegoryData;
            sortedData.forEach((v,i)=>{
                v["index"] = i
            });
            this.fullscreenLoading=true
            this.$axios({
                url:"/admin/category/sort",
                data: {"sortedData":sortedData},
                method:"POST"
            }).then(res=>{
                this.categoryData = deepClone(sortedData)
            }).catch(err => {
                console.log(err);
            }).finally(_ => {
                console.log('done!!! sort successfully!!');
                this.sortDialogVisible=false
                this.fullscreenLoading=false
            })
        },
        mouseEnter() {//鼠标划入显示“重新上传”
            this.$refs.reupload.style.display = 'block'
            if (this.$refs.failUpload.style.display === 'block') {
                this.$refs.failUpload.style.display = 'none'
            }
            this.$refs.singleImg.style.opacity = '0.6'
        },
        mouseLeave() { // 鼠标划出隐藏“重新上传”
            this.$refs.reupload.style.display = 'none'
            this.$refs.singleImg.style.opacity = '1'
        },
        handleCrop(files, fileList) { // 点击弹出剪裁框
            let tempForm = new FormData();
            tempForm.append('image',files.raw);
            this.$refs.uploading.style.display = 'block';
            // this.$axios.post('/admin/img_upload',tempForm).then(res=>{
            this.$axios.post('/pic/upload',tempForm).then(res=>{
                this.$refs.uploading.style.display = 'none';
                if(res.status==200){
                    this.categoryDetail.banner = res.data.imageUrl;
                }else {
                    // 上传失败则显示上传失败，如多图则从图片列表删除图片
                    this.$refs.failUpload.style.display = 'block'
                }
            })
        },
        onStart() { // 开始拖拽事件
            this.drag = true;
        },
        onEnd() { // 拖拽结束事件
            this.drag = false;
        },
    },
    created() {
        this.getData()
    },
}
</script>

<style lang="less" scoped>
#category {
    padding: 15px;
    .avatar {
        background-size: cover;
        background-position: center center;
        background-repeat: no-repeat;
        width: 150px;
        height: 34px;
        // max-height: 34px;
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
        width: 150px;
        height: 34px;
        line-height: 34px;
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
}

.sortDialogVisible{
    /*被拖拽对象的样式*/
    .item {
        padding: 6px;
        background-color: #fdfdfd;
        border: solid 1px #eee;
        margin-bottom: 10px;
        cursor: move;
    }
    /*选中样式*/
    .chosen {
        border: solid 2px #3089dc !important;
    }
}

</style>