const { Router } = require('express')
const { getStats } = require('../controllers/dashboard.controller')
const { requireAuth } = require('../middleware/auth.middleware')

const router = Router()

router.get('/stats', requireAuth, getStats)

module.exports = router
