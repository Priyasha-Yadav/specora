const jwt = require('jsonwebtoken')
const config = require('../config/env')

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    res.status(401).json({ message: 'Missing authorization token' })
    return
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret)
    next()
  } catch {
    res.status(401).json({ message: 'Invalid authorization token' })
  }
}

module.exports = {
  requireAuth,
}
