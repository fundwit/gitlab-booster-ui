const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const qs = require('qs')
const _ = require('lodash')

const noMock = process.env.NO_MOCK === 'true'

const clientId = 'aaa101fa7cf5522d49c8a122ee791fbc57da540e43149a909d2f323cb8a92a8c'
const clientSecret = '76fa9c59ba39a5e10521828d23465df66e075a6d1a03654eab2b7547a6616206'

const cache = {}
let manifestRepo = []
const mock = {
    'GET /api/v1/manifests': (req, res) => {
        res.status(200).json(manifestRepo)
    },
    'POST /api/v1/manifests': (req, res) => {
        const data = {
            id: uuidv4(),
            name: req.body.name
        }
        manifestRepo.push(data)
        res.status(201).json(data)
    },
    'DELETE /api/v1/manifests/:id': (req, res) => {
        manifestRepo = _.filter(manifestRepo, item => item.id !== req.params.id)
        res.status(204).json()
    },

    'POST /api/v1/gitlabv4/approves': (req, res) => {
        let state = uuidv4()
        cache[state] = req.body.redirectUri
        res.status(201).json({
            state: state,
            providerUri:  'http://djdam.h3c.com:21100/oauth/authorize',
            clientId: clientId,
            responseType: 'code'
        })
    },
    'POST /api/v1/gitlabv4/sessions': (req, res) => {
        const {code, state} = req.body
        console.log(`${state}: ${code}`)
        const redirectUri = 'http://10.125.104.190:8080/' // decodeURIComponent(cache[state])

        const body = qs.stringify({
            client_id: clientId, client_secret: clientSecret,
            code: req.body.code, grant_type: 'authorization_code',
            redirect_uri: redirectUri
        })
        axios.post('http://djdam.h3c.com:21100/oauth/token', body, {
            headers: { 'Content-Type': "application/x-www-form-urlencoded" }
        }).then(r => {
            const data = r.data // access_token, token_type, expires_in, refresh_token, created_at
            res.status(201)
            .cookie("gitlab-token", data.access_token, {maxAge: 1800000, domain:'/', httpOnly: true})
            .json({
                token: data.access_token,
                identity: {
                    id: '123',
                    name: 'test',
                    displayName: 'Test'
                }
            })
        }).catch(error => {
            debugger
            console.log(error)
            res.status(500)
            .json({})
        })
    }
}

module.exports = (noMock ? {} : mock)