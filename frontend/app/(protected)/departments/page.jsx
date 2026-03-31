'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

const DEPT_COLORS = ['#1a3aff', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#7c5cfc', '#f97316', '#3b82f6']

// ─── Modal shell ──────────────────────────────────────────────────────────────
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
        style={{ width: '100%', maxWidth: '480px', padding: '32px' }}
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

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label className="label">{label}</label>
      {hint && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', marginTop: '-4px' }}>{hint}</p>}
      {children}
    </div>
  )
}

// ─── Department form (Add / Edit) ─────────────────────────────────────────────
// mentors       = all users with role 'mentor' or 'admin'
// takenMentors  = Set of head_user_id values already used by OTHER departments
function DeptForm({ initial, mentors, takenMentors, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    head_user_id: '',
    ...initial,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }}>

      <Field label="Department name *">
        <input
          className="input"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Engineering"
          required
        />
      </Field>

      <Field label="Description">
        <textarea
          className="input"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="What does this department do?"
          rows={3}
          style={{ resize: 'vertical', minHeight: '80px' }}
        />
      </Field>

      {/*
        HEAD MENTOR DROPDOWN
        Rule: show all mentors/admins but DISABLE any who are already head of
        a different department. This stops the same mentor heading two depts.
      */}
      <Field
        label="Department head (mentor)"
        hint="Only mentors not already heading another department can be selected."
      >
        <select
          className="input"
          value={form.head_user_id}
          onChange={e => set('head_user_id', e.target.value)}
        >
          <option value="">— No head assigned —</option>
          {mentors.map(m => {
            const alreadyTaken = takenMentors.has(m.id)
            return (
              <option key={m.id} value={m.id} disabled={alreadyTaken}>
                {m.name} ({m.role}){alreadyTaken ? ' — already heads another dept' : ''}
              </option>
            )
          })}
        </select>
      </Field>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial?.id ? 'Save changes' : 'Create department'}
        </button>
      </div>
    </form>
  )
}

