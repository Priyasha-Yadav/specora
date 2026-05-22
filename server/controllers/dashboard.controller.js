const Client = require('../models/Client')
const Product = require('../models/Product')
const Coa = require('../models/Coa')

async function getStats(req, res) {
  const [totalClients, totalProducts, totalCoas, pendingCoas, recentActivity] = await Promise.all([
    Client.countDocuments(),
    Product.countDocuments(),
    Coa.countDocuments(),
    Coa.countDocuments({ status: 'Pending' }),
    Coa.find().sort({ createdAt: -1 }).limit(5),
  ])

  res.json({
    totalClients,
    totalProducts,
    totalCoas,
    pendingCoas,
    recentActivity,
  })
}

module.exports = {
  getStats,
}
