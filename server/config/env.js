require('dotenv').config({ quiet: true })

const config = {
  appName: 'Specora COA API',
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8080),
  apiPrefix: process.env.API_PREFIX || '/api',
  jwtSecret: process.env.JWT_SECRET || 'jwt-secret',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || '',
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  labOperatorEmail: process.env.LAB_OPERATOR_EMAIL,
  labOperatorPassword: process.env.LAB_OPERATOR_PASSWORD || '',
  skipDatabase: process.env.SKIP_DATABASE === 'true',
}

module.exports = config
