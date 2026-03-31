'use client'

import { useState, useEffect } from 'react'
import { gqlFetch } from '@/lib/graphql-client'

const GET_ATTENDANCE = `
  query GetAttendance {
    attendance(order_by: { date: desc }) {
      id date check_in check_out status notes
      intern { user { name } department { name } }
    }
  }
`

const STATUS_COLORS = {
  present:  { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  absent:   { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
  half_day: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  wfh:      { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
}

export default function AttendancePage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch]             = useState('')

  useEffect(() => {
    gqlFetch(GET_ATTENDANCE).then(setData).finally(() => setLoading(false))
  }, [])

  const records = data?.attendance ?? []
  const filtered = records.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    const matchSearch = r.intern?.user?.name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })
  const counts = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc }, {})

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>Attendance</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{records.length} total records</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
        {[
          { key: 'present',  label: 'Present'  },
          { key: 'absent',   label: 'Absent'   },
          { key: 'half_day', label: 'Half Day' },
          { key: 'wfh',      label: 'WFH'      },
        ].map(s => (
          <div key={s.key} className="card" style={{ padding: '16px 20px', borderLeft: `3px solid ${STATUS_COLORS[s.key]?.color}` }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700', color: STATUS_COLORS[s.key]?.color }}>
              {loading ? '—' : counts[s.key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input className="input" style={{ maxWidth: '240px' }} placeholder="Search intern..." value={search} onChange={e => setSearch(e.target.value)} />
        {['all', 'present', 'absent', 'half_day', 'wfh'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid', fontFamily: 'var(--font-body)',
            borderColor: filterStatus === s ? 'var(--accent)' : 'var(--border)',
            background: filterStatus === s ? 'rgba(99,102,241,0.12)' : 'transparent',
            color: filterStatus === s ? 'var(--accent-light)' : 'var(--text-secondary)',
          }}>
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Intern', 'Department', 'Date', 'Check In', 'Check Out', 'Status', 'Notes'].map(h => (
                <th key={h} style={{ padding: '13px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? [1,2,3,4,5].map(i => <tr key={i}>{[1,2,3,4,5,6,7].map(j => <td key={j} style={{ padding: '14px 20px' }}><div className="skeleton" style={{ height: '13px' }} /></td>)}</tr>)
              : filtered.length === 0
                ? <tr><td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No attendance records found.</td></tr>
                : filtered.map((r, idx) => (
                  <tr key={r.id}
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 20px', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{r.intern?.user?.name ?? '—'}</td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>{r.intern?.department?.name ?? '—'}</td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{r.check_in ?? '—'}</td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{r.check_out ?? '—'}</td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.03em', background: STATUS_COLORS[r.status]?.bg, color: STATUS_COLORS[r.status]?.color }}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>{r.notes ?? '—'}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}