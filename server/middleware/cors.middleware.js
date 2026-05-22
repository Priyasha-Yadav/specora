const config = require('../config/env')

function corsMiddleware(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', config.clientOrigin)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }

  next()
}

module.exports = {
  corsMiddleware,
}
