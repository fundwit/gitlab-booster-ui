<template>
  <el-row>
    <el-col :span="12" :offset="6">
      <el-card class="box-card" shadow="always">
        <div slot="header" class="clearfix">
          <span>Login</span>
        </div>
        <el-button type="primary" @click="onGitlabApprove">Gitlab登录</el-button>
      </el-card>
     </el-col>
  </el-row>
</template>

<script>
import "../client"
import client from '../client'
import parse from "url-parse"
import gitlabV4Client from '../gitlabV4Client'

export default {
  name: 'Login',
  props: {
  },
  mounted () {
    const vue = this
    if (this.$store.state.security.token) {
      return
    }

    const gitlabToken = this.$cookies.get('token')
    let url = parse(location.href, true)

    if (gitlabToken) {
       const mask = this.$loading({ lock: true, text: 'Authenticating', spinner: 'el-icon-loading', background: 'rgba(255,255,255,0.7)' })
       this.gitlabUserInfo(gitlabToken).catch(() => {
        vue.$store.commit("securityContext", { token: '', identity: {}})
        vue.$cookies.remove('token')
        console.log("token is invalid, authentication is required")
       }).finally(() => {
          mask.close()
       })
    } else if(url.query.code && url.query.state) {
      this.gitlabAuth(url.query.code, url.query.state)
    }
  },
  methods: {
    gitlabUserInfo(gitlabToken) {
      const vue = this
      return gitlabV4Client(vue.$cookies.get('gitlabEndpoint')).userInfo(gitlabToken).then(data => {
        vue.$store.commit("securityContext", {token: gitlabToken, identity: {
          id: data.id, name: data.username, displayName: data.name
        }})
        // vue.$notify.success({ title: 'Success', message: '认证成功' })
        vue.$cookies.set('token', gitlabToken)
      })
    },

    gitlabAuth(code, state) {
      const vue = this
      const mask = this.$loading({ lock: true, text: 'Authenticating', spinner: 'el-icon-loading', background: 'rgba(255,255,255,0.7)' })

      client.newGitlabSession(code, state).then( data => {
        vue.$cookies.set('gitlabEndpoint', data.endpoint)

        const gitlabToken = data.token
        return vue.gitlabUserInfo(gitlabToken).then((data) => {
          location.href = location.href.substring(0, location.href.indexOf('?'))
          return Promise.resolve(data)
        })
      }).catch(error => {
        vue.$store.commit("securityContext", { token: '', identity: {}})
        vue.$cookies.remove('token')
        this.$notify.error({ title: 'Error', message: '认证失败' + error })
      }).finally(()=>{
          mask.close()
      })
    },

    onGitlabApprove () {
      const vue = this
      const mask = this.$loading({ lock: true, text: 'Loading', spinner: 'el-icon-loading', background: 'rgba(255,255,255,0.7)' })

      // 获取调整 url, 执行调整
      const rootIndex = location.href.indexOf('/', 8)
      const rootUri = rootIndex > 0 ? location.href.substring(0, rootIndex) : location.href
      const redirectUri = encodeURIComponent(rootUri + "/")

      client.newGitlabApprove(redirectUri).then( resp => {
        vue.$cookies.set('gitlabEndpoint', resp.endpoint)
        let approveUrl = `${resp.providerUri}?client_id=${resp.clientId}&response_type=${resp.responseType}&state=${resp.state}&redirect_uri=${redirectUri}`
        location.href = approveUrl
      }).catch(error => {
        vue.$store.commit("securityContext", { token: '', identity: {}})
        vue.$cookies.remove('token')
        this.$notify.error({ title: 'Error', message: '登录失败' + error })
      }).finally(()=>{
          mask.close()
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
