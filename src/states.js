import Vuex from 'vuex'
import Vue from 'vue'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        security: {
            token: '',
            identity: {}
        }
    },
    mutations: {
        securityContext (state, data) {
            if (data) {
                state.security = {
                    token: data.token,
                    identity: data.identity
                }
            } else {
                state.security = {
                    token: '',
                    identity: {}
                }
            }
        }
    }
})