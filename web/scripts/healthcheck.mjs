const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080/api'

function main() {
  const healthUrl = new URL(`${apiBaseUrl}/health`)

  if (!healthUrl.protocol.startsWith('http')) {
    throw new Error(`Invalid frontend API health URL: ${healthUrl}`)
  }

  console.log(`Frontend health config passed: API health target is ${healthUrl.toString()}`)
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
