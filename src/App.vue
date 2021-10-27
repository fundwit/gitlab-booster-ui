<template>
  <div id="app">
    <el-row style="padding: 10px 0 10px 0">
      <el-col :span="20">
        <div class="grid-content">
          <span style="color: dodgerblue; font-weight: bold">Gitlab Booster</span>
          <el-divider direction="vertical"></el-divider>
          <router-link to="/">Home</router-link>
          <el-divider direction="vertical"></el-divider>
          <router-link to="/manifests">代码库管理</router-link>
        </div> 
      </el-col>
      <el-col :span="4">
        <div class="grid-content" v-if="security.identity.name">
          {{security.identity.displayName}}
          <el-divider direction="vertical"></el-divider>
          <a href="#" @click="logout">退出</a>
        </div>
      </el-col>
    </el-row>

    <Login v-if="!security.identity.name"/>
    <div v-if="security.identity.name">
      <router-view/>
    </div>
    <!-- <RepositoryGroupList v-if="security.identity.name"/> -->
  </div>
</template>

<script>
import Login from './components/Login.vue'
// import RepositoryGroup from './components/RepositoryGroup'

import {mapState} from 'vuex'

export default {
  name: 'App',
  components: {
    Login,
    //RepositoryGroup
  },
  computed: {
    ...mapState({
      security: state => state.security
    })
  },
  methods: {
    logout () {
      this.$store.commit("securityContext", { token: '', identity: {}})
      this.$cookies.remove('token')
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
body {
  margin: 0;
}
.title {
    margin: 5px 0 5px 0;
    padding: 5px;
    border-top: 1px solid lightgray;
    border-bottom: 1px solid lightgray;
    background-color: #EEEEEE;
}
</style>
