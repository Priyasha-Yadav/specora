const mongoose = require('mongoose')
const { login } = require('../controllers/auth.controller')
const { createClient, listClients } = require('../controllers/client.controller')
const { createProduct, listProducts } = require('../controllers/product.controller')
const { createCoa, listCoas } = require('../controllers/coa.controller')
const { getStats } = require('../controllers/dashboard.controller')
const { healthCheck } = require('../controllers/health.controller')
const { connectDatabase } = require('../config/database')
const Client = require('../models/Client')
const Coa = require('../models/Coa')
const Product = require('../models/Product')

function mockRes() {
  return {
    statusCode: 200,
    payload: null,
    json(payload) {
      this.payload = payload
      return this
    },
    status(code) {
      this.statusCode = code
      return this
    },
    sendStatus(code) {
      this.statusCode = code
      return this
    },
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

async function call(handler, req = {}) {
  const res = mockRes()
  await handler(
    {
      body: {},
      params: {},
      query: {},
      user: { name: 'Quality Administrator', role: 'ADMIN' },
      ...req,
    },
    res,
  )
  return res
}

async function main() {
  await connectDatabase()

  const marker = `SMOKE-${Date.now()}`

  try {
    const health = await call(healthCheck)
    expect(health.payload.status === 'ok', 'Health check failed')

    const auth = await call(login, {
      body: { email: 'admin@specora.co', password: 'admin123', role: 'ADMIN' },
    })
    expect(auth.payload.token, 'Login did not return a token')

    const client = await call(createClient, {
      body: {
        name: 'QA Contact',
        company: marker,
        email: `${marker.toLowerCase()}@specora.test`,
      },
    })
    expect(client.statusCode === 201, 'Client was not created')

    const product = await call(createProduct, {
      body: {
        productName: marker,
        productCode: 'PEG1',
        tradeName: 'Pharcogol 200',
        specificationNo: 'SPC/FP/PEG/031',
        specifications: [{ parameter: 'Purity', specification: '>= 99', method: 'ASTM-X12', unit: '%' }],
      },
    })
    expect(product.statusCode === 201, 'Product was not created')

    const coa = await call(createCoa, {
      body: {
        clientId: client.payload._id,
        productId: product.payload._id,
        batchNo: marker,
        manufacturingDate: '2026-05-24',
        expiryDate: '2028-05-24',
        batchReleaseDate: '2026-05-24',
        arNo: 'FP/PEG/26/064',
        batchQuantity: '10020.90 kg',
        pageNo: '01 of 01',
        results: [{ parameter: 'Purity', specification: '>= 99', result: '99.2', status: 'Pass' }],
      },
    })
    expect(coa.statusCode === 201, 'COA was not created')

    const clients = await call(listClients, { query: { search: marker } })
    const products = await call(listProducts)
    const coas = await call(listCoas)
    const stats = await call(getStats)

    expect(clients.payload.some((item) => item.company === marker), 'Client list failed')
    expect(products.payload.some((item) => item.productName === marker), 'Product list failed')
    expect(coas.payload.some((item) => item.batchNo === marker), 'COA list failed')
    expect(stats.payload.totalCoas >= 1, 'Dashboard stats failed')

    console.log('Smoke tests passed: auth, health, clients, products, COA, dashboard stats')
  } finally {
    await Coa.deleteMany({ batchNo: marker })
    await Client.deleteMany({ company: marker })
    await Product.deleteMany({ productName: marker })
    await mongoose.disconnect()
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
