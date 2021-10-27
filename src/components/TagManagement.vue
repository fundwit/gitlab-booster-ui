<template>
    <div>
        <div>
            <el-input size="medium" v-model="tagName" placeholder="请输入内容" style="width: 300px"></el-input> 
            <el-button size="medium" type="primary" :disabled="selectedCount===0 && !isLoading" @click="onBatchTagDetail">查询</el-button>
            <el-divider direction="vertical"/>

            <el-button size="medium" type="success" :disabled="selectedCount===0 && !isLoading"
                 @click="isShowCreateForm = !isShowCreateForm">创建...</el-button>
            <el-button size="medium" type="danger" :disabled="selectedCount===0 && !isLoading"
                 @click="isShowDeleteForm = !isShowDeleteForm">删除...</el-button>
        </div>

        <el-dialog title="创建" v-if="isShowCreateForm" :visible.sync="isShowCreateForm">
            <el-form>
                <el-form-item label="新标签名">
                    <el-input v-model="tagName" style="width: 300px"></el-input>
                </el-form-item>
                <el-form-item label="基于引用">
                    <el-input v-model="ref" placeholder="分支名/标签名/CommitId" style="width: 300px"></el-input>
                </el-form-item>
                <el-form-item>
                   <el-button type="primary" :disabled="selectedCount===0 && !isLoading" @click="onBatchTagCreate">创建</el-button>
                </el-form-item>
            </el-form>
        </el-dialog>

        <el-dialog title="删除" v-if="isShowDeleteForm" :visible.sync="isShowDeleteForm">
            <el-form>
                <el-form-item label="删除分支名">
                   <el-input v-model="tagName" placeholder="请输入要删除的分支" style="width: 300px"></el-input> 
                </el-form-item>
                <el-form-item>
                   <el-button type="primary" :disabled="selectedCount===0 && !isLoading" @click="onBatchTagDelete">删除</el-button>
                </el-form-item>
            </el-form>   
        </el-dialog>

         <el-progress style="margin: 10px 0" :percentage="0" :show-text="false"></el-progress>
        <el-table :row-class-name="computeRowClass" :data="repos" style="width: 100%" @selection-change="onSelectionChange">
            <el-table-column type="selection">
            </el-table-column>
            <el-table-column prop="name" label="名称" width="250px">
                <template slot-scope="scope">
                    <a target="_blank" :href="scope.row.url">{{ scope.row.name}}</a>
                </template>
            </el-table-column>
            <el-table-column prop="namespace" label="Namespace" width="250px">
            </el-table-column>
 
            <el-table-column label="操作结果" width="200px">
                <template slot-scope="scope">
                    <el-tag v-if="actionStatusMap[scope.row.id]" effect="dark"
                        :type="actionStatusMap[scope.row.id].status === 'OK' ? 'success':'danger'">
                        {{actionStatusMap[scope.row.id].status}}
                    </el-tag>
                </template>  
            </el-table-column>
            <el-table-column label="Commit 信息">
                <template slot-scope="scope">
                    <div v-if="detailMap[scope.row.id] && detailMap[scope.row.id].name">
                        <span style="color: dodgerblue"> {{ detailMap[scope.row.id].commit.short_id }} </span>
                        <span style="color: gray"> {{ detailMap[scope.row.id].commit.message }} </span>
                        <span style="color: green">({{ detailMap[scope.row.id].commit.author_email }})</span>
                        {{ detailMap[scope.row.id].commit.created_at }}
                    </div>
                </template>  
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
import client from "../gitlabV4Client"
import {mapState} from 'vuex'
import _ from 'lodash'

export default {
    name: "TagManagement",
    props: {
        repos: null
    },
    computed: {
        ...mapState({
            security: state => state.security
        })
    },
    data () {
        return {
            tagName: '',
            ref: '',

            isLoading: false,
            isShowCreateForm: false,
            isShowDeleteForm: false,

            selectedRepos: [],
            selectedCount: 0,

            actionStatusMap: {},
            detailMap: {}
        }
    },
    mounted () {
        const vue = this
        _.forEach(this.repos, repo => {
            vue.$set(vue.detailMap, repo.id, {})
            vue.$set(vue.actionStatusMap, repo.id, {})
        })
    },
    methods:{
         computeRowClass({row}) {
            const result = this.actionStatusMap[row.id]
            if (result && result.status === 'OK') {
                return 'success-row'
            } else if (result && result.status) {
                return 'warning-row'
            }
            return ''
        },
        onSelectionChange (selectedRows) {
            this.selectedRepos = selectedRows
            this.selectedCount = this.selectedRepos.length
        },
        onBatchTagDetail () {
            this.isLoading = true
            const allParallelQuerys = []
            _.forEach(this.selectedRepos, repo => {
                allParallelQuerys.push(this.tagDetail(repo))
            })

            // 等待并行请求全部完成
            Promise.all(allParallelQuerys).finally(() => {
                this.isLoading = false
            })
        },
        tagDetail (repo) {
            const vue = this
            vue.$set(vue.detailMap, repo.id, {}) // 清空数据，重新查询

            return client(vue.$cookies.get('gitlabEndpoint')).tagDetail(this.security.token, repo, this.tagName).then((detail) => {
                vue.$set(vue.detailMap, repo.id, detail)
                vue.$set(vue.actionStatusMap, repo.id, { status: 'OK' })
            }).catch(error => {
                vue.$set(vue.actionStatusMap, repo.id, {
                    status: error.response.data.message
                })
            })
        },
        onBatchTagCreate () {
            this.isShowCreateForm = false
            this.isLoading = true
            const allParallelQuerys = []
            _.forEach(this.selectedRepos, repo => {
                allParallelQuerys.push(this.tagCreate(repo))
            })

            // 等待并行请求全部完成
            Promise.all(allParallelQuerys).finally(() => {
                this.isLoading = false
            })
        },
        tagCreate (repo) {
            const vue = this
            vue.$set(vue.detailMap, repo.id, {}) // 清空数据，重新查询

            return client(vue.$cookies.get('gitlabEndpoint')).tagCreate(this.security.token, repo, this.tagName, this.ref).then(() => {
                vue.$set(vue.actionStatusMap, repo.id, { status: 'OK' })
            }).catch(error => {
                vue.$set(vue.actionStatusMap, repo.id, { status: error.response.data.message })
            })
        },
        onBatchTagDelete () {
            this.isShowDeleteForm = false
            this.isLoading = true
            const allParallelQuerys = []
            _.forEach(this.selectedRepos, repo => {
                allParallelQuerys.push(this.tagDelete(repo))
            })

            // 等待并行请求全部完成
            Promise.all(allParallelQuerys).finally(() => {
                this.isLoading = false
            })
        },
        tagDelete (repo) {
            const vue = this
            vue.$set(vue.detailMap, repo.id, {}) // 清空数据，重新查询

            return client(vue.$cookies.get('gitlabEndpoint')).tagDelete(this.security.token, repo, this.tagName).then(() => {
                vue.$set(vue.actionStatusMap, repo.id, { status: 'OK' })
            }).catch(error => {
                vue.$set(vue.actionStatusMap, repo.id, {
                    status: error.response.data.message
                })
            })
        }
    }
}
</script>

<style scoped>

</style>