function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeStatus(status) {
  if (!status) return 'Active'

  return String(status)
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function createCoaNumber(count) {
  return `COA-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`
}

module.exports = {
  createCoaNumber,
  createId,
  normalizeStatus,
}
