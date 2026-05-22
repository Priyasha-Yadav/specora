const mongoose = require('mongoose')

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  contact: { type: String, default: '' },
  email: { type: String, default: '' },
  gst: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'On Hold', 'Inactive'], default: 'Active' },
  coas: { type: Number, default: 0 },
}, { timestamps: true })

module.exports = mongoose.model('Client', clientSchema)
