import Vue from 'vue'
import VueRouter from 'vue-router'
import GroupList from '../components/RepositoryGroupList'
import GroupDetail from '../components/RepositoryGroup'

Vue.use(VueRouter)

const routes = [
    { path: '/manifests',  name: 'manifestList', component: GroupList },
    { path: '/manifests/:id',  name: 'manifestDetail', component: GroupDetail }
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

export default router