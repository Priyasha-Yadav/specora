const { Router } = require('express')
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/user.controller')
const { requireAuth } = require('../middleware/auth.middleware')

const router = Router()

router.get('/', requireAuth, listUsers)
router.post('/', requireAuth, createUser)
router.put('/:id', requireAuth, updateUser)
router.delete('/:id', requireAuth, deleteUser)

module.exports = router
