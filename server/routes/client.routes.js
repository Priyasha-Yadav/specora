const { Router } = require('express')
const {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} = require('../controllers/client.controller')
const { requireAuth } = require('../middleware/auth.middleware')

const router = Router()

router.get('/', requireAuth, listClients)
router.post('/', requireAuth, createClient)
router.put('/:id', requireAuth, updateClient)
router.delete('/:id', requireAuth, deleteClient)

module.exports = router
