const config = require('./config/env')
const { createApp } = require('./app')
const { connectDatabase } = require('./config/database')
const { box } = require('./utils/logger')

const app = createApp()

async function bootstrap() {
  const database = await connectDatabase()

  app.listen(config.port, () => {
    box('Specora server is live', [
      `Environment : ${config.env}`,
      `Database    : ${database.status}${database.host ? ` (${database.host})` : ''}`,
      `API Base    : http://127.0.0.1:${config.port}${config.apiPrefix}`,
      `Health     : http://127.0.0.1:${config.port}${config.apiPrefix}/health`,
    ])
  })
}

bootstrap().catch((err) => {
  box('Specora server failed to start', [err.message])
  process.exit(1)
})
