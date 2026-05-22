function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err)
    return
  }

  console.error(err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  })
}

module.exports = {
  errorHandler,
  notFound,
}
