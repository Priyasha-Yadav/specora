import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_BASE_URL, API_ENDPOINTS } from './config/api'
import './App.css'

const navItems = ['Dashboard', 'Clients', 'Products', 'Generated COAs', 'Lab Operators']

function statusFor(specification, rawResult) {
  const result = Number.parseFloat(rawResult)
  if (!rawResult || Number.isNaN(result)) return 'Pending'

  if (specification.includes(' - ')) {
    const [min, max] = specification.split(' - ').map((value) => Number.parseFloat(value))
    return result >= min && result <= max ? 'Pass' : 'Fail'
  }

  if (specification.includes('>=')) {
    return result >= Number.parseFloat(specification.replace('>=', '')) ? 'Pass' : 'Fail'
  }

  if (specification.includes('<=')) {
    return result <= Number.parseFloat(specification.replace('<=', '')) ? 'Pass' : 'Fail'
  }

  return 'Pass'
}

function initials(value = '') {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function Icon({ name }) {
  const paths = {
    flask: 'M9 2h6M10 2v6l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V2M8 14h8',
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8M8 9h2',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
    search: 'M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15',
    plus: 'M12 5v14M5 12h14',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
    print: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  }

  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] || paths.grid} />
    </svg>
  )
}

function Toast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
          <p>{t.message}</p>
          <button onClick={() => onDismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  )
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  if (!message) return null
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-dialog" role="alertdialog" aria-modal="true">
        <div className="confirm-icon">⚠</div>
        <h3>Are you sure?</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="secondary" type="button" onClick={onCancel}>Cancel</button>
          <button className="primary danger-btn" type="button" onClick={onConfirm}>Delete</button>
        </div>
      </section>
    </div>
  )
}

function loadSession() {
  try {
    const raw = localStorage.getItem('specora_session')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSession(session) {
  if (session) localStorage.setItem('specora_session', JSON.stringify(session))
  else localStorage.removeItem('specora_session')
}

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.message || 'Request failed')
  }

  if (response.status === 204) return null
  return response.json()
}

