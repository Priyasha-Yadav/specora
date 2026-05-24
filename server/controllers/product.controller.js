const Product = require('../models/Product')

async function listProducts(req, res) {
  const products = await Product.find().sort({ createdAt: -1 })
  res.json(products)
}

async function createProduct(req, res) {
  const { productName, productCode, tradeName, grade, specificationNo, description, specifications } = req.body

  if (!productName) {
    res.status(400).json({ message: 'Product name is required' })
    return
  }

  const product = await Product.create({
    productName,
    productCode: productCode || '',
    tradeName: tradeName || '',
    grade: grade || '',
    specificationNo: specificationNo || '',
    description: description || '',
    specifications: Array.isArray(specifications) ? specifications : [],
  })

  res.status(201).json(product)
}

async function updateProduct(req, res) {
  const existing = await Product.findById(req.params.id)

  if (!existing) {
    res.status(404).json({ message: 'Product not found' })
    return
  }

  const updates = { ...req.body, version: existing.version + 1 }
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  )

  res.json(product)
}

async function deleteProduct(req, res) {
  const result = await Product.findByIdAndDelete(req.params.id)
  if (!result) {
    res.status(404).json({ message: 'Product not found' })
    return
  }
  res.sendStatus(204)
}

module.exports = {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
}
