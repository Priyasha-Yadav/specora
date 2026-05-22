const { Router } = require('express')
const authRoutes = require('./auth.routes')
const clientRoutes = require('./client.routes')
const coaRoutes = require('./coa.routes')
const dashboardRoutes = require('./dashboard.routes')
const healthRoutes = require('./health.routes')
const productRoutes = require('./product.routes')
const userRoutes = require('./user.routes')

const router = Router()

router.use('/auth', authRoutes)
router.use('/clients', clientRoutes)
router.use('/products', productRoutes)
router.use('/coa', coaRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/health', healthRoutes)
router.use('/users', userRoutes)

module.exports = router
