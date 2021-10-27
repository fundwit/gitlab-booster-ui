<template>
    <div>
        <div class="title"><i class="el-icon-menu"></i> 代码库组: {{detail.name}}</div>
        <el-tabs tab-position="top"> 
            

            <el-tab-pane>
                <span slot="label"><i class="el-icon-share"></i> 分支管理</span>
                <BranchManagement :repos="repos"/>
            </el-tab-pane>
            <el-tab-pane>
                <span slot="label"><i class="el-icon-price-tag"></i> 标签管理</span>
                <TagManagement :repos="repos"/>
            </el-tab-pane>
            <el-tab-pane>
                <span slot="label"><i class="el-icon-finished"></i> 合入请求管理</span>
                <MRManagement :repos="repos"/>
            </el-tab-pane>

            <el-tab-pane label="创建分支保护"><ProtectedBranchCreate :repos="repos"/></el-tab-pane>
            <el-tab-pane label="解除分支保护"><ProtectedBranchDelete :repos="repos"/></el-tab-pane>
 
            <!-- <el-tab-pane label="引用关系分析">开发中</el-tab-pane> -->

            <el-tab-pane>
                <span slot="label"><i class="el-icon-s-fold"></i> 仓库选择</span>

                <div>
                    <el-button type="success" size="medium" @click="dialogVisible=true">选择仓库...</el-button>
                </div>
                <el-divider></el-divider>
                <el-table :data="repos" style="width: 100%">
                    <!-- <el-table-column type="selection">
                    </el-table-column> -->
                    <el-table-column prop="name" label="名称" width="250">
                    </el-table-column>
                    <el-table-column prop="namespace" label="Namespace" width="250">
                    </el-table-column>
                    <el-table-column label="URL">
                        <template slot-scope="scope">
                            <a target="_blank" :href="scope.row.url">{{ scope.row.url}}</a>
                        </template>
                    </el-table-column>
                    <el-table-column width="180" label="操作">
                        <template slot-scope="scope">
                        <el-button size="mini" type="danger" @click="handleDelete(scope.$index, scope.row)">取消选择</el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <el-dialog title="选择仓库" v-if="dialogVisible" :visible.sync="dialogVisible" width="80%">
                    <RepositoryList ref="repoList" :initSelectedRepos="repos" @submitSelection="handleSubmitSelection" @stopSelection="handleStopSelection"/>
                </el-dialog>
            </el-tab-pane>
        </el-tabs>

    </div>
</template>
<script>
import RepositoryList from './RepositoryList'
import _ from 'lodash'
import client from '../client'
import BranchManagement from './BranchManagement'
import ProtectedBranchCreate from './ProtectedBranchCreate'
import ProtectedBranchDelete from './ProtectedBranchDelete'
import MRManagement from './MRManagement'
import TagManagement from './TagManagement'

export default {
    name: 'RepositoryGroup',
    components: {
       RepositoryList,
       BranchManagement,
       ProtectedBranchCreate,
       ProtectedBranchDelete,
       MRManagement,
       TagManagement
    },
    data () {
        return {
            dialogVisible: false,
            detail: {},
            repos: []
        }
    },
    mounted () {
        this.loadDetail (this.$route.params.id)
    },
    methods: {
        loadDetail (id) {
            const vue = this
            const mask = this.$loading({ lock: true, text: 'Loading', spinner: 'el-icon-loading', background: 'rgba(255,255,255,0.7)' })
            client.manifestDetail(id).then(data => {
                vue.repos = data.repos
                delete data.repos
                vue.detail = data
            }).catch(error => {
                vue.$notify.error({ title: 'Error', message: '数据加载失败' + error })
            }).finally(() => {
                mask.close()
            })
        },
        handleDelete (index, row) {
            const vue = this
            const mask = this.$loading({ lock: true, text: 'Loading', spinner: 'el-icon-loading', background: 'rgba(255,255,255,0.7)' })
            client.removeManifestItems(this.detail.id, [row.id]).then(() => {
                this.repos.splice(index, 1)
            }).catch(error => {
                vue.$notify.error({ title: 'Error', message: '请求失败' + error })
            }).finally(() => {
                mask.close()
            }) 
        },
        handleSubmitSelection (newSelected) {
            const vue = this
            const mask = this.$loading({ lock: true, text: 'Loading', spinner: 'el-icon-loading', background: 'rgba(255,255,255,0.7)' })
            client.appendManifestItems(this.detail.id, newSelected).then(() => {
                _.forEach(newSelected, val => {
                    vue.repos.push(val)
                })
            }).catch(error => {
                vue.$notify.error({ title: 'Error', message: '请求失败' + error })
            }).finally(() => {
                mask.close()
            }) 
        },
        handleStopSelection () {
            this.dialogVisible = false
        }
    }
}
</script>

<style>
.el-tab-pane {
    padding: 0 10px 0 10px
}

.el-table td, .el-table th {
    padding: 6px 0;
}
.el-table {
    margin: 10px 0
}
.el-table .warning-row {
    background: rgb(247, 225, 222);
}
.el-table .success-row {
    background: #f0f9eb;
}
</style>