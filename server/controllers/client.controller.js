const Client = require('../models/Client')

async function listClients(req, res) {
  const search = req.query.search?.toLowerCase()
  let query = {}

  if (search) {
    query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { gst: { $regex: search, $options: 'i' } },
      ],
    }
  }

  const clients = await Client.find(query).sort({ createdAt: -1 })
  res.json(clients)
}

async function createClient(req, res) {
  const { name, company, contact, email, gst, status } = req.body

  if (!name || !company) {
    res.status(400).json({ message: 'Client name and company are required' })
    return
  }

  const client = await Client.create({
    name,
    company,
    contact: contact || '',
    email: email || '',
    gst: gst || '',
    status: status || 'Active',
  })

  res.status(201).json(client)
}

async function updateClient(req, res) {
  const client = await Client.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  )

  if (!client) {
    res.status(404).json({ message: 'Client not found' })
    return
  }

  res.json(client)
}

async function deleteClient(req, res) {
  const result = await Client.findByIdAndDelete(req.params.id)
  if (!result) {
    res.status(404).json({ message: 'Client not found' })
    return
  }
  res.sendStatus(204)
}

module.exports = {
  createClient,
  deleteClient,
  listClients,
  updateClient,
}
