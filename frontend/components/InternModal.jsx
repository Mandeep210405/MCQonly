'use client'

import { useState, useEffect, useRef } from 'react'

// ─── SearchableSelect ─────────────────────────────────────────────────────────
function SearchableSelect({ options, value, onChange, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const wrapperRef = useRef(null)

  const selectedOption = options.find(opt => opt.id === value)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = options.filter(opt =>
    opt.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          padding: '10px 14px',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          background: disabled ? 'var(--bg-input-disabled)' : 'var(--bg-input)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '42px',
        }}
      >
        <span style={{ color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {selectedOption ? selectedOption.name : placeholder || 'Select...'}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 1000, maxHeight: '280px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 14px', border: 'none',
              borderBottom: '1px solid var(--border)', outline: 'none',
              fontSize: '13px', background: 'var(--bg-input)',
            }}
            autoFocus
          />
          <div style={{ overflowY: 'auto', maxHeight: '240px' }}>
            {filtered.length === 0
              ? <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No users found</div>
              : filtered.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm('') }}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontWeight: '500', fontSize: '13px', color: 'var(--text-primary)' }}>{opt.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{opt.email}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label className="label">{label}</label>
      {hint && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', marginTop: '-4px' }}>{hint}</p>}
      {children}
    </div>
  )
}

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

// ─── Form (shared for add + edit) ────────────────────────────────────────────
function InternForm({ initial, allUsers, departments, onSave, onClose, saving, isEdit }) {
  const [form, setForm] = useState({
    user_id:          '',
    department_id:    '',
    mentor_id:        '',
    status:           'active',
    start_date:       '',
    end_date:         '',
    college:          '',
    position_title:   '',
    cgpa:             '',
    city:             '',
    experience_level: '',
    skills:           [],
    languages:        [],
    skillsInput:      '',
    languagesInput:   '',
    ...initial,
  })

  useEffect(() => {
    setForm(f => ({
      ...f,
      skillsInput:    (initial?.skills    || []).join(', '),
      languagesInput: (initial?.languages || []).join(', '),
    }))
  }, [initial])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectedDept  = departments.find(d => d.id === form.department_id)
  const allowedMentor = selectedDept?.user ?? null

  function handleDeptChange(deptId) {
    set('department_id', deptId)
    set('mentor_id', '')
  }

  const internUsers = allUsers.filter(u => u.role === 'intern')

  return (
    <form onSubmit={e => {
      e.preventDefault()
      onSave({
        ...form,
        skills:    form.skillsInput    ? form.skillsInput.split(',').map(s => s.trim()).filter(Boolean)    : [],
        languages: form.languagesInput ? form.languagesInput.split(',').map(l => l.trim()).filter(Boolean) : [],
      })
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>

        {/* User picker — only shown when adding */}
        {!isEdit && (
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="User account *" hint="Search and select an existing user with role = intern">
              <SearchableSelect
                options={internUsers}
                value={form.user_id}
                onChange={v => set('user_id', v)}
                placeholder="Search by name or email..."
              />
            </Field>
          </div>
        )}

        <Field label="Position title">
          <input className="input" value={form.position_title} onChange={e => set('position_title', e.target.value)} placeholder="e.g. Frontend Intern" />
        </Field>

        <Field label="Status">
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="terminated">Terminated</option>
          </select>
        </Field>

        <Field label="Department">
          <select className="input" value={form.department_id} onChange={e => handleDeptChange(e.target.value)}>
            <option value="">— None —</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>

        <Field
          label="Mentor"
          hint={
            !form.department_id ? 'Select a department first'
            : allowedMentor ? `Auto-set to ${allowedMentor.name} (head of this dept)`
            : 'This department has no head mentor assigned'
          }
        >
          <select
            className="input"
            value={form.mentor_id}
            onChange={e => set('mentor_id', e.target.value)}
            disabled={!form.department_id || !allowedMentor}
            style={{ opacity: (!form.department_id || !allowedMentor) ? 0.5 : 1 }}
          >
            <option value="">— None —</option>
            {allowedMentor && <option value={allowedMentor.id}>{allowedMentor.name}</option>}
          </select>
        </Field>

        <Field label="Start date *">
          <input type="date" className="input" value={form.start_date} onChange={e => set('start_date', e.target.value)} required />
        </Field>

        <Field label="End date">
          <input type="date" className="input" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </Field>

        <Field label="College">
          <input className="input" value={form.college} onChange={e => set('college', e.target.value)} placeholder="University name" />
        </Field>

        <Field label="City">
          <input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
        </Field>

        <Field label="CGPA">
          <input type="number" step="0.1" min="0" max="10" className="input" value={form.cgpa} onChange={e => set('cgpa', e.target.value)} placeholder="e.g. 8.5" />
        </Field>

        <Field label="Experience level">
          <select className="input" value={form.experience_level} onChange={e => set('experience_level', e.target.value)}>
            <option value="">— Select —</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </Field>

        <Field label="Skills">
          <input className="input" placeholder="e.g. React, Node.js, SQL" value={form.skillsInput} onChange={e => set('skillsInput', e.target.value)} />
        </Field>

        <Field label="Languages">
          <input className="input" placeholder="e.g. English, Hindi, Gujarati" value={form.languagesInput} onChange={e => set('languagesInput', e.target.value)} />
        </Field>

      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add intern'}
        </button>
      </div>
    </form>
  )
}

// ─── Exported component ───────────────────────────────────────────────────────
export default function InternModal({ mode, open, initial, allUsers, departments, saving, onClose, onSave }) {
  if (!open) return null

  const isEdit = mode === 'edit'

  return (
    <Modal title={isEdit ? 'Edit intern' : 'Add new intern'} onClose={onClose}>
      <InternForm
        initial={isEdit ? initial : undefined}
        allUsers={allUsers}
        departments={departments}
        onSave={onSave}
        onClose={onClose}
        saving={saving}
        isEdit={isEdit}
      />
    </Modal>
  )
}
