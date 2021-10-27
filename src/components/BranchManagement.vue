<template>
    <div>
        <div>
            <el-input size="medium" v-model="branchName" placeholder="请输入内容" style="width: 300px"></el-input> 
            <el-button size="medium" type="primary" :disabled="selectedCount===0 && !isLoading" @click="onBatchBranchDetail">查询</el-button>
            <el-divider direction="vertical"/>

            <el-button size="medium" type="success" :disabled="selectedCount===0 && !isLoading"
                 @click="isShowCreateForm = !isShowCreateForm">创建...</el-button>
            <el-button size="medium" type="danger" :disabled="selectedCount===0 && !isLoading"
                 @click="isShowDeleteForm = !isShowDeleteForm">删除...</el-button>
        </div>

        <el-dialog title="创建" v-if="isShowCreateForm" :visible.sync="isShowCreateForm">
            <el-form>
                <el-form-item label="新分支名">
                    <el-input v-model="branchName" style="width: 300px"></el-input>
                </el-form-item>
                <el-form-item label="基于引用">
                    <el-input v-model="ref" placeholder="分支名/标签名/CommitId" style="width: 300px"></el-input>
                </el-form-item>
                <el-form-item>
                   <el-button type="primary" :disabled="selectedCount===0 && !isLoading" @click="onBatchBranchCreate">创建</el-button>
                </el-form-item>
            </el-form>
        </el-dialog>

        <el-dialog title="删除" v-if="isShowDeleteForm" :visible.sync="isShowDeleteForm">
            <el-form>
                <el-form-item label="删除分支名">
                   <el-input v-model="branchName" placeholder="请输入要删除的分支" style="width: 300px"></el-input> 
                </el-form-item>
                <el-form-item>
                   <el-button type="primary" :disabled="selectedCount===0 && !isLoading" @click="onBatchBranchDelete">删除</el-button>
                </el-form-item>
            </el-form>   
        </el-dialog>


        <el-progress style="margin: 10px 0" :percentage="progress" :show-text="false"></el-progress>
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

            <el-table-column label="Push权限" width="100px">
                <template slot-scope="scope">
                    <div v-if="protectedStatusMap[scope.row.id]">
                        {{ protectedStatusMap[scope.row.id].pushAccessLevels }}
                    </div>
                </template>  
            </el-table-column>
            <el-table-column label="Merge权限" width="100px">
                <template slot-scope="scope">
                    <div v-if="protectedStatusMap[scope.row.id]">
                        {{ protectedStatusMap[scope.row.id].mergeAccessLevels }}
                    </div>
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
    name: "BranchManagement",
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
            branchName: '',
            ref: '',

            isLoading: false,
            progress: 0,
            isShowCreateForm: false,
            isShowDeleteForm: false,

            selectedRepos: [],
            selectedCount: 0,

            actionStatusMap: {},
            protectedStatusMap: {},
            detailMap: {}
        }
    },
    mounted () {
        const vue = this
        _.forEach(this.repos, repo => {
            vue.$set(vue.detailMap, repo.id, {})
            vue.$set(vue.actionStatusMap, repo.id, {})
            vue.$set(vue.protectedStatusMap, repo.id, {})
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
        onBatchBranchDetail () {
            this.isLoading = true
            const allParallelQuerys = []
            _.forEach(this.selectedRepos, repo => {
                allParallelQuerys.push(this.branchDetail(repo))
            })

            // 等待并行请求全部完成
            Promise.all(allParallelQuerys).finally(() => {
                this.isLoading = false
            })
        },
        branchDetail (repo) {
            const vue = this
            vue.$set(vue.detailMap, repo.id, {}) // 清空数据，重新查询

            return client(vue.$cookies.get('gitlabEndpoint')).branchDetail(this.security.token, repo, this.branchName).then((detail) => {
                vue.$set(vue.detailMap, repo.id, detail)
                vue.$set(vue.actionStatusMap, repo.id, { status: 'OK' })
            }).catch(error => {
                vue.$set(vue.actionStatusMap, repo.id, {
                    status: error.response.data.message
                })
            }).finally(() => {
                return client(vue.$cookies.get('gitlabEndpoint')).detailProtectBranch(vue.security.token, repo, vue.branchName).then(data => {
                    vue.$set(vue.protectedStatusMap, repo.id, {
                        mergeAccessLevels: _.map(data.merge_access_levels, item => item.access_level_description).join(", "),
                        pushAccessLevels: _.map(data.push_access_levels, item => item.access_level_description).join(", ")
                    })
                }).catch(error => {
                    if (error.response.data.message === "404 Not found") {
                        vue.$set(vue.protectedStatusMap, repo.id, {
                            mergeAccessLevels: '未设置',
                            pushAccessLevels: '未设置'
                        })
                    } else {
                        vue.$set(vue.protectedStatusMap, repo.id, {
                            mergeAccessLevels: error.response.data.message,
                            pushAccessLevels: error.response.data.message
                        })
                    }
                })
            })
        },
        onBatchBranchCreate () {
            this.isShowCreateForm = false
            this.isLoading = true
            const allParallelQuerys = []
            _.forEach(this.selectedRepos, repo => {
                allParallelQuerys.push(this.branchCreate(repo))
            })

            // 等待并行请求全部完成
            Promise.all(allParallelQuerys).finally(() => {
                this.isLoading = false
            })
        },
        branchCreate (repo) {
            const vue = this
            vue.$set(vue.detailMap, repo.id, {}) // 清空数据，重新查询
            vue.$set(vue.protectedStatusMap, repo.id, {})

            return client(vue.$cookies.get('gitlabEndpoint')).branchCreate(this.security.token, repo, this.branchName, this.ref).then(() => {
                vue.$set(vue.actionStatusMap, repo.id, { status: 'OK' })
            }).catch(error => {
                vue.$set(vue.actionStatusMap, repo.id, { status: error.response.data.message })
            })
        },
        onBatchBranchDelete () {
            this.isShowDeleteForm = false
            this.isLoading = true
            const allParallelQuerys = []
            _.forEach(this.selectedRepos, repo => {
                allParallelQuerys.push(this.branchDelete(repo))
            })

            // 等待并行请求全部完成
            Promise.all(allParallelQuerys).finally(() => {
                this.isLoading = false
            })
        },
        branchDelete (repo) {
            const vue = this
            vue.$set(vue.detailMap, repo.id, {}) // 清空数据，重新查询
            vue.$set(vue.protectedStatusMap, repo.id, {})

            return client(vue.$cookies.get('gitlabEndpoint')).branchDelete(this.security.token, repo, this.branchName).then(() => {
                vue.$set(vue.actionStatusMap, repo.id, { status: 'OK' })

                // 删除成功时也附带删除保护
                return client(vue.$cookies.get('gitlabEndpoint')).deleteProtectedBranch(this.security.token, repo, this.branchName).then(() => {
                   // 忽略结果
                }).catch(() => {
                    // 忽略错误
                })
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