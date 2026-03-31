'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react' // ← ADD THIS

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_META = {
  active:     { color: 'var(--status-active)',     bg: 'rgba(0,196,140,0.12)'   },
  completed:  { color: 'var(--status-completed)',  bg: 'rgba(26,58,255,0.12)'  },
  terminated: { color: 'var(--status-terminated)', bg: 'rgba(255,77,106,0.12)' },
}

const TASK_STATUS_COLORS = {
  todo:        'var(--status-todo)',
  in_progress: 'var(--status-progress)',
  in_review:   'var(--status-review)',
  done:        'var(--status-done)',
}
const ATT_COLORS      = { present: '#22c55e', absent: '#ef4444', half_day: '#f59e0b', wfh: '#3b82f6' }
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

// ─── Small components ─────────────────────────────────────────────────────────

function Badge({ status }) {
  const m = STATUS_META[status] ?? { color: 'var(--text-muted)', bg: 'var(--bg-input)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
      borderRadius: '99px', fontSize: '11px', fontWeight: '600',
      textTransform: 'uppercase', letterSpacing: '0.04em',
      background: m.bg, color: m.color,
    }}>
      {status}
    </span>
  )
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500', textAlign: 'right', maxWidth: '55%' }}>{value || '—'}</span>
    </div>
  )
}

