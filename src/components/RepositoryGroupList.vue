<template>
    <div>
      <div class="title">代码库组</div>
      <div>
        <el-input v-model="newItemName" placeholder="请输入名称" size="medium" style="width: 200px"></el-input>
        <el-button type="primary" size="medium" @click="onCreate()">新建代码库组</el-button>
      </div>
      <div>
        <el-table :data="repoGroups" style="width: 100%">
          <el-table-column label="名称">
            <template slot-scope="scope">
              <router-link v-if="!scope.row.isEditing" :to="'/manifests/'+scope.row.id">{{ scope.row.name}}</router-link>
              <el-input v-if="scope.row.isEditing" v-model="editingItem.name" placeholder="请输入名称"/>
            </template>
          </el-table-column>
          <el-table-column label="备注">
            <template slot-scope="scope">
              <span v-if="!scope.row.isEditing">{{ scope.row.note}}</span>
              <el-input v-if="scope.row.isEditing" v-model="editingItem.note" placeholder="请输入备注"/>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template slot-scope="scope">
              <el-button v-if="!scope.row.isEditing" size="mini" type="primary" @click="handleShowEdit(scope)">编辑</el-button>
              <el-button v-if="!scope.row.isEditing" size="mini" type="danger" @click="handleDelete(scope.$index, scope.row)">删除</el-button>

              <el-button v-if="scope.row.isEditing" size="mini" type="success" @click="handleEditSave(scope)">保存</el-button>
              <el-button v-if="scope.row.isEditing" size="mini" @click="handleEditAbort(scope)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
</template>

<script>
import client from '../client'
import _ from 'lodash'

export default {
  name: 'RepositoryGroupList',
  data () {
      return {
        newItemName: '',
        editingItem: null, 
        repoGroups: []
      }
  },
  mounted () {
    this.loadList()
  },
  methods: {
    loadList () {
      const vue = this
      const mask = this.$loading({ lock: true, text: 'Loading', spinner: 'el-icon-loading', background: 'rgba(255,255,255,0.7)' })
      client.listManifests().then(data => {
          vue.repoGroups = data
      }).catch(error => {
        this.$notify.error({ title: 'Error', message: '请求失败' + error })
      }).finally(() => {
        mask.close()
      })
    },
    onCreate () {
      const vue = this
      const mask = this.$loading({ lock: true, text: 'Loading', spinner: 'el-icon-loading', background: 'rgba(255,255,255,0.7)' })
      if (!this.newItemName) {
          return
      }
      client.newManifest(this.newItemName).then(() => {
        vue.loadList()
      }).catch(error => {
        this.$notify.error({ title: 'Error', message: '请求失败' + error })
      }).finally(() => {
        mask.close()
      })
    },
    handleShowEdit (scope) {
      this.editingItem = _.cloneDeep(scope.row)
      scope.row.isEditing = true
      this.$set(this.repoGroups, scope.$index, scope.row) // 触发更新
    },
    handleEditSave (scope) {
      const changes = {}
      _.forOwn(this.editingItem, (value, key) => {
        if (value !== scope.row[key]) {
          changes[key] = value
        }
      })
      if (_.keys(changes).length === 0) {
        this.abortEdit(scope, scope.row)
        this.$notify.warning({ title: 'Warning', message: 'no changes' })
        return
      }

      const mask = this.$loading({ lock: true, spinner: 'el-icon-loading', background: 'rgba(255,255,255,0.7)' })
      client.updateManifest(scope.row.id, changes).then(() => {
        this.abortEdit(scope, this.editingItem)
      }).catch(error => {
         this.$notify.error({ title: 'Error', message: '更新失败' + error })
      }).finally(() => {
        mask.close()
      })
    },
    handleEditAbort (scope) {
      this.abortEdit(scope, scope.row)
    },
    abortEdit (scope, updateTo) {
      this.editingWork = null
      delete scope.row.isEditing
      this.$set(this.repoGroups, scope.$index, updateTo)
    },
    handleDelete (index, row) {
      this.$confirm('"' + row.name + '"将被永久删除, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const vue = this
        const mask = this.$loading({ lock: true, text: 'Loading', spinner: 'el-icon-loading', background: 'rgba(255,255,255,0.7)' })
        client.deleteManifest(row.id).then(() => {
          vue.loadList()
        }).catch(error => {
          this.$notify.error({ title: 'Error', message: '请求失败' + error })
        }).finally(() => {
          mask.close()
        })
      }).catch(() => {
        this.$message({ type: 'info', message: '已取消删除' })
      })
    }
  }
}
</script>

<style scoped>
</style>