'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

const AUDIENCE = {
  all:          { label: 'Everyone',     color: '#1d4ed8', bg: 'rgba(29,78,216,0.08)'  },
  interns_only: { label: 'Interns Only', color: '#0369a1', bg: 'rgba(3,105,161,0.08)'  },
  mentors_only: { label: 'Mentors Only', color: '#1e40af', bg: 'rgba(30,64,175,0.08)'  },
}

const AUDIENCE_OPTIONS = [
  { value: 'all',          label: 'Everyone'     },
  { value: 'interns_only', label: 'Interns Only' },
  { value: 'mentors_only', label: 'Mentors Only' },
]

const ROLE_STYLE = {
  admin:  { color: '#1e3a8a', bg: 'rgba(30,58,138,0.08)',  label: 'Admin — Full access'  },
  hr:     { color: '#1d4ed8', bg: 'rgba(29,78,216,0.08)',  label: 'HR — Full access'     },
  mentor: { color: '#0369a1', bg: 'rgba(3,105,161,0.08)',  label: 'Mentor — View only'   },
  intern: { color: '#0284c7', bg: 'rgba(2,132,199,0.08)',  label: 'Intern — View only'   },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}


function canManage(role) {
  return role === 'admin' || role === 'hr'
}

function filterByRole(items, role) {
  if (role === 'admin' || role === 'hr' || role === 'mentor') return items
  if (role === 'intern') return items.filter(i => i.audience === 'all' || i.audience === 'interns_only')
  return items
}


const BLANK = { title: '', body: '', audience: 'all' }

