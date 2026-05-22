const express = require('express')
const config = require('./config/env')
const apiRoutes = require('./routes')
const { corsMiddleware } = require('./middleware/cors.middleware')
const { errorHandler, notFound } = require('./middleware/error.middleware')
const { requestLogger } = require('./utils/logger')

function createApp() {
  const app = express()

  app.use(corsMiddleware)
  app.use(express.json())
  app.use(requestLogger)
  app.use(config.apiPrefix, apiRoutes)
  app.use(notFound)
  app.use(errorHandler)

  return app
}

module.exports = {
  createApp,
}