function ScoreBar({ label, score }) {
  if (!score) return null
  const color = score >= 8 ? 'var(--status-active)' : score >= 5 ? 'var(--status-progress)' : 'var(--status-terminated)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '160px' }}>{label}</span>
      <div style={{ flex: 1, height: '6px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ width: `${score * 10}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', minWidth: '30px', textAlign: 'right' }}>{score}/10</span>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InternDetail() {
  const { id } = useParams()

  const { data: session } = useSession() // ← ADD THIS
  const isIntern = session?.user?.role === 'intern' // ← ADD THIS
  const backLink = isIntern ? '/my-profile' : '/interns' // ← ADD THIS

  const [intern, setIntern] = useState(null)
  const [departments, setDepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = (msg, ok = true) => { 
    setToast({ msg, ok }); 
    setTimeout(() => setToast(null), 3000) 
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [iRes, dRes] = await Promise.all([
        fetch(`/api/interns/${id}`).then(r => r.json()),
        fetch('/api/departments').then(r => r.json()),
      ])
      setIntern(iRes?.interns_by_pk ?? null)
      setDepts(dRes?.departments ?? [])
    } catch {
      showToast('Failed to load', false)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1,2,3].map(i => <div key={i} className="skeleton card" style={{ height: '120px' }} />)}
    </div>
  )

  if (!intern) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
      <p style={{ fontSize: '32px', marginBottom: '12px' }}>⚠</p>
      <p>Intern not found.</p>
      <Link href="/interns" className="btn-ghost" style={{ marginTop: '20px', display: 'inline-flex' }}>← Back</Link>
    </div>
  )

  // ── Derived values ────────────────────────────────────────────────────────
  const latestEval  = intern.evaluations?.[0]
  const tasksDone   = intern.tasks?.filter(t => t.status === 'done').length ?? 0
  const tasksTotal  = intern.tasks?.length ?? 0
  const attPresent  = intern.attendances?.filter(a => a.status === 'present' || a.status === 'wfh').length ?? 0
  const attTotal    = intern.attendances?.length ?? 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 300,
          padding: '12px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '500',
          background: toast.ok ? 'var(--status-active)' : 'var(--status-terminated)',
          color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', animation: 'fadeUp 0.25s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Back link */}
      {/* <Link href="/interns" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        ← Back to Interns
      </Link> */}
      {/* Back link - conditionally redirect with theme styling */}
      <Link 
        href={session?.user?.role === 'intern' ? '/my-profile' : '/interns'}
        className="back-link"
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '13px', 
          color: 'var(--accent)', 
          textDecoration: 'none',
          marginBottom: '24px',
          padding: '6px 12px',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          background: 'var(--bg-card-hover)',
        }}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to {session?.user?.role === 'intern' ? 'My Profile' : 'Interns'}
      </Link>

      {/* Hero card — name, status, quick stats */}
      <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
            {intern.userByUserId?.name?.[0] ?? '?'}
          </div>

          {/* Name + role + email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '700', marginBottom: '4px' }}>
              {intern.userByUserId?.name}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {intern.position_title ?? 'Intern'} · {intern.department?.name ?? 'No department'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {intern.userByUserId?.email}
            </p>
          </div>

          {/* Status badge */}
          <Badge status={intern.status} />
        </div>

        {/* Quick stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Tasks done',          value: `${tasksDone}/${tasksTotal}` },
            { label: 'Attendance (14 days)', value: `${attPresent}/${attTotal}` },
            { label: 'Latest eval score',   value: latestEval?.overall_score ? `${latestEval.overall_score}/10` : '—' },
            { label: 'Mentor',              value: intern.user?.name ?? 'Not assigned' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', color: 'var(--accent)' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column detail grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* ── LEFT column ── */}
        <div>
          <Section title="Profile details">
            <InfoRow label="College"      value={intern.college} />
            <InfoRow label="City"         value={intern.city} />
            <InfoRow label="CGPA"         value={intern.cgpa} />
            <InfoRow label="Experience"   value={intern.experience_level} />
            <InfoRow label="Department"   value={intern.department?.name} />
            <InfoRow label="Mentor"       value={intern.user?.name} />
            <InfoRow label="Start date"   value={intern.start_date ? new Date(intern.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null} />
            <InfoRow label="End date"     value={intern.end_date   ? new Date(intern.end_date).toLocaleDateString('en-IN',   { day: '2-digit', month: 'long', year: 'numeric' }) : null} />
            
            {intern.skills?.length > 0 && (
              <div style={{ paddingTop: '10px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Skills</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[...new Set(intern.skills)].map((s, index) => (
                    <span 
                      key={`skill-${s}-${index}`} 
                      style={{ 
                        padding: '3px 10px', borderRadius: '99px', fontSize: '12px', 
                        fontWeight: '500', background: 'var(--bg-blue-soft)', 
                        color: 'var(--accent)' 
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {intern.languages?.length > 0 && (
              <div style={{ paddingTop: '10px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Languages</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[...new Set(intern.languages)].map((l, index) => (
                    <span 
                      key={`language-${l}-${index}`} 
                      style={{ 
                        padding: '3px 10px', borderRadius: '99px', fontSize: '12px', 
                        fontWeight: '500', background: 'var(--bg-blue-soft)', 
                        color: 'var(--accent)' 
                      }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Latest evaluation detail */}
          {latestEval && (
            <Section title={`Latest evaluation${latestEval.period ? ` · ${latestEval.period}` : ''}`}>
              {latestEval.overall_score && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-blue-soft)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '700', color: 'var(--accent)' }}>{latestEval.overall_score}</span>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall score</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>by {latestEval.user?.name ?? '—'}</p>
                  </div>
                </div>
              )}
              <ScoreBar label="Technical skills"  score={latestEval.technical_skill_score} />
              <ScoreBar label="Problem solving"   score={latestEval.problem_solving_score} />
              <ScoreBar label="Communication"     score={latestEval.communication_score} />
              <ScoreBar label="Teamwork"          score={latestEval.teamwork_score} />
              <ScoreBar label="Initiative"        score={latestEval.initiative_score} />
              <ScoreBar label="Time management"   score={latestEval.time_management_score} />
              <ScoreBar label="Learning ability"  score={latestEval.learning_ability_score} />
              <ScoreBar label="Ownership"         score={latestEval.ownership_score} />
              {latestEval.strengths && (
                <div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', background: 'rgba(0,196,140,0.08)', border: '1px solid rgba(0,196,140,0.2)' }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--status-active)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Strengths</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{latestEval.strengths}</p>
                </div>
              )}
              {latestEval.improvement_areas && (
                <div style={{ marginTop: '10px', padding: '12px', borderRadius: '10px', background: 'rgba(255,184,48,0.08)', border: '1px solid rgba(255,184,48,0.2)' }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--status-progress)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Improvement areas</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{latestEval.improvement_areas}</p>
                </div>
              )}
            </Section>
          )}
        </div>

        {/* ── RIGHT column ── */}
        <div>
          <Section title={`Tasks (${tasksTotal})`}>
            {tasksTotal === 0
              ? <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No tasks assigned yet.</p>
              : intern.tasks.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: PRIORITY_COLORS[task.priority] }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</p>
                    {task.due_date && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Due {new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>}
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', background: `${TASK_STATUS_COLORS[task.status]}22`, color: TASK_STATUS_COLORS[task.status], flexShrink: 0 }}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            }
          </Section>

          <Section title={`Attendance (last ${intern.attendances?.length ?? 0} records)`}>
            {!intern.attendances?.length
              ? <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No records yet.</p>
              : (
                <>
                  {/* Mini summary pills */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {['present','absent','half_day','wfh'].map(s => {
                      const count = intern.attendances.filter(a => a.status === s).length
                      if (!count) return null
                      return (
                        <span key={s} style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600', background: `${ATT_COLORS[s]}22`, color: ATT_COLORS[s] }}>
                          {s.replace('_', ' ')} · {count}
                        </span>
                      )
                    })}
                  </div>
                  {intern.attendances.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {a.check_in && <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{a.check_in}–{a.check_out ?? '?'}</span>}
                        <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', background: `${ATT_COLORS[a.status]}22`, color: ATT_COLORS[a.status] }}>
                          {a.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )
            }
          </Section>

          {/* All evaluations list (if more than 1) */}
          {intern.evaluations?.length > 1 && (
            <Section title={`All evaluations (${intern.evaluations.length})`}>
              {intern.evaluations.map(ev => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{ev.period ?? 'Evaluation'}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      by {ev.user?.name ?? '—'} · {new Date(ev.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: 'var(--accent)' }}>
                    {ev.overall_score ?? ev.score ?? '—'}
                  </span>
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
