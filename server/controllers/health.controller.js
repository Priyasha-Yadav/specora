const config = require('../config/env')

function healthCheck(req, res) {
  res.json({
    status: 'ok',
    service: 'specora-api',
    environment: config.env,
    uptimeSeconds: Math.round(process.uptime()),
    checkedAt: new Date().toISOString(),
  })
}

module.exports = {
  healthCheck,
}
