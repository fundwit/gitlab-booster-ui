<template>
    <div>
        <div>
           <el-form :inline="true">
                <el-form-item label="分支名">
                    <el-input v-model="branchName" style="width: 300px"></el-input>
                </el-form-item>
                <el-form-item label="Merge 权限">
                    <el-select v-model="mergeAccessLevels" placeholder="请选择">
                        <el-option label="No One" value="0"></el-option>
                        <el-option label="Developer" value="30"></el-option>
                        <el-option label="Maintainer" value="40"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="Push 权限">
                    <el-select v-model="pushAccessLevels" placeholder="请选择">
                        <el-option label="No One" value="0"></el-option>
                        <el-option label="Developer" value="30"></el-option>
                        <el-option label="Maintainer" value="40"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item>
                   <el-button type="primary" :disabled="selectedCount===0 && !isLoading" @click="onCreateBranchProtect">设置保护</el-button>
                </el-form-item>
            </el-form>
        </div>

        <el-progress style="margin: 10px 0" :percentage="0" :show-text="false"></el-progress>
        <el-table :row-class-name="computeRowClass" :data="repos" style="width: 100%" @selection-change="onSelectionChange">
            <el-table-column type="selection">
            </el-table-column>
            <el-table-column prop="name" label="名称">
                <template slot-scope="scope">
                    <a target="_blank" :href="scope.row.url">{{ scope.row.name}}</a>
                </template>
            </el-table-column>
            <el-table-column prop="namespace" label="Namespace">
            </el-table-column>
 
            <el-table-column label="操作结果">
                <template slot-scope="scope">
                    <el-tag v-if="actionStatusMap[scope.row.id]" effect="dark"
                        :type="actionStatusMap[scope.row.id].status === 'OK' ? 'success':'danger'">
                        {{actionStatusMap[scope.row.id].status}}
                    </el-tag>
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
    name: "ProtectedBranchCreate",
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
            mergeAccessLevels: '',
            pushAccessLevels: '',

            isLoading: false,
            selectedRepos: [],
            selectedCount: 0,

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
        onSelectionChange (selectedRows) {
            this.selectedRepos = selectedRows
            this.selectedCount = this.selectedRepos.length
        },

        onCreateBranchProtect () {
            this.isLoading = true
            const allParallelQuerys = []
            _.forEach(this.selectedRepos, repo => {
                allParallelQuerys.push(this.protectBranchOfSingleRepo(repo))
            })
            // 等待并行请求全部完成
            Promise.all(allParallelQuerys).finally(() => {
                this.isLoading = false
            })
        },
        protectBranchOfSingleRepo (repo) {
            const vue = this
            return client(vue.$cookies.get('gitlabEndpoint')).createProtectedBranch(this.security.token, repo, this.branchName, this.mergeAccessLevels, this.pushAccessLevels).then(() => {
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