function AnnouncementModal({ mode, initial, onClose, onSave, userId }) {
  const [form, setForm]     = useState(mode === 'edit' ? initial : BLANK)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)
  const overlayRef          = useRef(null)
  const titleRef            = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.body.trim())  { setError('Body is required.');  return }
    setSaving(true); setError(null)
    try {
      const method  = mode === 'edit' ? 'PUT' : 'POST'
      const payload = mode === 'edit'
        ? { ...form, id: initial.id }
        : { ...form, created_by: userId ?? null }
      const res = await fetch('/api/announcements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Request failed')
      onSave()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const aud = AUDIENCE[form.audience] ?? AUDIENCE.all

  return (
    <div
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(8,20,60,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="animate-fadeUp"
        style={{
          background: 'var(--bg-card)', borderRadius: '16px',
          width: '100%', maxWidth: '540px',
          border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(29,78,216,0.12)',
        }}
      >
        <div style={{
          padding: '22px 26px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {mode === 'edit' ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
              {mode === 'edit' ? 'Update the announcement details' : 'Post an announcement to your team'}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ flexShrink: 0, marginLeft: '12px' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label">Title <span style={{ color: '#1d4ed8' }}>*</span></label>
            <input
              ref={titleRef}
              className="input"
              placeholder="e.g. Weekly standup schedule update"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              maxLength={200}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
              {form.title.length}/200
            </p>
          </div>

          <div>
            <label className="label">Audience</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {AUDIENCE_OPTIONS.map(opt => {
                const a      = AUDIENCE[opt.value]
                const active = form.audience === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => set('audience', opt.value)}
                    style={{
                      flex: 1, padding: '9px 8px', borderRadius: '8px', fontSize: '12px',
                      fontFamily: 'var(--font-body)', cursor: 'pointer', fontWeight: '500',
                      border: `1.5px solid ${active ? a.color : 'var(--border)'}`,
                      background: active ? a.bg : 'transparent',
                      color: active ? a.color : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="label">Message <span style={{ color: '#1d4ed8' }}>*</span></label>
            <textarea
              className="input"
              rows={5}
              placeholder="Write the full announcement here…"
              value={form.body}
              onChange={e => set('body', e.target.value)}
              style={{ resize: 'vertical', minHeight: '110px', lineHeight: '1.65' }}
            />
          </div>

          {(form.title.trim() || form.body.trim()) && (
            <div style={{
              background: 'var(--bg-input)', borderRadius: '10px',
              padding: '14px 16px', borderLeft: `3px solid ${aud.color}`,
            }}>
              <p style={{
                fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px',
                fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Preview
              </p>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {form.title || '—'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.55' }}>
                {form.body.length > 120 ? form.body.slice(0, 120) + '…' : form.body || '—'}
              </p>
              <span style={{
                display: 'inline-block', marginTop: '8px', fontSize: '11px',
                fontWeight: '600', padding: '2px 9px', borderRadius: '4px',
                background: aud.bg, color: aud.color,
              }}>
                {aud.label}
              </span>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(29,78,216,0.06)', border: '1px solid rgba(29,78,216,0.2)',
              borderRadius: '8px', padding: '10px 14px', color: '#1d4ed8', fontSize: '13px',
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{
          padding: '16px 26px 22px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>
  )
}


function DeleteModal({ item, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false)
  const overlayRef              = useRef(null)

  const confirm = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      })
      if (!res.ok) throw new Error('Delete failed')
      onConfirm()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(8,20,60,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div
        className="animate-fadeUp"
        style={{
          background: 'var(--bg-card)', borderRadius: '16px', padding: '32px 28px',
          width: '100%', maxWidth: '380px',
          border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(29,78,216,0.12)',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: 'rgba(29,78,216,0.08)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
        }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>

        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '16px',
          fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)',
        }}>
          Delete Announcement
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
          <strong style={{ color: 'var(--text-primary)' }}>"{item.title}"</strong> will be permanently removed. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            onClick={confirm}
            disabled={deleting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              background: '#1e3a8a', color: '#fff', border: 'none',
              padding: '10px 22px', borderRadius: '8px', fontSize: '13px',
              fontFamily: 'var(--font-body)', fontWeight: '600',
              cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = '#1d4ed8' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1e3a8a' }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}


export default function AnnouncementsPage() {
  const { data: session } = useSession()
  const role   = session?.user?.role ?? 'intern'
  const userId = session?.user?.id   ?? null
  const manage = canManage(role)

  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const [filter,  setFilter]  = useState('__all')

  const load = () => {
    setLoading(true)
    fetch('/api/announcements')
      .then(r => r.text())
      .then(text => {
        if (text) {
          const d = JSON.parse(text)
          setItems(d?.announcements ?? [])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const roleFiltered = filterByRole(items, role)
  const displayed    = filter === '__all'
    ? roleFiltered
    : roleFiltered.filter(i => i.audience === filter)

  const audienceTabs = [
    { key: '__all', label: 'All', color: '#1d4ed8', bg: 'rgba(29,78,216,0.08)' },
    ...AUDIENCE_OPTIONS
      .filter(o => role === 'intern' ? o.value !== 'mentors_only' : true)
      .map(o => ({ key: o.value, label: o.label, color: AUDIENCE[o.value].color, bg: AUDIENCE[o.value].bg }))
  ]

  const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.intern

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Announcements
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            {loading ? '—' : `${roleFiltered.length} announcement${roleFiltered.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {manage && (
          <button onClick={() => setModal('add')} className="btn-primary">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New Announcement
          </button>
        )}
      </div>

      {/* Role badge */}
      <div style={{ marginBottom: '20px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '5px', fontSize: '11px', fontWeight: '600',
          background: roleStyle.bg, color: roleStyle.color,
          border: `1px solid ${roleStyle.color}22`,
          letterSpacing: '0.02em', textTransform: 'uppercase',
        }}>
          {roleStyle.label}
        </span>
      </div>

      {/* Audience filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '22px', flexWrap: 'wrap' }}>
        {audienceTabs.map(f => (
          <button
            key={`filter-${f.key}`}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '12px',
              fontFamily: 'var(--font-body)', cursor: 'pointer', fontWeight: '500',
              border: '1.5px solid',
              borderColor: filter === f.key ? f.color : 'var(--border)',
              background:  filter === f.key ? f.bg    : 'transparent',
              color:       filter === f.key ? f.color : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
            {f.key !== '__all' && (
              <span style={{ marginLeft: '6px', opacity: 0.65 }}>
                {roleFiltered.filter(i => i.audience === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border)', marginBottom: '22px' }} />

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '780px' }}>
        {loading
          ? [1, 2, 3].map(i => (
              <div key={i} className="skeleton card" style={{ height: '100px', borderRadius: '10px' }} />
            ))
          : displayed.length === 0
            ? (
              <div style={{ textAlign: 'center', padding: '72px 0', color: 'var(--text-muted)' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: 'rgba(29,78,216,0.06)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#93c5fd" strokeWidth="1.5">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/>
                  </svg>
                </div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  No announcements to show
                </p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>
                  Check back later or adjust your filter
                </p>
              </div>
            )
            : displayed.map(item => {
              const aud = AUDIENCE[item.audience] ?? AUDIENCE.all
              return (
                <div
                  key={item.id}
                  className="card animate-fadeUp"
                  style={{ padding: '20px 24px', borderLeft: `3px solid ${aud.color}`, borderRadius: '10px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {item.title}
                        </h2>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                          fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase',
                          background: aud.bg, color: aud.color, flexShrink: 0,
                        }}>
                          {aud.label}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '12px' }}>
                        {item.body}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Posted by{' '}
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                          {item.user?.name ?? 'Admin'}
                        </span>
                        {' · '}{timeAgo(item.created_at)}
                      </p>
                    </div>

                    {manage && (
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          onClick={() => setModal({ mode: 'edit', item })}
                          className="btn-icon"
                          title="Edit announcement"
                          style={{ width: '32px', height: '32px', borderRadius: '7px' }}
                        >
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setModal({ mode: 'delete', item })}
                          className="btn-icon"
                          title="Delete announcement"
                          style={{ width: '32px', height: '32px', borderRadius: '7px' }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(29,78,216,0.1)'
                            e.currentTarget.style.borderColor = '#1d4ed8'
                            e.currentTarget.style.color = '#1d4ed8'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = ''
                            e.currentTarget.style.borderColor = ''
                            e.currentTarget.style.color = ''
                          }}
                        >
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* Modals */}
      {manage && modal === 'add' && (
        <AnnouncementModal
          mode="add"
          userId={userId}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}
      {manage && modal?.mode === 'edit' && (
        <AnnouncementModal
          mode="edit"
          userId={userId}
          initial={{ id: modal.item.id, title: modal.item.title, body: modal.item.body, audience: modal.item.audience }}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}
      {manage && modal?.mode === 'delete' && (
        <DeleteModal
          item={modal.item}
          onClose={() => setModal(null)}
          onConfirm={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}