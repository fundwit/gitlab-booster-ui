import "axios"
import axios from "axios"
import adapter from "axios/lib/adapters/http"

axios.defaults.adapter = adapter

export const validAccessLevels = [
    { level: 0,  name: 'No One' },
    { level: 30, name: 'Developer'},
    { level: 40, name: 'Maintainer'},
    { level: 60, name: 'Admin'}
]

const clientsCache = {}
function getClient(endpoint) {
    let client = clientsCache[endpoint]
    if (!client) {
        client = new Client(endpoint)
        clientsCache[endpoint] = client
    }
    return client
}

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

    async userInfo(token) {
        return axios.get(this.withPath('/api/v4/user'), {
            headers: { Authorization: `Bearer ${token}` }
        }).then( resp => resp.data)
    }
    async listProjects(token, page, per_page, search) {
        return axios.get(this.withPath('/api/v4/projects'), {
            params:  {
                 page: page,
                 per_page: per_page,
                 search_namespaces: true,
                 search: search.trim()
            },
            headers: { Authorization: `Bearer ${token}` }
        })
    }

    async branchDetail(token, repo, branchName) {
        return axios.get(this.withPath(`/api/v4/projects/${repo.id}/repository/branches/${encodeURIComponent(branchName.trim())}`), {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.data)
    }

    async branchCreate(token, repo, newBranchName, ref) {
        return axios.post(this.withPath(`/api/v4/projects/${repo.id}/repository/branches?`+
                `branch=${encodeURIComponent(newBranchName.trim())}&ref=${encodeURIComponent(ref.trim())}`), "", {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.data)
    }
    async branchDelete(token, repo, branchName) {
        return axios.delete(this.withPath(`/api/v4/projects/${repo.id}/repository/branches/${encodeURIComponent(branchName.trim())}`), {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.data)
    }

    async tagDetail(token, repo, tagName) {
        return axios.get(this.withPath(`/api/v4/projects/${repo.id}/repository/tags/${encodeURIComponent(tagName.trim())}`), {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.data)
    }
    async tagCreate(token, repo, newTagName, ref) {
        return axios.post(this.withPath(`/api/v4/projects/${repo.id}/repository/tags`), {
            tag_name: newTagName.trim(),
            ref: ref.trim()
        }, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.data)
    }
    async tagDelete(token, repo, tagName) {
        return axios.delete(this.withPath(`/api/v4/projects/${repo.id}/repository/tags/${encodeURIComponent(tagName.trim())}`), {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.data)
    }

    async detailProtectBranch(token, repo, branchName) {
        return axios.get(this.withPath(`/api/v4/projects/${repo.id}/protected_branches/${encodeURIComponent(branchName.trim())}`), {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.data)
    }
    async createProtectedBranch(token, repo, branchName, mergeAccessLevels, pushAccessLevels) {
        // &unprotect_access_level=40 (default 40)
        return axios.post(this.withPath(`/api/v4/projects/${repo.id}/protected_branches`+
                `?name=${encodeURIComponent(branchName.trim())}&merge_access_level=${mergeAccessLevels}&push_access_level=${pushAccessLevels}`), "", {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.data)
    }

    async deleteProtectedBranch(token, repo, branchName) {
        return axios.delete(this.withPath(`/api/v4/projects/${repo.id}/protected_branches/${encodeURIComponent(branchName.trim())}`), {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.data)
    }

    async createMR(token, repo, sourceBranch, targetBranch, MRTitle) {
        return axios.post(this.withPath(`/api/v4/projects/${repo.id}/merge_requests`), {
          source_branch: sourceBranch.trim(),
          target_branch: targetBranch.trim(),
          title: MRTitle.trim()
        }, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.data)
    }

    async queryMR(token, repo, sourceBranch, targetBranch, search) {
        return axios.get(this.withPath(`/api/v4/projects/${repo.id}/merge_requests`+
                `?source_branch=${encodeURIComponent(sourceBranch.trim())}&target_branch=${encodeURIComponent(targetBranch.trim())}&search=${encodeURIComponent(search.trim())}`), {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.data)
    }

    async acceptMR(token, repo, mriid, mrMessage) {
        return axios.put(this.withPath(`/api/v4/projects/${repo.id}/merge_requests/${mriid}/merge`), {
            merge_commit_message: mrMessage.trim(),
            should_remove_source_branch : false
        }, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.data)
    }
}

export default getClient