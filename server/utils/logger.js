function box(message, rows = []) {
  const content = [message, ...rows].filter(Boolean)
  const width = Math.max(...content.map((line) => line.length), 24)
  const border = `+${'-'.repeat(width + 2)}+`

  console.log(border)
  content.forEach((line) => {
    console.log(`| ${line.padEnd(width)} |`)
  })
  console.log(border)
}

function requestLogger(req, res, next) {
  const startedAt = Date.now()

  res.on('finish', () => {
    const duration = `${Date.now() - startedAt}ms`
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}`)
  })

  next()
}

module.exports = {
  box,
  requestLogger,
}
