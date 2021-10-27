import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import states from './states'
import VueCookies from 'vue-cookies'
import router from './router'

Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(VueCookies)

new Vue({
  router,
  store: states,
  render: h => h(App),
}).$mount('#app')
