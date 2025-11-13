import { useEffect, useRef, useState } from 'react'

const apiBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function LiveRuns() {
  const [tenantId, setTenantId] = useState('demo-tenant')
  const [runs, setRuns] = useState([])
  const [events, setEvents] = useState({})
  const wsRef = useRef(null)

  const fetchRuns = async () => {
    try {
      const res = await fetch(`${apiBase}/api/runs?tenant_id=${tenantId}`)
      const data = await res.json()
      setRuns(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchRuns()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    const wsUrl = (apiBase || '').replace('http', 'ws') + `/ws/${tenantId}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data)
      if (msg.type === 'run_event') {
        setEvents(prev => {
          const arr = prev[msg.run_id] ? [...prev[msg.run_id]] : []
          arr.push(msg)
          return { ...prev, [msg.run_id]: arr }
        })
        // refresh runs list on key status events
        if (['RUN_ENQUEUED','RUN_FINISHED','RUN_ERROR','SURVEY_COMPLETED'].includes(msg.code)) {
          fetchRuns()
        }
      }
    }

    ws.onopen = () => {
      // keep alive pings
      const t = setInterval(() => {
        try { ws.send('ping') } catch {}
      }, 15000)
      ws._t = t
    }

    ws.onclose = () => {
      if (ws._t) clearInterval(ws._t)
    }

    return () => {
      if (wsRef.current) {
        try { wsRef.current.close() } catch {}
        wsRef.current = null
      }
    }
  }, [tenantId])

  return (
    <div className="max-w-6xl mx-auto px-4 mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Live Runs</h2>
          <p className="text-gray-600 text-sm">Real-time events streamed as runs execute.</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={tenantId} onChange={(e)=>setTenantId(e.target.value)} placeholder="tenant id" className="border rounded px-2 py-1 text-sm"/>
          <button onClick={fetchRuns} className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm">Refresh</button>
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border bg-white/70 backdrop-blur">
          <h3 className="font-medium mb-2">Recent Runs</h3>
          <div className="divide-y">
            {runs.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">No runs yet.</div>
            )}
            {runs.map(r => (
              <div key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{r.site} · {r.account_id?.slice?.(0,6)}… · status: {r.status}</div>
                  <div className="text-xs text-gray-500">payout: ${r.payout_total?.toFixed?.(2) || '0.00'} · rev/hr: ${r.revenue_hour?.toFixed?.(2) || '0.00'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-white/70 backdrop-blur">
          <h3 className="font-medium mb-2">Live Events</h3>
          <div className="space-y-3 max-h-[360px] overflow-auto">
            {Object.keys(events).length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">No live events yet.</div>
            )}
            {Object.entries(events).map(([runId, evts]) => (
              <div key={runId} className="text-xs">
                <div className="font-semibold text-gray-700">Run {runId.slice(0,6)}…</div>
                <div className="mt-1 space-y-1">
                  {evts.map((m, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-white ${m.level==='error'?'bg-red-600': m.level==='warn'?'bg-amber-600':'bg-emerald-600'}`}>{m.level}</span>
                      <span className="text-gray-800">{m.code}</span>
                      {m.data && <span className="text-gray-500">{JSON.stringify(m.data)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
