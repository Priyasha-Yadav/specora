const mongoose = require('mongoose')

const specificationSchema = new mongoose.Schema({
  parameter: { type: String, default: '' },
  specification: { type: String, default: '' },
  method: { type: String, default: '' },
  unit: { type: String, default: '' },
}, { _id: false })

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productCode: { type: String, default: '' },
  grade: { type: String, default: '' },
  description: { type: String, default: '' },
  version: { type: Number, default: 1 },
  specifications: [specificationSchema],
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)
