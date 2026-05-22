const User = require('../models/User')

async function listUsers(req, res) {
  const users = await User.find().select('-password').sort({ createdAt: -1 })
  res.json(users)
}

async function createUser(req, res) {
  const { name, email, password, role, status } = req.body

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email, and password are required' })
    return
  }

  const existing = await User.findOne({ email })
  if (existing) {
    res.status(409).json({ message: 'A user with this email already exists' })
    return
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'LAB_OPERATOR',
    status: status || 'Active',
  })

  const { password: _, ...safe } = user.toObject()
  res.status(201).json(safe)
}

async function updateUser(req, res) {
  const updates = { ...req.body }
  // Don't allow role escalation to ADMIN via this endpoint
  delete updates.role

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password')

  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  res.json(user)
}

async function deleteUser(req, res) {
  const result = await User.findByIdAndDelete(req.params.id)
  if (!result) {
    res.status(404).json({ message: 'User not found' })
    return
  }
  res.sendStatus(204)
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
}