function ChangeMentorModal({ dept, mentors, takenMentors, saving, onClose, onSave }) {
  // Pre-fill with the currently assigned mentor (if any)
  const [selectedMentorId, setSelectedMentorId] = useState(dept.user?.id ?? '')

  const currentMentorName = dept.user?.name ?? null

  return (
    <Modal title={`Change mentor — ${dept.name}`} onClose={onClose}>

      {/* Info about current mentor */}
      <div style={{
        padding: '12px 14px',
        borderRadius: '10px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border)',
        marginBottom: '20px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
      }}>
        {currentMentorName
          ? <>Current mentor: <strong style={{ color: 'var(--text-primary)' }}>{currentMentorName}</strong></>
          : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No mentor currently assigned</span>
        }
      </div>

      <Field
        label="Select new mentor"
        hint="Mentors already heading another department are disabled."
      >
        <select
          className="input"
          value={selectedMentorId}
          onChange={e => setSelectedMentorId(e.target.value)}
        >
          {/* Empty option = remove mentor */}
          <option value="">— Remove mentor —</option>
          {mentors.map(m => {
            const alreadyTaken = takenMentors.has(m.id)
            return (
              <option key={m.id} value={m.id} disabled={alreadyTaken}>
                {m.name} ({m.role}){alreadyTaken ? ' — already heads another dept' : ''}
              </option>
            )
          })}
        </select>
      </Field>

      {/* Warning shown when user is about to remove the mentor */}
      {selectedMentorId === '' && currentMentorName && (
        <p style={{
          fontSize: '12px',
          color: 'var(--status-terminated)',
          marginBottom: '12px',
          padding: '8px 12px',
          background: 'rgba(255,77,106,0.08)',
          borderRadius: '8px',
          border: '1px solid rgba(255,77,106,0.2)',
        }}>
          ⚠ Saving with no selection will remove <strong>{currentMentorName}</strong> as head of this department.
          Interns in this department will lose their assigned mentor.
        </p>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button
          className="btn-primary"
          disabled={saving}
          onClick={() => onSave(selectedMentorId || null)}
        >
          {saving ? 'Saving…' : selectedMentorId ? 'Assign mentor' : 'Remove mentor'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DepartmentsPage() {
  const [departments, setDepts]         = useState([])
  const [users, setUsers]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState(null)

  // modal state
  const [addOpen, setAddOpen]               = useState(false)
  const [editTarget, setEdit]               = useState(null)   // dept object when editing
  const [delTarget, setDel]                 = useState(null)   // dept object when deleting
  // ── NEW: mentor change modal state ──
  const [mentorTarget, setMentorTarget]     = useState(null)   // dept object when changing mentor

  const {data: session} = useSession();
  const canManage = ['admin', 'hr'].includes(session?.user?.role)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, uRes] = await Promise.all([
        fetch('/api/departments').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
      ])
      setDepts(dRes?.data?.departments ?? [])
      setUsers(uRes?.data?.users ?? [])
    } catch {
      showToast('Failed to load data', false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Only users who can be a department head
  const mentors = users.filter(u => u.role === 'mentor' || u.role === 'admin')

  // Build the set of mentor IDs already assigned as head of some department.
  // When editing, exclude the current dept's own head from this set so it
  // stays selectable for itself.
  function getTakenMentors(excludeDeptId = null) {
    const taken = new Set()
    departments.forEach(d => {
      if (d.head_user_id && d.id !== excludeDeptId) {
        taken.add(d.head_user_id)
      }
    })
    return taken
  }

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  async function handleAdd(form) {
    setSaving(true)
    try {
      const res  = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      showToast('Department created')
      setAddOpen(false)
      loadAll()
    } catch (e) { showToast(e.message, false) }
    finally { setSaving(false) }
  }

  async function handleEdit(form) {
    setSaving(true)
    try {
      const res  = await fetch('/api/departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editTarget.id }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      showToast('Department updated')
      setEdit(null)
      loadAll()
    } catch (e) { showToast(e.message, false) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const res  = await fetch('/api/departments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: delTarget.id }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      showToast('Department deleted')
      setDel(null)
      loadAll()
    } catch (e) { showToast(e.message, false) }
    finally { setSaving(false) }
  }

  // ── NEW: Change / remove mentor handler ────────────────────────────────────
  // Sends PATCH /api/departments with { id, head_user_id }
  // Pass null or '' for head_user_id to remove the mentor.
  async function handleChangeMentor(newMentorId) {
    setSaving(true)
    try {
      const res  = await fetch('/api/departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:           mentorTarget.id,
          name:         mentorTarget.name,          // keep existing name (PATCH may require it)
          head_user_id: newMentorId || null,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      showToast(newMentorId ? 'Mentor assigned' : 'Mentor removed')
      setMentorTarget(null)
      loadAll()
    } catch (e) { showToast(e.message, false) }
    finally { setSaving(false) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toast notification */}
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

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>Departments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {loading ? '—' : `${departments.length} departments`}
          </p>
        </div>
        {canManage && (<button className="btn-primary" onClick={() => setAddOpen(true)}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Department
        </button>)}
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
        {loading
          ? [1,2,3,4,5,6].map(i => <div key={i} className="skeleton card" style={{ height: '200px' }} />)
          : departments.length === 0
            ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>🏢</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>No departments yet.</p>
                <button className="btn-primary" onClick={() => setAddOpen(true)}>Add first department</button>
              </div>
            )
            : departments.map((dept, idx) => {
              const color    = DEPT_COLORS[idx % DEPT_COLORS.length]
              const count    = dept.interns_aggregate?.aggregate?.count ?? 0
              const headName = dept.user?.name ?? null

              return (
                <div key={dept.id} className="card animate-fadeUp" style={{ padding: '24px', borderTop: `3px solid ${color}` }}>

                  {/* Top row: icon + intern count */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      🏢
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: '700', color }}>
                      {count}
                    </span>
                  </div>

                  {/* Dept name */}
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    {dept.name}
                  </h2>

                  {/* Description — clamp to 2 lines */}
                  {dept.description && (
                    <p style={{
                      fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px',
                      lineHeight: '1.55', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {dept.description}
                    </p>
                  )}

                  {/* Head mentor row — now includes "Change Mentor" button */}
                  <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)', marginTop: 'auto', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Head mentor</p>
                      {/* ── NEW: Change Mentor button ── */}
                      {canManage && (<button
                        onClick={() => setMentorTarget(dept)}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--accent)'
                          e.currentTarget.style.color = 'var(--accent)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border)'
                          e.currentTarget.style.color = 'var(--text-muted)'
                        }}
                      >
                        {headName ? 'Change' : 'Assign'}
                      </button>)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {headName
                        ? (
                          <>
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                              {headName[0]}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{headName}</span>
                          </>
                        )
                        : <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not assigned</span>
                      }
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {count} intern{count !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Actions — Edit + Delete (unchanged) */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {canManage && (<button
                      className="btn-ghost"
                      style={{ flex: 1, fontSize: '12px', justifyContent: 'center' }}
                      onClick={() => setEdit({
                        id:           dept.id,
                        name:         dept.name,
                        description:  dept.description ?? '',
                        head_user_id: dept.user?.id ?? '',
                      })}
                    >
                      Edit
                    </button>)}
                    {canManage && (<button
                      style={{
                        flex: 1, fontSize: '12px', borderRadius: '10px', padding: '8px 12px',
                        border: '1px solid rgba(255,77,106,0.25)', background: 'rgba(255,77,106,0.07)',
                        color: 'var(--status-terminated)', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                      }}
                      onClick={() => setDel(dept)}
                    >
                      Delete
                    </button>)}
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* ── Add modal ── */}
      {addOpen && (
        <Modal title="Create department" onClose={() => setAddOpen(false)}>
          <DeptForm
            mentors={mentors}
            takenMentors={getTakenMentors()}
            onSave={handleAdd}
            onClose={() => setAddOpen(false)}
            saving={saving}
          />
        </Modal>
      )}

      {/* ── Edit modal ── */}
      {editTarget && (
        <Modal title="Edit department" onClose={() => setEdit(null)}>
          <DeptForm
            initial={editTarget}
            mentors={mentors}
            takenMentors={getTakenMentors(editTarget.id)}
            onSave={handleEdit}
            onClose={() => setEdit(null)}
            saving={saving}
          />
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {delTarget && (
        <Modal title="Delete department" onClose={() => setDel(null)}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
            Are you sure you want to delete <strong>{delTarget.name}</strong>?
            <br />
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Interns in this department will have their department set to none. The head mentor is not deleted.
            </span>
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setDel(null)}>Cancel</button>
            <button
              disabled={saving}
              onClick={handleDelete}
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
      )}

      {/* ── NEW: Change Mentor modal ── */}
      {mentorTarget && (
        <ChangeMentorModal
          dept={mentorTarget}
          mentors={mentors}
          takenMentors={getTakenMentors(mentorTarget.id)}
          saving={saving}
          onClose={() => setMentorTarget(null)}
          onSave={handleChangeMentor}
        />
      )}
    </div>
  )
}