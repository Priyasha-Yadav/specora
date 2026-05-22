const jwt = require('jsonwebtoken')
const config = require('../config/env')
const User = require('../models/User')

async function login(req, res) {
  const { email, password, role } = req.body

  if (!email || !password || !role) {
    res.status(400).json({ message: 'Email, password, and role are required' })
    return
  }

  // Check hardcoded admin first
  if (role === 'ADMIN' && email === config.adminEmail && password === config.adminPassword) {
    const user = { id: 'admin', name: 'Quality Administrator', email, role: 'ADMIN' }
    const token = jwt.sign(user, config.jwtSecret, { expiresIn: '8h' })
    return res.json({ token, user })
  }

  // Check lab operators from the database
  const dbUser = await User.findOne({ email, role })
  if (!dbUser || dbUser.password !== password) {
    res.status(401).json({ message: 'Invalid email or password for selected role' })
    return
  }

  if (dbUser.status === 'Inactive') {
    res.status(403).json({ message: 'Account is inactive. Contact admin.' })
    return
  }

  const user = {
    id: dbUser._id.toString(),
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
  }
  const token = jwt.sign(user, config.jwtSecret, { expiresIn: '8h' })
  res.json({ token, user })
}

module.exports = {
  login,
}