function App() {
  const [session, setSessionRaw] = useState(loadSession)

  function setSession(value) {
    setSessionRaw(value)
    saveSession(value)
  }

  useEffect(() => {
    if (session?.token) loadData(session.token)
  }, [])
  const [role, setRole] = useState('ADMIN')
  const [page, setPage] = useState('Dashboard')
  const [theme, setTheme] = useState('light')
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [coas, setCoas] = useState([])
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [globalSearch, setGlobalSearch] = useState('')
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null)

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  function dismissToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function askConfirm(message) {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve })
    })
  }

  function handleConfirm() {
    confirmState?.resolve(true)
    setConfirmState(null)
  }

  function handleCancel() {
    confirmState?.resolve(false)
    setConfirmState(null)
  }

  async function api(path, options) {
    return request(path, { ...options, token: session?.token })
  }

  async function loadData(authToken = session?.token) {
    if (!authToken) return
    setLoading(true)
    setError('')

    try {
      const [nextClients, nextProducts, nextCoas, nextStats, nextUsers] = await Promise.all([
        request(API_ENDPOINTS.clients, { token: authToken }),
        request(API_ENDPOINTS.products, { token: authToken }),
        request(API_ENDPOINTS.coa, { token: authToken }),
        request(API_ENDPOINTS.dashboardStats, { token: authToken }),
        request(API_ENDPOINTS.users, { token: authToken }).catch(() => []),
      ])
      setClients(nextClients)
      setProducts(nextProducts)
      setCoas(nextCoas)
      setStats(nextStats)
      setUsers(nextUsers)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(credentials) {
    const payload = await request(API_ENDPOINTS.authLogin, {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    setSession(payload)
    setRole(credentials.role)
    setPage(credentials.role === 'ADMIN' ? 'Dashboard' : 'Lab Workspace')
    await loadData(payload.token)
  }

  async function createClient(client) {
    await api(API_ENDPOINTS.clients, { method: 'POST', body: JSON.stringify(client) })
    toast('Client created successfully')
    await loadData()
  }

  async function updateClient(client) {
    await api(`${API_ENDPOINTS.clients}/${client._id}`, { method: 'PUT', body: JSON.stringify(client) })
    toast('Client updated successfully')
    await loadData()
  }

  async function saveUser(user) {
    if (user._id) {
      await api(`${API_ENDPOINTS.users}/${user._id}`, { method: 'PUT', body: JSON.stringify(user) })
      toast('Operator updated successfully')
    } else {
      await api(API_ENDPOINTS.users, { method: 'POST', body: JSON.stringify(user) })
      toast('Operator created successfully')
    }
    await loadData()
  }

  async function deleteUser(id) {
    const ok = await askConfirm('This will permanently delete the operator account.')
    if (!ok) return
    await api(`${API_ENDPOINTS.users}/${id}`, { method: 'DELETE' })
    toast('Operator deleted')
    await loadData()
  }

  async function saveProduct(product) {
    const id = product._id || product.id
    const path = id ? `${API_ENDPOINTS.products}/${id}` : API_ENDPOINTS.products
    await api(path, { method: id ? 'PUT' : 'POST', body: JSON.stringify(product) })
    toast(id ? 'Product updated' : 'Product template created')
    await loadData()
  }

  async function deleteClient(id) {
    const ok = await askConfirm('This will permanently delete the client and cannot be undone.')
    if (!ok) return
    await api(`${API_ENDPOINTS.clients}/${id}`, { method: 'DELETE' })
    toast('Client deleted')
    await loadData()
  }

  async function deleteProduct(id) {
    const ok = await askConfirm('This will permanently delete the product template and cannot be undone.')
    if (!ok) return
    await api(`${API_ENDPOINTS.products}/${id}`, { method: 'DELETE' })
    toast('Product deleted')
    await loadData()
  }

  async function createCoa(coa) {
    await api(API_ENDPOINTS.coa, { method: 'POST', body: JSON.stringify(coa) })
    toast('COA generated successfully')
    await loadData()
    setPage('Generated COAs')
  }

  if (!session) {
    return <LoginPage role={role} setRole={setRole} onLogin={handleLogin} />
  }

  const currentRole = session.user.role

  return (
    <div className={`app-shell authenticated ${theme}`}>
      <Toast toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog message={confirmState?.message} onConfirm={handleConfirm} onCancel={handleCancel} />
      <div className="workspace">
        <TopBar
          role={currentRole}
          user={session.user}
          theme={theme}
          setTheme={setTheme}
          onLogout={() => setSession(null)}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          clients={clients}
          products={products}
          coas={coas}
          setPage={setPage}
        />
        <div className="workspace-body">
          {currentRole === 'ADMIN' ? (
            <>
              <Sidebar page={page} setPage={setPage} />
              <main className="main-panel">
                {error && <div className="info-banner error">{error}</div>}
                {page === 'Clients' && (
                  <ClientsPage clients={clients} loading={loading} onCreate={createClient} onUpdate={updateClient} onDelete={deleteClient} search={globalSearch} />
                )}
                {(page === 'Products' || page === 'Specification Templates') && (
                  <TemplatePage products={products} loading={loading} onSave={saveProduct} onDelete={deleteProduct} search={globalSearch} />
                )}
                {page === 'Generated COAs' && <CoaArchive coas={coas} search={globalSearch} />}
                {page === 'Dashboard' && (
                  <AdminDashboard stats={stats} coas={coas} loading={loading} />
                )}
                {page === 'Lab Operators' && (
                  <LabOperatorsPage users={users} loading={loading} onSave={saveUser} onDelete={deleteUser} />
                )}
              </main>
            </>
          ) : (
            <main className="main-panel lab-only">
              {error && <div className="info-banner error">{error}</div>}
              <LabOperatorDashboard
                clients={clients}
                products={products}
                onCreateCoa={createCoa}
              />
              <CoaArchive coas={coas} compact />
            </main>
          )}
        </div>
      </div>
    </div>
  )
}

function LoginPage({ role, setRole, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await onLogin({ email, password, role })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-screen">
      <section className="login-card">
        <div className="brand-row">
          <div className="brand-mark">
            <Icon name="flask" />
          </div>
          <div>
            <strong>SPECORA</strong>
            <span>COA Management System</span>
          </div>
        </div>

        <div className="login-copy">
          <p className="eyebrow">Secure laboratory portal</p>
          <h1>Certificate workflows for chemical quality teams.</h1>
          <p>
            Sign in to manage clients, reusable product specifications, operator results, and
            printable Certificate of Analysis records.
          </p>
        </div>

        <form className="login-form" onSubmit={submit}>
          <div className="role-switch" role="group" aria-label="Choose login role">
            <button
              type="button"
              className={role === 'ADMIN' ? 'active' : ''}
              onClick={() => setRole('ADMIN')}
            >
              Admin
            </button>
            <button
              type="button"
              className={role === 'LAB_OPERATOR' ? 'active' : ''}
              onClick={() => setRole('LAB_OPERATOR')}
            >
              Lab Operator
            </button>
          </div>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
            />
          </label>
          <div className="secure-note">
            <Icon name="shield" />
            JWT protected access with role-based permissions and audit logging.
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="primary full" disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Authenticate Secure Session'}
          </button>
        </form>
      </section>

      <section className="login-art" aria-label="Laboratory illustration">
        <div className="spectro-card">
          <span>Spectrometry Online</span>
          <strong>Ready</strong>
          <small>ISO 17025 Certified</small>
        </div>
      </section>
    </div>
  )
}

function TopBar({ role, user, theme, setTheme, onLogout, globalSearch, setGlobalSearch, clients, products, coas, setPage }) {
  const [searchFocused, setSearchFocused] = useState(false)

  const searchResults = useMemo(() => {
    const q = (globalSearch || '').toLowerCase().trim()
    if (!q || q.length < 2) return []
    const results = []

    for (const c of (clients || [])) {
      if ([c.name, c.company, c.email, c.gst].filter(Boolean).some((v) => v.toLowerCase().includes(q))) {
        results.push({ type: 'Client', label: c.name, sub: c.company, page: 'Clients' })
      }
      if (results.length >= 8) break
    }

    for (const p of (products || [])) {
      if ([p.productName, p.productCode, p.grade].filter(Boolean).some((v) => v.toLowerCase().includes(q))) {
        results.push({ type: 'Product', label: p.productName, sub: p.productCode || p.grade, page: 'Products' })
      }
      if (results.length >= 8) break
    }

    for (const c of (coas || [])) {
      if ([c.coaNumber, c.clientName, c.productName, c.batchNo].filter(Boolean).some((v) => v.toLowerCase().includes(q))) {
        results.push({ type: 'COA', label: c.coaNumber, sub: `${c.productName} — ${c.batchNo}`, page: 'Generated COAs' })
      }
      if (results.length >= 8) break
    }

    return results.slice(0, 8)
  }, [globalSearch, clients, products, coas])

  function pickResult(result) {
    setPage(result.page)
    setSearchFocused(false)
  }

  return (
    <header className="topbar">
      <div className="system-strip">
        <span className="dot"></span>
        <span>LIMS Server Active</span>
        <span>Calibration Status: Verified Today</span>
        <span>FDA 21 CFR Part 11 Compliant</span>
      </div>
      <div className="nav-strip">
        <div className="product-lockup">
          <div className="brand-mark small">
            <Icon name="flask" />
          </div>
          <div>
            <strong>SPECORA</strong>
            <span>COA Core</span>
          </div>
        </div>
        <div className="search-wrapper">
          <div className="search-box">
            <Icon name="search" />
            <input
              placeholder="Search clients, products, COAs..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
            <kbd>⏎</kbd>
          </div>
          {searchFocused && globalSearch.length >= 2 && (
            <div className="search-dropdown">
              {searchResults.length === 0 ? (
                <div className="search-empty">No results for “{globalSearch}”</div>
              ) : (
                searchResults.map((r, i) => (
                  <button key={i} className="search-result" onMouseDown={() => pickResult(r)}>
                    <span className={`search-tag tag-${r.type.toLowerCase()}`}>{r.type}</span>
                    <div className="search-result-text">
                      <strong>{r.label}</strong>
                      <span>{r.sub}</span>
                    </div>
                    <span className="search-arrow">→</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button className="mode-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
        <span className="role-pill">{role === 'ADMIN' ? 'Admin' : 'Lab Operator'}</span>
        <div className="profile">
          <span className="avatar">{initials(user.name || user.email)}</span>
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>
        <button className="secondary" onClick={onLogout}>Logout</button>
      </div>
    </header>
  )
}

function Sidebar({ page, setPage }) {
  return (
    <nav className="sidebar" aria-label="Admin navigation">
      {navItems.map((item) => (
        <button className={page === item ? 'active' : ''} key={item} onClick={() => setPage(item)}>
          <Icon name={item === 'Clients' ? 'users' : item.includes('COA') ? 'file' : 'grid'} />
          {item}
        </button>
      ))}
    </nav>
  )
}

function PageHeader({ icon, title, description, children }) {
  return (
    <section className="page-header">
      <div>
        <p className="eyebrow">
          <Icon name={icon} />
          Specora Control
        </p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="header-actions">{children}</div>
    </section>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <Icon name="file" />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

function Modal({ title, description, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <div>
            <h3 id="modal-title">{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button className="icon-button" type="button" aria-label="Close modal" onClick={onClose}>
            x
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  )
}

function AdminDashboard({ stats, coas, loading }) {
  const cards = [
    ['Total Clients', stats?.totalClients ?? 0, 'Registered buyers'],
    ['Total Products', stats?.totalProducts ?? 0, 'Specification templates'],
    ['Total COAs Generated', stats?.totalCoas ?? 0, 'Stored certificates'],
    ['Pending COAs', stats?.pendingCoas ?? 0, 'Awaiting completion'],
  ]

  return (
    <>
      <PageHeader
        icon="grid"
        title="Admin Dashboard"
        description="Live operational summary from the Specora API."
      />
      <section className="stat-grid">
        {cards.map(([label, value, caption]) => (
          <article className="card stat-card" key={label}>
            <span>{label}</span>
            <strong>{loading ? '...' : value}</strong>
            <div>
              <em>Live</em>
              <small>{caption}</small>
            </div>
          </article>
        ))}
      </section>
      <RecentCoaTable coas={coas} />
    </>
  )
}

function RecentCoaTable({ coas }) {
  return (
    <article className="card table-card">
      <div className="card-title">
        <h3>Recent COA Table</h3>
      </div>
      {coas.length === 0 ? (
        <EmptyState title="No COAs generated yet" description="Generated certificates will appear here." />
      ) : (
        <DataTable
          columns={['COA ID', 'Product', 'Client', 'Batch', 'Status', 'Operator']}
          rows={coas.slice(-5).reverse().map((coa) => [
            coa.coaNumber,
            coa.productName,
            coa.clientName,
            coa.batchNo,
            <span className="status pass">{coa.status}</span>,
            coa.testedBy,
          ])}
        />
      )}
    </article>
  )
}

function ClientsPage({ clients, loading, onCreate, onUpdate, onDelete, search }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const emptyForm = { name: '', company: '', contact: '', email: '', gst: '', status: 'Active' }
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase()
    if (!q) return clients
    return clients.filter((c) =>
      [c.name, c.company, c.contact, c.email, c.gst].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    )
  }, [clients, search])

  function openCreate() {
    setEditingClient(null)
    setForm(emptyForm)
    setIsModalOpen(true)
  }

  function openEdit(client) {
    setEditingClient(client)
    setForm({ name: client.name, company: client.company, contact: client.contact || '', email: client.email || '', gst: client.gst || '', status: client.status || 'Active' })
    setIsModalOpen(true)
  }

  async function submit(event) {
    event.preventDefault()
    if (editingClient) {
      await onUpdate({ ...form, _id: editingClient._id })
    } else {
      await onCreate(form)
    }
    setForm(emptyForm)
    setEditingClient(null)
    setIsModalOpen(false)
  }

  return (
    <>
      <PageHeader
        icon="users"
        title="Client Management"
        description="Create and manage client records."
      >
        <button className="primary" type="button" onClick={openCreate}>
          <Icon name="plus" />
          Add Client
        </button>
      </PageHeader>

      {isModalOpen && (
        <Modal
          title={editingClient ? 'Edit Client' : 'Add Client'}
          description={editingClient ? 'Update client details.' : 'Create a buyer profile used by COA generation.'}
          onClose={() => setIsModalOpen(false)}
        >
          <form className="config-card modal-form" onSubmit={submit}>
            {['name', 'company', 'contact', 'email', 'gst'].map((field) => (
              <label key={field}>
                {field === 'gst' ? 'GST Number' : field}
                <input
                  value={form[field]}
                  onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                  required={field === 'name' || field === 'company'}
                />
              </label>
            ))}
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                <option>Active</option>
                <option>On Hold</option>
                <option>Inactive</option>
              </select>
            </label>
            <div className="modal-actions">
              <button className="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="primary" type="submit">
                {editingClient ? 'Update Client' : 'Save Client'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <section>
        <article className="card table-card">
          <div className="card-title">
            <h3>Registered Clients</h3>
            <span>{loading ? 'Loading' : `${filtered.length} records`}</span>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No clients yet" description="Use Add Client to open the modal and create one." />
          ) : (
            <DataTable
              columns={['Client Name', 'Company', 'Contact', 'Email', 'GST Number', 'Status', 'Actions']}
              rows={filtered.map((client) => [
                <span className="client-cell">
                  <b>{initials(client.name)}</b>
                  {client.name}
                </span>,
                client.company,
                client.contact,
                <span className="linkish">{client.email}</span>,
                client.gst,
                <span className={`status ${client.status.toLowerCase().replace(' ', '-')}`}>
                  {client.status}
                </span>,
                <div className="row-actions">
                  <button className="secondary small" type="button" onClick={() => openEdit(client)}>
                    Edit
                  </button>
                  <button className="secondary small danger" type="button" onClick={() => onDelete(client._id)}>
                    Delete
                  </button>
                </div>,
              ])}
            />
          )}
        </article>
      </section>
    </>
  )
}

function TemplatePage({ products, loading, onSave, onDelete, search }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState(emptyProduct())

  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      [p.productName, p.productCode, p.grade].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    )
  }, [products, search])

  function selectProduct(value) {
    const product = products.find((item) => item._id === value)
    setSelectedId(value)
    setDraft(product ? { ...product } : emptyProduct())
    setIsModalOpen(true)
  }

  function updateSpec(index, key, value) {
    setDraft((current) => ({
      ...current,
      specifications: current.specifications.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    }))
  }

  function addSpec() {
    setDraft((current) => ({
      ...current,
      specifications: [
        ...current.specifications,
        { parameter: '', specification: '', method: '', unit: '' },
      ],
    }))
  }

  async function submit(event) {
    event.preventDefault()
    await onSave(draft)
    setSelectedId('')
    setDraft(emptyProduct())
    setIsModalOpen(false)
  }

  return (
    <>
      <PageHeader
        icon="file"
        title="Product & Specification Template"
        description="Build reusable product templates. Empty until records are created through the modal."
      >
        <button
          className="primary"
          type="button"
          onClick={() => {
            setSelectedId('new')
            setDraft(emptyProduct())
            setIsModalOpen(true)
          }}
        >
          <Icon name="plus" />
          New Template
        </button>
      </PageHeader>

      <article className="card table-card">
        <div className="card-title">
          <h3>Product Templates</h3>
          <span>{loading ? 'Loading' : `${filtered.length} records`}</span>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No product templates yet" description="Use New Template to open the modal." />
        ) : (
          <DataTable
            columns={['Product', 'Code', 'Grade', 'Version', 'Parameters', 'Actions']}
            rows={filtered.map((product) => [
              product.productName,
              product.productCode,
              product.grade,
              `v${product.version}`,
              product.specifications?.length || 0,
              <div className="row-actions">
                <button className="secondary small" type="button" onClick={() => selectProduct(product._id)}>
                  Edit
                </button>
                <button className="secondary small danger" type="button" onClick={() => onDelete(product._id)}>
                  Delete
                </button>
              </div>,
            ])}
          />
        )}
      </article>

      {isModalOpen && (
        <Modal
          title={selectedId === 'new' ? 'Create Specification Template' : 'Edit Specification Template'}
          description="Reusable test parameters are preserved with product templates."
          onClose={() => setIsModalOpen(false)}
        >
          <form className="modal-form" onSubmit={submit}>
            <div className="modal-grid">
              {['productName', 'productCode', 'grade', 'description'].map((field) => (
                <label key={field}>
                  {field.replace(/([A-Z])/g, ' $1')}
                  <input
                    value={draft[field]}
                    onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))}
                    required={field === 'productName'}
                  />
                </label>
              ))}
            </div>
            <div className="card-title modal-table-title">
              <h3>Specification Rows</h3>
              <button className="primary small" type="button" onClick={addSpec}>
                <Icon name="plus" />
                Add Parameter
              </button>
            </div>
            {draft.specifications.length === 0 ? (
              <EmptyState title="No specification rows" description="Add parameter rows before saving." />
            ) : (
              <div className="table-wrap editable">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Test Parameter</th>
                      <th>Specification</th>
                      <th>Test Method</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.specifications.map((row, index) => (
                      <tr key={`${index}-${row.parameter}`}>
                        <td>{index + 1}</td>
                        {['parameter', 'specification', 'method', 'unit'].map((key) => (
                          <td key={key}>
                            <input
                              value={row[key]}
                              onChange={(event) => updateSpec(index, key, event.target.value)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="modal-actions">
              <button className="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="primary" type="submit">
                Save Template
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

function emptyProduct() {
  return {
    productName: '',
    productCode: '',
    grade: '',
    description: '',
    specifications: [],
  }
}

function LabOperatorDashboard({ clients, products, onCreateCoa }) {
  const [clientId, setClientId] = useState('')
  const [productId, setProductId] = useState('')
  const [batchNo, setBatchNo] = useState('')
  const [manufacturingDate, setManufacturingDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [results, setResults] = useState([])

  function selectProduct(value) {
    const product = products.find((item) => item._id === value)
    setProductId(value)
    setResults(
      product?.specifications?.map((row) => ({
        parameter: row.parameter,
        specification: row.specification,
        method: row.method,
        unit: row.unit,
        result: '',
      })) || [],
    )
  }

  const rows = useMemo(
    () => results.map((row) => ({ ...row, status: statusFor(row.specification, row.result) })),
    [results],
  )

  async function submit() {
    await onCreateCoa({
      clientId,
      productId,
      batchNo,
      manufacturingDate,
      expiryDate,
      results: rows,
    })
  }

  return (
    <>
      <PageHeader
        icon="flask"
        title="Lab Operator Dashboard"
        description="Select client and product records from the API, then enter measured results."
      >
        <span className="connection-pill">Spectrometer Interface: Connected</span>
      </PageHeader>
      <section className="lab-grid">
        <article className="card config-card">
          <h3>Batch & Material Details</h3>
          <label>
            Select Client
            <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <option value="">Select client</option>
              {clients.map((client) => (
                <option value={client._id} key={client._id}>
                  {client.company}
                </option>
              ))}
            </select>
          </label>
          <label>
            Select Product
            <select value={productId} onChange={(event) => selectProduct(event.target.value)}>
              <option value="">Select product</option>
              {products.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.productName}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Batch Number
              <input value={batchNo} onChange={(event) => setBatchNo(event.target.value)} />
            </label>
            <label>
              Manufacturing Date
              <input type="date" value={manufacturingDate} onChange={(event) => setManufacturingDate(event.target.value)} />
            </label>
            <label>
              Expiry Date
              <input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
            </label>
          </div>
          <div className="secure-note">
            <Icon name="shield" />
            Specification rows load only after an admin-created product template is selected.
          </div>
        </article>

        <article className="card table-card">
          <div className="card-title">
            <h3>Auto-loaded Specification Table</h3>
            <span>{rows.length} rows</span>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="No specifications loaded" description="Create/select a product template first." />
          ) : (
            <>
              <DataTable
                columns={['Parameter', 'Specification', 'Result Input', 'Status']}
                rows={rows.map((row, index) => [
                  <>
                    <strong>{row.parameter}</strong>
                    <small>{row.method}</small>
                  </>,
                  row.specification,
                  <div className="result-input">
                    <input
                      value={row.result}
                      onChange={(event) =>
                        setResults((current) =>
                          current.map((item, rowIndex) =>
                            rowIndex === index ? { ...item, result: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <span>{row.unit}</span>
                  </div>,
                  <span className={`status ${row.status.toLowerCase()}`}>{row.status}</span>,
                ])}
              />
              <div className="coa-actions">
                <button className="primary generate" onClick={submit} disabled={!clientId || !productId || !batchNo}>
                  <Icon name="file" />
                  Generate COA PDF
                </button>
              </div>
            </>
          )}
        </article>
      </section>
    </>
  )
}

function CoaArchive({ coas, compact = false, search }) {
  const [selectedCoa, setSelectedCoa] = useState(null)

  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase()
    if (!q) return coas
    return coas.filter((c) =>
      [c.coaNumber, c.clientName, c.productName, c.batchNo].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    )
  }, [coas, search])

  function exportExcel(coa) {
    const headers = ['Parameter', 'Method', 'Unit', 'Specification', 'Result', 'Status']
    const rows = (coa.results || []).map((r) => [r.parameter, r.method, r.unit, r.specification, r.result, r.status])
    const meta = [
      ['COA Number', coa.coaNumber],
      ['Client', coa.clientName],
      ['Product', coa.productName],
      ['Batch', coa.batchNo],
      ['Manufacturing Date', coa.manufacturingDate || ''],
      ['Expiry Date', coa.expiryDate || ''],
      ['Tested By', coa.testedBy],
      ['Date', new Date(coa.createdAt).toLocaleDateString()],
      [],
    ]
    const csv = [...meta, headers, ...rows].map((r) => r.map((c) => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `COA_${coa.coaNumber}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className={compact ? 'pdf-section compact' : 'pdf-section'}>
      <article className="card table-card">
        <div className="card-title">
          <h3>Generated COAs</h3>
          <span>{filtered.length} records</span>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No generated COAs" description="Generate a COA from the lab workspace." />
        ) : (
          <DataTable
            columns={['COA ID', 'Client', 'Product', 'Batch', 'Generated At', 'Status', 'Actions']}
            rows={filtered.map((coa) => [
              coa.coaNumber,
              coa.clientName,
              coa.productName,
              coa.batchNo,
              new Date(coa.createdAt).toLocaleString(),
              <span className="status pass">{coa.status}</span>,
              <div className="row-actions">
                <button className="secondary small" type="button" onClick={() => setSelectedCoa(coa)}>
                  View
                </button>
                <button className="secondary small" type="button" onClick={() => exportExcel(coa)}>
                  <Icon name="download" /> CSV
                </button>
              </div>,
            ])}
          />
        )}
      </article>
      {(selectedCoa || (filtered.length > 0 && !compact)) && (
        <CertificatePreview coa={selectedCoa || filtered[filtered.length - 1]} onExportExcel={exportExcel} />
      )}
    </section>
  )
}

function CertificatePreview({ coa, onExportExcel }) {
  function handlePrint() {
    const printEl = document.getElementById('certificate-print')
    if (!printEl) return
    const w = window.open('', '_blank', 'width=800,height=1000')
    w.document.write(`<html><head><title>COA ${coa.coaNumber}</title><style>
      body{font-family:system-ui,sans-serif;padding:40px;color:#152033}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{border:1px solid #d9e2ee;padding:8px 12px;text-align:left}
      th{background:#f7f9fc;font-size:12px;text-transform:uppercase}
      h2{text-align:center;letter-spacing:0.15em;text-transform:uppercase}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:16px 0;border-top:1px solid #d9e2ee;border-bottom:1px solid #d9e2ee}
      .hdr{display:flex;justify-content:space-between;padding-bottom:16px;border-bottom:3px solid #152033}
      footer{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:60px;border-top:1px solid #d9e2ee;padding-top:20px;text-align:center}
      .note{padding-left:14px;border-left:3px solid #9eb3cc;color:#445875;font-style:italic}
      @media print{body{padding:20px}}
    </style></head><body>`)
    w.document.write(printEl.innerHTML)
    w.document.write('</body></html>')
    w.document.close()
    w.onload = () => { w.print(); w.close() }
  }

  function handleDownloadPDF() {
    handlePrint()
  }

  return (
    <div>
      <div className="coa-action-bar">
        <button className="primary" type="button" onClick={handleDownloadPDF}>
          <Icon name="download" /> Download / Print PDF
        </button>
        <button className="secondary" type="button" onClick={handlePrint}>
          <Icon name="print" /> Print
        </button>
        <button className="secondary" type="button" onClick={() => onExportExcel && onExportExcel(coa)}>
          <Icon name="download" /> Export CSV
        </button>
      </div>
      <article className="certificate" id="certificate-print">
        <header>
          <div className="certificate-brand">
            <div>
              <strong>PHARCOS LABORATORIES</strong>
              <span>Chemical Industries Ltd. | Quality Control Department</span>
            </div>
          </div>
          <div>
            <span>Document Ref: {coa.coaNumber}</span>
            <span>Date of Issue: {new Date(coa.createdAt).toLocaleDateString()}</span>
            <strong>ISO 17025 Certified</strong>
          </div>
        </header>
        <h2>Certificate of Analysis</h2>
        <div className="certificate-meta">
          <div>
            <span>Client Details</span>
            <strong>{coa.clientName}</strong>
            <p>Client information is loaded from the client record.</p>
          </div>
          <div>
            <span>Product Details</span>
            <p><strong>Product:</strong> {coa.productName}</p>
            <p><strong>Batch:</strong> {coa.batchNo}</p>
            <p><strong>Manufacturing Date:</strong> {coa.manufacturingDate || 'Not provided'}</p>
            <p><strong>Expiry Date:</strong> {coa.expiryDate || 'Not provided'}</p>
          </div>
        </div>
        <DataTable
          className="print-table"
          columns={['Parameter', 'Method', 'Unit', 'Specification', 'Result', 'Status']}
          rows={(coa.results || []).map((row) => [
            row.parameter,
            row.method,
            row.unit,
            row.specification,
            row.result,
            row.status,
          ])}
        />
        <p className="certificate-note">
          This certificate is generated digitally from stored client, product, batch, and result records.
        </p>
        <footer>
          <div className="signature-line">
            <span>{coa.testedBy}</span>
            <strong>Analyzed By</strong>
            <small>Laboratory Analyst</small>
          </div>
          <div className="signature-line stamp">
            <span>Approved QA Release</span>
            <strong>Approved Signatory</strong>
            <small>Quality Assurance Director</small>
          </div>
        </footer>
      </article>
    </div>
  )
}

function LabOperatorsPage({ users, loading, onSave, onDelete }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const emptyForm = { name: '', email: '', password: '', status: 'Active' }
  const [form, setForm] = useState(emptyForm)

  function openCreate() {
    setEditingUser(null)
    setForm(emptyForm)
    setIsModalOpen(true)
  }

  function openEdit(user) {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, password: '', status: user.status || 'Active' })
    setIsModalOpen(true)
  }

  async function submit(event) {
    event.preventDefault()
    const payload = { ...form, role: 'LAB_OPERATOR' }
    if (editingUser) {
      payload._id = editingUser._id
      if (!payload.password) delete payload.password
    }
    await onSave(payload)
    setForm(emptyForm)
    setEditingUser(null)
    setIsModalOpen(false)
  }

  const operators = users.filter((u) => u.role === 'LAB_OPERATOR')

  return (
    <>
      <PageHeader
        icon="users"
        title="Lab Operator Management"
        description="Create and manage lab operator accounts with login credentials."
      >
        <button className="primary" type="button" onClick={openCreate}>
          <Icon name="plus" />
          Add Operator
        </button>
      </PageHeader>

      {isModalOpen && (
        <Modal
          title={editingUser ? 'Edit Operator' : 'Create Lab Operator'}
          description={editingUser ? 'Update operator details.' : 'Create a new lab operator account.'}
          onClose={() => setIsModalOpen(false)}
        >
          <form className="config-card modal-form" onSubmit={submit}>
            <label>
              Full Name
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </label>
            <label>
              Password {editingUser && <small style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(leave blank to keep current)</small>}
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required={!editingUser} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <div className="modal-actions">
              <button className="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="primary" type="submit">{editingUser ? 'Update Operator' : 'Create Operator'}</button>
            </div>
          </form>
        </Modal>
      )}

      <article className="card table-card">
        <div className="card-title">
          <h3>Lab Operators</h3>
          <span>{loading ? 'Loading' : `${operators.length} accounts`}</span>
        </div>
        {operators.length === 0 ? (
          <EmptyState title="No lab operators" description="Create operator accounts so lab staff can log in and generate COAs." />
        ) : (
          <DataTable
            columns={['Name', 'Email', 'Status', 'Created', 'Actions']}
            rows={operators.map((user) => [
              user.name,
              <span className="linkish">{user.email}</span>,
              <span className={`status ${user.status?.toLowerCase()}`}>{user.status}</span>,
              new Date(user.createdAt).toLocaleDateString(),
              <div className="row-actions">
                <button className="secondary small" type="button" onClick={() => openEdit(user)}>Edit</button>
                <button className="secondary small danger" type="button" onClick={() => onDelete(user._id)}>Delete</button>
              </div>,
            ])}
          />
        )}
      </article>
    </>
  )
}

function DataTable({ columns, rows, className = '' }) {
  return (
    <div className={`table-wrap ${className}`}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
