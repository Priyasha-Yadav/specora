const { Router } = require('express')
const {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} = require('../controllers/product.controller')
const { requireAuth } = require('../middleware/auth.middleware')

const router = Router()

router.get('/', requireAuth, listProducts)
router.post('/', requireAuth, createProduct)
router.put('/:id', requireAuth, updateProduct)
router.delete('/:id', requireAuth, deleteProduct)

module.exports = router
