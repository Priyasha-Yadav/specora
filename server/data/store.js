const store = {
  clients: [],
  products: [],
  coas: [],
  users: [],
}

function resetStore() {
  store.clients = []
  store.products = []
  store.coas = []
  store.users = []
}

module.exports = {
  store,
  resetStore,
}
