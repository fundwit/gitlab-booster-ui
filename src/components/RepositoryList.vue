<template>
  <div>
    <span>
        <el-row>
          <el-col :span="10">
            <el-button size="medium" type="success" @click="onSubmitSelection">选择</el-button>
            <el-button size="medium" @click="onStopSelection">关闭</el-button>
          </el-col>
          <el-col :span="10">
            <el-input size="medium" v-model="search" placeholder="请输入内容" style="width: 300px"></el-input> 
            <el-button size="medium" type="primary" @click="onSearch">搜索</el-button>
          </el-col>
        </el-row>
    </span>
    <el-table ref="repoSelection" border :data="repositories" style="width: 100%;" @selection-change="onSelectionChange">
      <el-table-column type="selection" :selectable="isSelectable"></el-table-column>
      <el-table-column prop="name" label="名称" width="180"></el-table-column>
      <el-table-column prop="url" label="URL">
        <template slot-scope="scope">
          <a target="_blank" :href="scope.row.url">{{ scope.row.url}}</a>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination @current-change="onCurrentPageChange" background layout="prev, pager, next"
      :page-size="pageSize" :current-page="pageInfo.currentPage" :total="pageInfo.totalItems">
    </el-pagination>
  </div>
</template>

<script>
import client from "../gitlabV4Client"
import {mapState} from 'vuex'
import _ from 'lodash'

export default {
  name: 'RepositoryList',
  props: {
    initSelectedRepos: null
  },
  data () {
      return {
        selectedRepos: [],
        newSelectedRepos: [],
        repositories: [],
        fixSelectedMap: {},
        search: '',
        pageInfo: {
          currentPage	: 1,
          totalItems: 0
        },
        pageSize: 10
      }
  },
  computed: {
    ...mapState({
      security: state => state.security
    })
  },
  mounted () {
    const vue = this
    if (this.initSelectedRepos) {
      _.forEach(this.initSelectedRepos, repo => {
        vue.$set(vue.fixSelectedMap, repo.id, true)
      })
    }
  },
  methods: {
    isFixSelected (row) {
      return this.fixSelectedMap[row.id] === true
    },
    isSelectable (row) {
      return !this.isFixSelected(row)
    },
    onStopSelection() {
      this.$emit('stopSelection')
    },
    onSubmitSelection() {
      const vue = this
      this.$emit('submitSelection', this.newSelectedRepos, this.selectedRepos)

      // TODO 
      _.forEach(this.newSelectedRepos, repo => {
        vue.$set(vue.fixSelectedMap, repo.id, true)
      })
      this.newSelectedRepos = []
    },
    onSearch () {
      this.listRepos(1)
    },
    onCurrentPageChange (val) {
      this.listRepos(val)
    },
    onSelectionChange (selectedRows) {
      const vue = this
      this.selectedRepos = selectedRows
      this.newSelectedRepos = []
      _.forEach(selectedRows, repo => {
        if (!vue.isFixSelected(repo)) {
          this.newSelectedRepos.push(repo)
        }
      })
    },
    listRepos (page) {
        const vue = this
        const mask = this.$loading({ lock: true, text: 'Loading', spinner: 'el-icon-loading', background: 'rgba(255,255,255,0.7)' })
        // per_page, page(starting at 1)
        client(vue.$cookies.get('gitlabEndpoint')).listProjects(this.security.token, page, this.pageSize, this.search).then(resp => {   
          vue.pageInfo = {
            currentPage: parseInt(resp.headers['x-page'], 10),
            totalItems: parseInt(resp.headers['x-total'], 10)
          } 
          vue.repositories = _.map(resp.data, item => {
            return {id: item.id, name: item.name, namespace: item.namespace.full_path, url: item.http_url_to_repo}
          })

          this.$nextTick(() => {
            _.forEach(vue.repositories, row => {
              if (vue.isFixSelected(row)) {
                vue.$refs.repoSelection.toggleRowSelection(row)
              }
            })
          })
        }).catch(error => {
          this.$notify.error({ title: 'Error', message: '加载失败' + error })
        }).finally(() => {
          mask.close()
        })
    }
  }
}
</script>

<style scoped>

</style>