import { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'

const apiBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Accounts() {
  const [tenantId, setTenantId] = useState('demo-tenant')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/accounts?tenant_id=${tenantId}`)
      const data = await res.json()
      setAccounts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const [form, setForm] = useState({ site: 'FIVE_SURVEYS', username: '', credential_encrypted: '' })

  const createAccount = async () => {
    if (!form.username || !form.credential_encrypted) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, ...form })
      })
      if (res.ok) {
        setForm({ site: 'FIVE_SURVEYS', username: '', credential_encrypted: '' })
        await fetchAccounts()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const runNow = async (accountId) => {
    setLoading(true)
    try {
      await fetch(`${apiBase}/api/run-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, account_id: accountId })
      })
      alert('Run enqueued!')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Accounts</h2>
          <p className="text-gray-600 text-sm">Manage your site accounts and trigger runs.</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={tenantId} onChange={(e)=>setTenantId(e.target.value)} placeholder="tenant id" className="border rounded px-2 py-1 text-sm"/>
          <button onClick={fetchAccounts} className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm">Refresh</button>
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <div className="col-span-1 p-4 rounded-lg border bg-white/70 backdrop-blur">
          <h3 className="font-medium mb-2">New Account</h3>
          <div className="space-y-2">
            <select value={form.site} onChange={(e)=>setForm({...form, site: e.target.value})} className="w-full border rounded px-2 py-1 text-sm">
              <option>FIVE_SURVEYS</option>
            </select>
            <input value={form.username} onChange={(e)=>setForm({...form, username: e.target.value})} placeholder="username" className="w-full border rounded px-2 py-1 text-sm"/>
            <input value={form.credential_encrypted} onChange={(e)=>setForm({...form, credential_encrypted: e.target.value})} placeholder="encrypted credential" className="w-full border rounded px-2 py-1 text-sm"/>
            <button onClick={createAccount} disabled={loading} className="w-full px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50">Create</button>
          </div>
        </div>

        <div className="col-span-2 p-4 rounded-lg border bg-white/70 backdrop-blur">
          <h3 className="font-medium mb-2">Existing</h3>
          <div className="divide-y">
            {accounts.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">No accounts yet.</div>
            )}
            {accounts.map(acc => (
              <div key={acc.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{acc.site} · {acc.username}</div>
                  <div className="text-xs text-gray-500">status: {acc.status} · health: {acc.health_score?.toFixed?.(0) || 100}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>runNow(acc.id)} className="px-2.5 py-1.5 rounded bg-emerald-600 text-white text-xs">Run Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <header className="relative h-[420px]">
        <div className="absolute inset-0">
          <Spline scene="https://prod.spline.design/LU2mWMPbF3Qi1Qxh/scene.splinecode" style={{ width: '100%', height: '100%' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/30 to-white pointer-events-none" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 h-full flex items-end pb-10">
          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-sm">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">GhostForm v2</h1>
            <p className="text-gray-600 mt-2 max-w-2xl">A profit-optimized, risk-aware browser swarm that automates form-based workflows end-to-end across many accounts and sites.</p>
          </div>
        </div>
      </header>

      <main className="py-10">
        <Accounts />
      </main>

      <footer className="py-8 text-center text-xs text-gray-500">© {new Date().getFullYear()} GhostForm</footer>
    </div>
  )
}

export default App
