const path = require('path')
const apiMocker = require('mocker-api')

module.exports = {
    devServer: {
        // before(app) {
        //     apiMocker(app, path.resolve("./tests/mocker/index.js"), {
        //         proxy: {
        //             '/api': 'http://127.0.0.1:8081/'
        //         },
        //         pathRewrite: {
        //             '^/api': '/'
        //         }
        //     })
        // }
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8090/',
                pathRewrite: {
                    '^/api': ''
                }
            }
        }
    }
}