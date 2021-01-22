<template>
    <div id="resume">
        <!-- 上传组件 -->
        <el-upload
            class="upload-demo"
            drag
            action="https://jsonplaceholder.typicode.com/posts/"
            :http-request="uploadHandler"
        >
            <!-- multiple -->
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
            </div>
            <div class="el-upload__tip" slot="tip">
                只能上传.doc或者.pdf文件，且不超过5M
            </div>
        </el-upload>
        <!-- 列表 -->
        <!-- <el-table :data="curComment" border style="width: 100%" :cell-class-name="setCell" >
            <el-table-column prop="com_time" label="日期" width>
                <template slot-scope="scope">
                    <p>{{ scope.row.com_time | date }}</p>
                </template>
            </el-table-column>
            <el-table-column prop="guest_id" label="微信名"></el-table-column>
            <el-table-column prop="com_content" label="评论内容" width="400" ></el-table-column>
            <el-table-column label="操作">
                <template slot-scope="scope">
                    <el-button size="small" type="normal" @click="handleCheckComment(scope.$index, scope.row)" >查看</el-button >
                    <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)" >删除</el-button >
                </template>
            </el-table-column>
            <el-dialog title="评论详情" id="comment_detail" width="30%" :visible.sync="innerVisible" append-to-body >
                <el-form label-width="100px">
                    <el-form-item>
                        <div class="chosen_content" v-html="commentDetail" ></div>
                    </el-form-item>
                </el-form>
            </el-dialog>
        </el-table> -->
    </div>
</template>

<script>
export default {
    data() {
        return {
            // .docx
        }
    },
    created() {
        this.$axios({
            url: "/admin/resume/get",
            data: {},
            method: "post"
        }).then(res => {
            console.log(res);
        })
    },
    mounted() {

    },
    methods: {
        uploadHandler() {
            console.log('AAA');
        }
    },
    computed: {

    }
}
</script>

<style lang="less" scoped>
#resume {
    padding: 15px;
}
</style>