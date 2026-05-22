const mongoose = require('mongoose')
const config = require('./env')

async function connectDatabase() {
  if (config.skipDatabase) {
    return { status: 'skipped' }
  }

  if (!config.mongoUri) {
    throw new Error('MONGO_URI is required. Add it to server/.env before starting the API.')
  }

  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
  })

  return {
    status: 'connected',
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  }
}

module.exports = {
  connectDatabase,
}
