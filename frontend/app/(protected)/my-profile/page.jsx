'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_META = {
  active:     { color: 'var(--status-active)',     bg: 'rgba(0,196,140,0.12)'   },
  completed:  { color: 'var(--status-completed)',  bg: 'rgba(26,58,255,0.12)'  },
  terminated: { color: 'var(--status-terminated)', bg: 'rgba(255,77,106,0.12)' },
}
const EXP_COLORS = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#1a3aff' }

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const m = STATUS_META[status] ?? { color: 'var(--text-muted)', bg: 'var(--bg-input)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      borderRadius: '99px', fontSize: '11px', fontWeight: '600',
      textTransform: 'uppercase', letterSpacing: '0.04em',
      background: m.bg, color: m.color,
    }}>
      {status}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MyProfilePage() {
  const { data: session } = useSession()
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/interns/my-profile')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setInterns(json.interns ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>
          My Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          {session?.user?.name} · {session?.user?.email}
        </p>
      </div>

      {/* Table */}
      <div className="card" style={{
        overflow: 'hidden',
        padding: 0,
        maxHeight: 'calc(100vh - 260px)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Intern', 'Department', 'Mentor', 'Position', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '13px 20px', textAlign: 'left', fontSize: '11px',
                    fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase',
                    letterSpacing: '0.06em', whiteSpace: 'nowrap',
                    background: 'var(--bg-card)', position: 'sticky', top: 0,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1, 2].map(i => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6].map(j => (
                      <td key={j} style={{ padding: '14px 20px' }}>
                        <div className="skeleton" style={{ height: '14px', width: j === 1 ? '140px' : '80px' }} />
                      </td>
                    ))}
                  </tr>
                ))
                : error
                  ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--status-terminated)', fontSize: '14px' }}>
                        {error}
                      </td>
                    </tr>
                  )
                  : interns.length === 0
                    ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                          No internship record found for your account.
                        </td>
                      </tr>
                    )
                    : interns.map((intern, idx) => (
                      <tr
                        key={intern.id}
                        style={{
                          borderBottom: idx < interns.length - 1 ? '1px solid var(--border)' : 'none',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Intern name + email */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '50%',
                              background: 'var(--accent)', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '13px', fontWeight: '700',
                              color: '#fff', flexShrink: 0,
                            }}>
                              {intern.userByUserId?.name?.[0] ?? '?'}
                            </div>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                {intern.userByUserId?.name}
                              </p>
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {intern.userByUserId?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {intern.department?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>

                        {/* Mentor */}
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {intern.user?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>

                        {/* Position + experience */}
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <p>{intern.position_title ?? '—'}</p>
                          {intern.experience_level && (
                            <span style={{
                              fontSize: '10px', fontWeight: '700',
                              color: EXP_COLORS[intern.experience_level],
                              textTransform: 'uppercase', letterSpacing: '0.04em',
                            }}>
                              {intern.experience_level}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 20px' }}>
                          <Badge status={intern.status} />
                        </td>

                        {/* View only — no Edit or Delete */}
                        <td style={{ padding: '14px 16px' }}>
                          <Link
                            href={`/interns/${intern.id}`}
                            className="btn-ghost"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}