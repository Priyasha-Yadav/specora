const config = require('../config/env')
const { healthCheck } = require('../controllers/health.controller')

function main() {
  const res = {
    payload: null,
    json(payload) {
      this.payload = payload
    },
  }
  healthCheck({}, res)

  if (res.payload.status !== 'ok') {
    throw new Error('Health controller check failed')
  }

  console.log(
    `Health check passed: ${res.payload.service} is ${res.payload.status} at http://127.0.0.1:${config.port}${config.apiPrefix}/health`,
  )
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
