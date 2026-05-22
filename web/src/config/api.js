export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080/api'

export const API_ENDPOINTS = {
  authLogin: '/auth/login',
  clients: '/clients',
  coa: '/coa',
  dashboardStats: '/dashboard/stats',
  health: '/health',
  products: '/products',
  users: '/users',
}
