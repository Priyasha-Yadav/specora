const { Router } = require('express')
const { createCoa, deleteCoa, listCoas } = require('../controllers/coa.controller')
const { requireAuth } = require('../middleware/auth.middleware')

const router = Router()

router.get('/', requireAuth, listCoas)
router.post('/', requireAuth, createCoa)
router.delete('/:id', requireAuth, deleteCoa)

module.exports = router
