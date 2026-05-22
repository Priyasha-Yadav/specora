const { login } = require('../controllers/auth.controller')
const { createClient, listClients } = require('../controllers/client.controller')
const { createProduct, listProducts } = require('../controllers/product.controller')
const { createCoa, listCoas } = require('../controllers/coa.controller')
const { getStats } = require('../controllers/dashboard.controller')
const { healthCheck } = require('../controllers/health.controller')
const { resetStore, store } = require('../data/store')

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

function call(handler, req = {}) {
  const res = mockRes()
  handler(
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

function main() {
  resetStore()

  const health = call(healthCheck)
  expect(health.payload.status === 'ok', 'Health check failed')

  const auth = call(login, {
    body: { email: 'admin@specora.co', password: 'admin123', role: 'ADMIN' },
  })
  expect(auth.payload.token, 'Login did not return a token')

  const client = call(createClient, {
    body: { name: 'QA Contact', company: 'Specora Test Client' },
  })
  expect(client.statusCode === 201, 'Client was not created')
  expect(store.clients.length === 1, 'Client store count mismatch')

  const product = call(createProduct, {
    body: {
      productName: 'Acetic Acid',
      specifications: [{ parameter: 'Purity', specification: '>= 99', method: 'ASTM-X12', unit: '%' }],
    },
  })
  expect(product.statusCode === 201, 'Product was not created')
  expect(store.products.length === 1, 'Product store count mismatch')

  const coa = call(createCoa, {
    body: {
      clientId: client.payload.id,
      productId: product.payload.id,
      batchNo: 'BATCH-001',
      results: [{ parameter: 'Purity', specification: '>= 99', result: '99.2', status: 'Pass' }],
    },
  })
  expect(coa.statusCode === 201, 'COA was not created')

  const clients = call(listClients)
  const products = call(listProducts)
  const coas = call(listCoas)
  const stats = call(getStats)

  expect(clients.payload.length === 1, 'Client list failed')
  expect(products.payload.length === 1, 'Product list failed')
  expect(coas.payload.length === 1, 'COA list failed')
  expect(stats.payload.totalCoas === 1, 'Dashboard stats failed')

  console.log('Smoke tests passed: auth, health, clients, products, COA, dashboard stats')
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
