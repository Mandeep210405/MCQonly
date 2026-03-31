'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const STATUS_COLORS = {
  present:  { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', label: 'Present' },
  absent:   { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', label: 'Absent'  },
  half_day: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Half Day' },
  wfh:      { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', label: 'WFH'     },
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] ?? { bg: '#f3f4f6', color: '#6b7280', label: status }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.04em',
      background: s.bg, color: s.color
    }}>
      {s.label}
    </span>
  )
}

/* ── Intern-only: personal attendance view ────────────────────── */
function InternAttendanceView({ records, loading }) {
  const counts = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc }, {})
  const [filterStatus, setFilterStatus] = useState('all')
  const filtered = records.filter(r => filterStatus === 'all' || r.status === filterStatus)

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>My Attendance</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{records.length} total records</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        {['present','absent','half_day','wfh'].map(key => (
          <div key={key} className="card" style={{ padding: '16px 20px', borderLeft: `3px solid ${STATUS_COLORS[key]?.color}` }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{STATUS_COLORS[key]?.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: STATUS_COLORS[key]?.color }}>{loading ? '—' : counts[key] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all','present','absent','half_day','wfh'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            border: '1px solid', fontFamily: 'var(--font-body)',
            borderColor: filterStatus === s ? 'var(--accent)' : 'var(--border)',
            background: filterStatus === s ? 'rgba(99,102,241,0.12)' : 'transparent',
            color: filterStatus === s ? 'var(--accent-light)' : 'var(--text-secondary)'
          }}>
            {s === 'all' ? 'All' : STATUS_COLORS[s]?.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Date','Check In','Check Out','Status','Notes'].map(h => (
                <th key={h} style={{ padding: '13px 20px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? [1,2,3,4,5].map(i => <tr key={i}>{[1,2,3,4,5].map(j => <td key={j} style={{ padding: '14px 20px' }}><div className="skeleton" style={{ height: 13 }} /></td>)}</tr>)
              : filtered.length === 0
                ? <tr><td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No records found.</td></tr>
                : filtered.map((r, idx) => (
                  <tr key={r.id}
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 20px', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{r.check_in ?? '—'}</td>
                    <td style={{ padding: '13px 20px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{r.check_out ?? '—'}</td>
                    <td style={{ padding: '13px 20px' }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: '13px 20px', fontSize: 12, color: 'var(--text-muted)' }}>{r.notes ?? '—'}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Admin / HR / Manager: per-intern grid view ───────────────── */
function InternCard({ internName, dept, records }) {
  const [expanded, setExpanded] = useState(false)
  const counts = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc }, {})
  const total = records.length
  const presentPct = total > 0 ? Math.round(((counts.present ?? 0) + (counts.wfh ?? 0) + (counts.half_day ?? 0) * 0.5) / total * 100) : 0
  const latest = records[0]

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Card header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg,#1a3aff,#4a6aff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0
        }}>
          {internName?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{internName}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{dept ?? '—'}</p>
        </div>
        {/* Attendance % pill */}
        <div style={{
          padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
          background: presentPct >= 75 ? 'rgba(34,197,94,0.12)' : presentPct >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
          color: presentPct >= 75 ? '#22c55e' : presentPct >= 50 ? '#f59e0b' : '#ef4444',
          flexShrink: 0
        }}>
          {presentPct}%
        </div>
      </div>

      {/* Mini status grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, borderBottom: '1px solid var(--border)' }}>
        {['present','absent','half_day','wfh'].map((key, i) => (
          <div key={key} style={{
            padding: '12px 8px', textAlign: 'center',
            borderRight: i < 3 ? '1px solid var(--border)' : 'none'
          }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: STATUS_COLORS[key]?.color, fontFamily: 'var(--font-display)' }}>{counts[key] ?? 0}</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{STATUS_COLORS[key]?.label}</p>
          </div>
        ))}
      </div>

      {/* Latest record */}
      {latest && (
        <div style={{ padding: '12px 20px', borderBottom: expanded ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Latest:</span>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            {new Date(latest.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </span>
          <StatusBadge status={latest.status} />
        </div>
      )}

      {/* Expand / collapse */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          padding: '10px 20px', fontSize: 12, color: 'var(--accent-light)',
          background: 'transparent', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontFamily: 'var(--font-body)', fontWeight: 500
        }}
      >
        {expanded ? '▲ Hide records' : `▼ View all ${total} records`}
      </button>

      {/* Expanded records table */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', maxHeight: 260, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover, #f9fafb)', position: 'sticky', top: 0 }}>
                {['Date','In','Out','Status'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 14px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td style={{ padding: '8px 14px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{r.check_in ?? '—'}</td>
                  <td style={{ padding: '8px 14px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{r.check_out ?? '—'}</td>
                  <td style={{ padding: '8px 14px' }}><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AdminAttendanceView({ records, loading }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  // Group records by intern
  const grouped = records.reduce((acc, r) => {
    const name = r.intern?.userByUserId?.name ?? 'Unknown'
    const dept = r.intern?.department?.name ?? '—'
    const key = name
    if (!acc[key]) acc[key] = { name, dept, records: [] }
    if (filterStatus === 'all' || r.status === filterStatus) {
      acc[key].records.push(r)
    }
    return acc
  }, {})

  const allGrouped = records.reduce((acc, r) => {
    const name = r.intern?.userByUserId?.name ?? 'Unknown'
    const dept = r.intern?.department?.name ?? '—'
    if (!acc[name]) acc[name] = { name, dept, records: [] }
    acc[name].records.push(r)
    return acc
  }, {})

  const internCards = Object.values(allGrouped).filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  // Filtered cards based on status (only show cards that have at least one matching record)
  const filteredCards = filterStatus === 'all'
    ? internCards
    : internCards.filter(g => g.records.some(r => r.status === filterStatus))

  const totalCounts = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc }, {})

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>Attendance</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          {Object.keys(allGrouped).length} interns · {records.length} total records
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        {['present','absent','half_day','wfh'].map(key => (
          <div key={key} className="card" style={{ padding: '16px 20px', borderLeft: `3px solid ${STATUS_COLORS[key]?.color}` }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{STATUS_COLORS[key]?.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: STATUS_COLORS[key]?.color }}>{loading ? '—' : totalCounts[key] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          style={{ maxWidth: 240 }}
          placeholder="Search intern..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {['all','present','absent','half_day','wfh'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            border: '1px solid', fontFamily: 'var(--font-body)',
            borderColor: filterStatus === s ? 'var(--accent)' : 'var(--border)',
            background: filterStatus === s ? 'rgba(99,102,241,0.12)' : 'transparent',
            color: filterStatus === s ? 'var(--accent-light)' : 'var(--text-secondary)'
          }}>
            {s === 'all' ? 'All' : STATUS_COLORS[s]?.label}
          </button>
        ))}
      </div>

      {/* Intern grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card skeleton" style={{ height: 200 }} />
          ))}
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No interns found.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filteredCards.map(g => (
            <InternCard
              key={g.name}
              internName={g.name}
              dept={g.dept}
              records={filterStatus === 'all' ? g.records : g.records.filter(r => r.status === filterStatus)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function AttendancePage() {
  const { data: session, status } = useSession()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    fetch('/api/attendance')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [status])

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '4px solid #1a3aff', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  const records = data?.attendance ?? []
  const role = session?.user?.role

  if (role === 'intern') {
    return <InternAttendanceView records={records} loading={loading} />
  }

  return <AdminAttendanceView records={records} loading={loading} />
}