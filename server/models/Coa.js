const mongoose = require('mongoose')

const resultSchema = new mongoose.Schema({
  parameter: String,
  specification: String,
  method: String,
  unit: String,
  result: String,
  status: String,
}, { _id: false })

const coaSchema = new mongoose.Schema({
  coaNumber: { type: String, required: true, unique: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  clientName: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  batchNo: { type: String, required: true },
  manufacturingDate: String,
  expiryDate: String,
  results: [resultSchema],
  status: { type: String, default: 'Generated' },
  testedBy: String,
}, { timestamps: true })

module.exports = mongoose.model('Coa', coaSchema)
