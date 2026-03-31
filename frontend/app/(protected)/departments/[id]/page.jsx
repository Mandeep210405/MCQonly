'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

const DEPT_COLORS = ['#1a3aff', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#7c5cfc', '#f97316', '#3b82f6']

export default function DepartmentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [dept, setDept] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

    // Fetch all departments and find the one matching this id
    fetch('/api/departments')
      .then(r => r.json())
      .then(json => {
        const departments = json?.data?.departments ?? []
        const found = departments.find(d => d.id === id)
        if (!found) {
          setError('Department not found')
        } else {
          setDept(found)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ padding: '40px 0' }}>
        <div className="skeleton" style={{ height: '32px', width: '200px', marginBottom: '32px', borderRadius: '10px' }} />
        <div className="skeleton card" style={{ height: '180px', marginBottom: '18px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton card" style={{ height: '140px' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !dept) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
          {error || 'Department not found'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
          The department you are looking for does not exist or you don't have access.
        </p>
        <Link href="/departments" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
          ← Back to Departments
        </Link>
      </div>
    )
  }

  const color = DEPT_COLORS[Math.abs(dept.name?.charCodeAt(0) ?? 0) % DEPT_COLORS.length]
  const internCount = dept.interns_aggregate?.aggregate?.count ?? 0
  const headName = dept.user?.name ?? null
  const headEmail = dept.user?.email ?? null
  const headRole = dept.user?.role ?? null

  return (
    <div>
      {/* Back link */}
      <Link
        href="/departments"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          marginBottom: '28px',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        ← Back to Departments
      </Link>

      {/* Header card */}
      <div
        className="card"
        style={{
          padding: '32px',
          marginBottom: '24px',
          borderTop: `4px solid ${color}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: `${color}18`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '26px', flexShrink: 0,
            }}>
              🏢
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '700', marginBottom: '4px' }}>
                {dept.name}
              </h1>
              {dept.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                  {dept.description}
                </p>
              )}
            </div>
          </div>

          {/* Intern count badge */}
          <div style={{
            background: `${color}12`,
            border: `1px solid ${color}30`,
            borderRadius: '14px',
            padding: '12px 24px',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '800', color }}>
              {internCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Intern{internCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '28px' }}>

        {/* Head mentor card */}
        <div className="card" style={{ padding: '24px' }}>
          <p style={{
            fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.06em', fontWeight: '600', marginBottom: '14px',
          }}>
            Head Mentor
          </p>
          {headName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '18px', fontWeight: '700',
                color: '#fff', flexShrink: 0,
              }}>
                {headName[0]}
              </div>
              <div>
                <p style={{ fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>{headName}</p>
                {headEmail && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{headEmail}</p>
                )}
                {headRole && (
                  <span style={{
                    display: 'inline-block', marginTop: '6px',
                    fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
                    letterSpacing: '0.05em', padding: '2px 8px', borderRadius: '20px',
                    background: `${color}15`, color,
                  }}>
                    {headRole}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '14px' }}>
              No head mentor assigned
            </p>
          )}
        </div>

        {/* Department info card */}
        <div className="card" style={{ padding: '24px' }}>
          <p style={{
            fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.06em', fontWeight: '600', marginBottom: '14px',
          }}>
            Department Info
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Department ID</span>
              <span style={{
                fontSize: '11px', fontFamily: 'monospace', background: 'var(--bg-input)',
                padding: '2px 8px', borderRadius: '6px', color: 'var(--text-secondary)',
                maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {dept.id}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Interns</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color }}>{internCount}</span>
            </div>
            {dept.created_at && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Created</span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {new Date(dept.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <Link
          href="/departments"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-primary)', textDecoration: 'none', transition: 'all 0.15s',
          }}
        >
          View All Departments
        </Link>
      </div>
    </div>
  )
}
