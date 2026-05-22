const { Router } = require('express')
const { createCoa, listCoas } = require('../controllers/coa.controller')
const { requireAuth } = require('../middleware/auth.middleware')

const router = Router()

router.get('/', requireAuth, listCoas)
router.post('/', requireAuth, createCoa)

module.exports = router
