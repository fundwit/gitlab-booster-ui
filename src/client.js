import "axios"
import axios from "axios"
import adapter from "axios/lib/adapters/http"

axios.defaults.adapter = adapter

export class Client {
    constructor (url) {
        this.url = url
    }
    withPath(path) {
        if (!path.startsWith('/')) {
            path = '/' + path
        }
        return `${this.url}${path}`
    }

    async newGitlabApprove(redirectUri) {
        return axios.post(this.withPath('/v1/gitlabv4/approves'), {redirectUri: redirectUri}).then(r => r.data)
    }
    async newGitlabSession(code, state) {
        return axios.post(this.withPath('/v1/gitlabv4/sessions'), {code: code, state: state}).then(r => r.data)
    }
    
    async listManifests() {
        return axios.get(this.withPath('/v1/manifests')).then(r => r.data)
    }
    async manifestDetail(id) {
        return axios.get(this.withPath('/v1/manifests/' + id)).then(r => r.data)
    }
    async newManifest(name) {
        return axios.post(this.withPath('/v1/manifests'), {name: name.trim()}).then(r => r.data)
    }
    async updateManifest(id, changes) {
        if (changes.name) {
            changes.name = changes.name.trim()
        }
        return axios.put(this.withPath('/v1/manifests/' + id), changes).then(r => r.data)
    }
    async deleteManifest(id) {
        return axios.delete(this.withPath('/v1/manifests/' + id)).then(r => r.data)
    }
  
    async appendManifestItems(id, items) {
        return axios.post(this.withPath('/v1/manifests/'+id+'/items'), items).then(r => r.data)
    }
    async removeManifestItems(id, itemIds) {
        return axios.request({
            method: 'DELETE',
            url: this.withPath('/v1/manifests/'+id+'/items'),
            data: itemIds
        }).then(r => r.data)
    }
}

export default new Client('/api')