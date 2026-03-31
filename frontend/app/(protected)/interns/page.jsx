'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import InternModal from '@/components/InternModal'
import { useSession } from 'next-auth/react'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_META = {
  active:     { color: 'var(--status-active)',     bg: 'rgba(0,196,140,0.12)'   },
  completed:  { color: 'var(--status-completed)',  bg: 'rgba(26,58,255,0.12)'  },
  terminated: { color: 'var(--status-terminated)', bg: 'rgba(255,77,106,0.12)' },
}
const EXP_COLORS        = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#1a3aff' }

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

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,15,46,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fadeUp"
        style={{ width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Assign Mentor Quick Modal ────────────────────────────────────────────────
function AssignMentorModal({ intern, departments, onSave, onClose, saving }) {
  const dept = departments.find(d => d.id === intern.department?.id)
  const allowedMentor = dept?.user ?? null
  const [mentorId, setMentorId] = useState(intern.user?.id ?? '')

  return (
    <Modal title={`Assign mentor — ${intern.userByUserId?.name}`} onClose={onClose}>
      {!intern.department?.id
        ? (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            This intern has no department assigned. Assign a department first, then a mentor can be set.
          </p>
        )
        : !allowedMentor
          ? (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              The department <strong>{dept?.name}</strong> has no head mentor. Go to Departments and assign one first.
            </p>
          )
          : (
            <>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Only the head mentor of <strong>{dept?.name}</strong> can be assigned to interns in this department.
              </p>
              <Field label="Mentor">
                <select className="input" value={mentorId} onChange={e => setMentorId(e.target.value)}>
                  <option value="">— None —</option>
                  <option value={allowedMentor.id}>{allowedMentor.name}</option>
                </select>
              </Field>
            </>
          )
      }
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        {allowedMentor && (
          <button className="btn-primary" disabled={saving} onClick={() => onSave(mentorId || null)}>
            {saving ? 'Saving…' : 'Assign'}
          </button>
        )}
      </div>
    </Modal>
  )
}

// ─── Confirm Delete ────────────────────────────────────────────────────────────
function ConfirmDelete({ intern, onConfirm, onClose, saving }) {
  return (
    <Modal title="Delete intern" onClose={onClose}>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
        Are you sure you want to delete <strong>{intern.userByUserId?.name}</strong>?
        <br />
        <span style={{ fontSize: '13px', color: 'var(--status-terminated)' }}>
          This permanently removes all their tasks, attendance records, and evaluations.
        </span>
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button
          disabled={saving}
          onClick={onConfirm}
          style={{
            background: 'var(--status-terminated)', color: 'white',
            padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InternsPage() {
  const [interns, setInterns]           = useState([])
  const [allUsers, setAllUsers]         = useState([])
  const [departments, setDepts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [toast, setToast]               = useState(null)

  const [addOpen, setAddOpen]         = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [deleteTarget, setDelTarget]  = useState(null)
  const [mentorTarget, setMentorTarget] = useState(null)

  const { data: session } = useSession()           // ← ADD THIS
  // const isMentor = session?.user?.role === 'mentor' // ← ADD THIS
  const canManage = ['admin', 'hr'].includes(session?.user?.role)
  
  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [iRes, uRes, dRes] = await Promise.all([
        fetch('/api/interns').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
        fetch('/api/departments').then(r => r.json()),
      ])

      console.log('Departments API response:', dRes)
      console.log('Departments data:', dRes?.data?.departments)

      setInterns(iRes?.interns ?? [])
      setAllUsers(uRes?.data ?? [])
      setDepts(dRes?.data?.departments ?? [])
    } catch {
      showToast('Failed to load data', false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const filtered = interns.filter(i => {
    const q = search.toLowerCase()
    const matchStatus = filterStatus === 'all' || i.status === filterStatus
    const matchSearch = !q
      || i.userByUserId?.name?.toLowerCase().includes(q)
      || i.userByUserId?.email?.toLowerCase().includes(q)
      || i.department?.name?.toLowerCase().includes(q)
      || i.position_title?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  async function handleAdd(form) {
    setSaving(true)
    try {
      const res  = await fetch('/api/interns', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(form),
      })
      const json = await res.json()
      
      if (!res.ok) {
        if (res.status === 400 && json.error?.includes('already has an active internship')) {
          showToast(json.error, false)
          console.log('Existing internship:', json.existingInternship)
        } else {
          throw new Error(json.error || 'Failed to create intern')
        }
        return
      }
      
      if (!json.ok) throw new Error(json.error)
      showToast('Intern added successfully')
      setAddOpen(false)
      loadAll()
    } catch (e) { 
      showToast(e.message, false) 
    } finally { 
      setSaving(false) 
    }
  }

  async function handleEdit(form) {
    setSaving(true)
    try {
      const res  = await fetch(`/api/interns/${editTarget.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      showToast('Intern updated')
      setEditTarget(null)
      loadAll()
    } catch (e) { showToast(e.message, false) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const res  = await fetch(`/api/interns/${deleteTarget.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      showToast('Intern deleted')
      setDelTarget(null)
      loadAll()
    } catch (e) { showToast(e.message, false) }
    finally { setSaving(false) }
  }

  async function handleAssignMentor(mentorId) {
    setSaving(true)
    try {
      const res  = await fetch(`/api/interns/${mentorTarget.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentor_id: mentorId }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      showToast('Mentor assigned')
      setMentorTarget(null)
      loadAll()
    } catch (e) { showToast(e.message, false) }
    finally { setSaving(false) }
  }

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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>Interns</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {loading ? '—' : `${interns.length} total interns`}
          </p>
        </div>
        {canManage && (
        <button className="btn-primary" onClick={() => setAddOpen(true)}> + Add Intern</button>
      )}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ maxWidth: '280px' }}
          placeholder="Search name, email, department…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {['all', 'active', 'completed', 'terminated'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
            border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-body)',
            borderColor: filterStatus === s ? 'var(--accent)' : 'var(--border)',
            background:  filterStatus === s ? 'rgba(26,58,255,0.10)' : 'transparent',
            color:        filterStatus === s ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table with fixed height and scrollbar */}
      <div className="card" style={{ 
        overflow: 'hidden', 
        padding: 0,
        maxHeight: 'calc(100vh - 280px)', // Fixed maximum height
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Intern', 'Department', 'Mentor', 'Position', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ 
                    padding: '13px 20px', 
                    textAlign: 'left', 
                    fontSize: '11px', 
                    fontWeight: '600', 
                    color: 'var(--text-muted)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.06em', 
                    whiteSpace: 'nowrap',
                    background: 'var(--bg-card)',
                    position: 'sticky',
                    top: 0
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1,2,3,4,5].map(i => (
                  <tr key={i}>{[1,2,3,4,5,6].map(j => (
                    <td key={j} style={{ padding: '14px 20px' }}>
                      <div className="skeleton" style={{ height: '14px', width: j === 1 ? '140px' : '80px' }} />
                    </td>
                  ))}</tr>
                ))
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                        {search || filterStatus !== 'all' ? 'No interns match your filters.' : 'No interns yet. Click Add Intern to get started.'}
                      </td>
                    </tr>
                  )
                  : filtered.map((intern, idx) => (
                    <tr key={intern.id}
                      style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Intern name + email */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                            {intern.userByUserId?.name?.[0] ?? '?'}
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{intern.userByUserId?.name}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{intern.userByUserId?.email}</p>
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
                          <span style={{ fontSize: '10px', fontWeight: '700', color: EXP_COLORS[intern.experience_level], textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {intern.experience_level}
                          </span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: '14px 20px' }}>
                        <Badge status={intern.status} />
                      </td>

                      {/* Action buttons */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'nowrap' }}>
                          <Link href={`/interns/${intern.id}`} className="btn-ghost" style={{ padding: '5px 10px', fontSize: '12px' }}>
                            View
                          </Link>
                          <button
                            className="btn-ghost"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            onClick={() => setEditTarget({
                              id:               intern.id,
                              department_id:    intern.department?.id ?? '',
                              mentor_id:        intern.user?.id ?? '',
                              status:           intern.status,
                              start_date:       intern.start_date ?? '',
                              end_date:         intern.end_date ?? '',
                              college:          intern.college ?? '',
                              position_title:   intern.position_title ?? '',
                              cgpa:             intern.cgpa ?? '',
                              city:             intern.city ?? '',
                              experience_level: intern.experience_level ?? '',
                              skills: intern.skills ?? [],
                              languages: intern.languages ?? [],
                            })}
                          >
                            Edit
                          </button>
                          <button
                            style={{
                              padding: '5px 10px', fontSize: '12px', borderRadius: '8px',
                              border: '1px solid rgba(255,77,106,0.25)', background: 'rgba(255,77,106,0.07)',
                              color: 'var(--status-terminated)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                              transition: 'all 0.15s',
                            }}
                            onClick={() => setDelTarget(intern)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <InternModal
      mode="add"
      open={addOpen}
      allUsers={allUsers}
      departments={departments}
      saving={saving}
      onClose={() => setAddOpen(false)}
      onSave={handleAdd}
      />

      <InternModal
      mode="edit"
      open={!!editTarget}
      initial={editTarget}
      allUsers={allUsers}
      departments={departments}
      saving={saving}
      onClose={() => setEditTarget(null)}
      onSave={handleEdit}
      />

      {deleteTarget && (
        <ConfirmDelete
          intern={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDelTarget(null)}
          saving={saving}
        />
      )}

      {mentorTarget && (
        <AssignMentorModal
          intern={mentorTarget}
          departments={departments}
          onSave={handleAssignMentor}
          onClose={() => setMentorTarget(null)}
          saving={saving}
        />
      )}
    </div>
  )
} 