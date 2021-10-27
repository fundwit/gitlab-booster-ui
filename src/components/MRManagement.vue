<template>
    <div>
        <div>
            <el-form :inline="true">
                <el-form-item label="源分支">
                    <el-input size="medium" v-model="sourceBranch" style="width: 300px"></el-input>
                </el-form-item>
                <el-form-item label="目标分支">
                    <el-input size="medium" v-model="targetBranch" style="width: 300px"></el-input>
                </el-form-item>
                <el-form-item label="描述">
                    <el-input size="medium" v-model="MRTitle" placeholder="标题和描述" style="width: 300px"></el-input>
                </el-form-item>
                <el-form-item>
                   <el-button size="medium" type="primary" :disabled="selectedCount===0 && !isLoading" @click="onBatchQueryMR">查询</el-button>
                   
                   <el-button size="medium" type="success" :disabled="selectedCount===0 && !isLoading"
                        @click="isShowCreateForm = !isShowCreateForm">创建...</el-button>
                </el-form-item>
            </el-form>
        </div>

        <el-dialog title="创建" v-if="isShowCreateForm" :visible.sync="isShowCreateForm">
            <el-form label-width="80px" label-position="left">
                <el-form-item label="源分支">
                    <el-input v-model="sourceBranch" style="width: 300px"></el-input>
                </el-form-item>
                <el-form-item label="目标分支">
                    <el-input v-model="targetBranch" style="width: 300px"></el-input>
                </el-form-item>
                <el-form-item label="标题">
                    <el-input v-model="MRTitle" style="width: 300px"></el-input>
                </el-form-item>
                <el-form-item>
                   <el-button type="primary" :disabled="selectedCount===0 && !isLoading" @click="onBatchMRCreate">创建</el-button>
                </el-form-item>
            </el-form>
        </el-dialog>

        <div>
            <el-button size="medium" type="warning" :disabled="selectedCount===0 && !isLoading" @click="onBranchAcceptMR">接受MR...</el-button>
        </div>

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

            <el-table-column label="操作结果" width="100px">
                <template slot-scope="scope">
                    <el-tag v-if="actionStatusMap[scope.row.id]" effect="dark"
                        :type="actionStatusMap[scope.row.id].status === 'OK' ? 'success':'danger'">
                        {{actionStatusMap[scope.row.id].status}}
                    </el-tag>
                </template>  
            </el-table-column>
            <el-table-column label="merge requests">
                <template slot-scope="scope">
                    <div v-if="findMRResultMap(scope.row.id).mrs">
                        <MRList @selected="onMrSelected" :repoId="scope.row.id" :mrs="findMRResultMap(scope.row.id).mrs"></MRList>
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
import MRList from './MRList'

export default {
    name: "MRManagement",
    props: {
        repos: null
    },
    components: {
        MRList
    },
    computed: {
        ...mapState({
            security: state => state.security
        })
    },
    data () {
        return {
            sourceBranch: '',
            targetBranch: '',
            MRTitle: '',
            isLoading: false,
            selectedRepos: [],
            selectedCount: 0,

            isShowCreateForm: false,

            mrResultMap: {},
            actionStatusMap: {},
        }
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
        findActionStatus (id) {
            const result = this.actionStatusMap[id]
            if (result) {
                return result
            } else {
                return {}
            }
        },
        findMRResultMap (id) {
            const result = this.mrResultMap[id]
            if (result) {
                return result
            } else {
                return {}
            }
        },
        onSelectionChange (selectedRows) {
            this.selectedRepos = selectedRows
            this.selectedCount = this.selectedRepos.length
        },
        onMrSelected (repoId, selectedMRIID) {
            const vue = this
            const data = this.findMRResultMap(repoId)
            if (data && data.mrs) {
                if (selectedMRIID) {
                    const selected = _.find(data.mrs, mr => mr.iid === selectedMRIID)
                    if (selected) {
                        data.selectedMR = selected
                        vue.$set(vue.mrResultMap, repoId, data)
                    }
                } else {
                    delete data.selectedMR
                    vue.$set(vue.mrResultMap, repoId, data)
                }
            }
        },
        onBatchQueryMR () {
            this.isLoading = true
            const allParallelQuerys = []
            _.forEach(this.selectedRepos, repo => {
                allParallelQuerys.push(this.queryMR(repo))
            })
            // 等待并行请求全部完成
            Promise.all(allParallelQuerys).finally(() => {
                this.isLoading = false
            })
        },
        queryMR (repo) {
            const vue = this
            vue.$set(vue.mrResultMap, repo.id, {}) // 清空数据，重新查询

            return client(vue.$cookies.get('gitlabEndpoint')).queryMR(this.security.token, repo, this.sourceBranch, this.targetBranch, this.MRTitle).then((mrs) => {
                const data = { mrs: _.map(mrs, mr => {
                        return {
                            iid: mr.iid,
                            title: mr.title,
                            state: mr.state,
                            merge_status: mr.merge_status,
                            web_url: mr.web_url ,
                            source_branch: mr.source_branch,
                            target_branch: mr.target_branch
                        }
                    })
                }

                vue.$set(vue.mrResultMap, repo.id, data)
                vue.$set(vue.actionStatusMap, repo.id, {
                    status: 'OK'
                })
            }).catch(error => {
                vue.$set(vue.mrResultMap, repo.id, {mrs: []})
                vue.$set(vue.actionStatusMap, repo.id, {
                    status: error.response.data.message
                })
            })
        },
        onBranchAcceptMR () {
            const vue = this
            this.$confirm('是否接受选择的合并请求?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                vue.isLoading = true
                const allParallelQuerys = []
                _.forEach(this.selectedRepos, repo => {
                    const mr = this.findMRResultMap(repo.id).selectedMR
                    allParallelQuerys.push(vue.acceptMR(repo, mr ? mr.iid : null))
                })
                // 等待并行请求全部完成
                Promise.all(allParallelQuerys).finally(() => {
                    vue.isLoading = false
                })
            }) 
        },
        acceptMR (repo, mriid) {
            const vue = this
            vue.$set(vue.mrResultMap, repo.id, {}) // 清空数据，重新查询

            if (!mriid) {
                 vue.$set(vue.actionStatusMap, repo.id, {
                    status: "未选中 MR"
                })
                return
            }

            return client(vue.$cookies.get('gitlabEndpoint')).acceptMR(this.security.token, repo, mriid, "Accepted by code repository manager in batch.").then(() => {
                // 再次查询
                // return this.queryMR(repo)
            }).catch(error => {
                vue.$set(vue.actionStatusMap, repo.id, {
                    status: error.response.data.message
                })
            }).finally(() => {
                // 清空 merge requests 状态，需要再次查询
                vue.$set(vue.mrResultMap, repo.id, {mrs: []})
            })
        },
        onBatchMRCreate () {
            this.isShowCreateForm = false
            this.isLoading = true
            const allParallelQuerys = []
            _.forEach(this.selectedRepos, repo => {
                allParallelQuerys.push(this.mrCreate(repo))
            })

            // 等待并行请求全部完成
            Promise.all(allParallelQuerys).finally(() => {
                this.isLoading = false
            })
        },
        mrCreate (repo) {
            const vue = this
            vue.$set(vue.mrResultMap, repo.id, {}) // 清空数据，重新查询

            return client(vue.$cookies.get('gitlabEndpoint')).createMR(this.security.token, repo, this.sourceBranch, this.targetBranch, this.MRTitle).then(() => {
                vue.$set(vue.actionStatusMap, repo.id, {
                    status: 'OK'
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