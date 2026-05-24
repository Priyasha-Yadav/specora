const Coa = require('../models/Coa')
const Client = require('../models/Client')
const Product = require('../models/Product')

function createCoaNumber(count) {
  return `COA-${String(count + 1).padStart(5, '0')}`
}

async function listCoas(req, res) {
  const coas = await Coa.find().sort({ createdAt: -1 })
  res.json(coas)
}

async function createCoa(req, res) {
  const {
    clientId,
    productId,
    batchNo,
    manufacturingDate,
    expiryDate,
    batchReleaseDate,
    arNo,
    batchQuantity,
    pageNo,
    results,
  } = req.body
  const client = await Client.findById(clientId)
  const product = await Product.findById(productId)

  if (!client || !product || !batchNo) {
    res.status(400).json({ message: 'Client, product, and batch number are required' })
    return
  }

  const totalCoas = await Coa.countDocuments()

  const coa = await Coa.create({
    coaNumber: createCoaNumber(totalCoas),
    clientId,
    clientName: client.company,
    productId,
    productName: product.productName,
    productCode: product.productCode,
    tradeName: product.tradeName,
    batchNo,
    manufacturingDate,
    expiryDate,
    batchReleaseDate,
    arNo,
    specificationNo: product.specificationNo,
    batchQuantity,
    pageNo,
    dateOfIssue: new Date().toISOString(),
    results: Array.isArray(results) ? results : [],
    status: 'Generated',
    testedBy: req.user.name,
  })

  await Client.findByIdAndUpdate(clientId, { $inc: { coas: 1 } })

  res.status(201).json(coa)
}

async function deleteCoa(req, res) {
  const coa = await Coa.findByIdAndDelete(req.params.id)
  if (!coa) {
    res.status(404).json({ message: 'COA not found' })
    return
  }
  res.json({ message: 'COA deleted' })
}

module.exports = {
  createCoa,
  deleteCoa,
  listCoas,
}
