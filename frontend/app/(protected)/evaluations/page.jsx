'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'


// Role permission helpers
function useRole() {
  const { data: session } = useSession()
  const role = session?.user?.role ?? ''
  const userId = session?.user?.id ?? ''
  return {
    role, userId,
    isAdmin: role === 'admin',
    isMentor: role === 'mentor',
    isHR: role === 'hr',
    isIntern: role === 'intern',
    canAdd: role === 'admin' || role === 'mentor',
    canEdit: role === 'admin' || role === 'mentor',
    canViewAll: role === 'admin' || role === 'mentor' || role === 'hr',
  }
}


// Skill score categories
const SKILL_FIELDS = [
  { key: 'technical_skill_score',   label: 'Technical Skill' },
  { key: 'problem_solving_score',   label: 'Problem Solving' },
  { key: 'communication_score',     label: 'Communication' },
  { key: 'teamwork_score',          label: 'Teamwork' },
  { key: 'initiative_score',        label: 'Initiative' },
  { key: 'time_management_score',   label: 'Time Management' },
  { key: 'learning_ability_score',  label: 'Learning Ability' },
  { key: 'ownership_score',         label: 'Ownership' },
]


// Helpers
function scoreColor(s) {
  return s >= 8 ? '#1a3aff' : s >= 5 ? '#3b82f6' : '#93c5fd'
}
function scoreLabel(s) {
  return s >= 8 ? 'Excellent' : s >= 5 ? 'Good' : 'Needs Improvement'
}
function calcAutoOverall(form) {
  const vals = SKILL_FIELDS.map(f => parseInt(form[f.key])).filter(v => !isNaN(v) && v > 0)
  if (!vals.length) return ''
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}


function ScorePill({ score }) {
  const color = scoreColor(score)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%',
        border: `2.5px solid ${color}`, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '800', color,
      }}>
        {score}
      </div>
      <div style={{ flex: 1, height: '6px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ width: `${score * 10}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}


function RadarChart({ ev }) {
  const skills = SKILL_FIELDS.map(f => ({ label: f.label.split(' ')[0], value: ev[f.key] ?? 0 }))
  const n = skills.length
  const cx = 140, cy = 130, r = 90
  const angleStep = (2 * Math.PI) / n
  const levels = [2, 4, 6, 8, 10]

  const pt = (val, idx) => {
    const angle = idx * angleStep - Math.PI / 2
    return { x: cx + (val / 10) * r * Math.cos(angle), y: cy + (val / 10) * r * Math.sin(angle) }
  }

  const polygon = skills.map((s, i) => pt(s.value, i))
  const polyStr = polygon.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg width="280" height="270" viewBox="0 0 280 270">
      {levels.map(l => {
        const pts = skills.map((_, i) => pt(l, i))
        return (
          <polygon key={l}
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke="var(--border)" strokeWidth="1"
          />
        )
      })}
      {skills.map((_, i) => {
        const outer = pt(10, i)
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="var(--border)" strokeWidth="1" />
      })}
      <polygon points={polyStr} fill="rgba(26,58,255,0.15)" stroke="var(--accent)" strokeWidth="2" />
      {polygon.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--accent)" stroke="#fff" strokeWidth="1.5" />
      ))}
      {skills.map((s, i) => {
        const outer = pt(11.5, i)
        return (
          <text key={i} x={outer.x} y={outer.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="var(--text-secondary)" fontWeight="500">
            {s.label}
          </text>
        )
      })}
      {levels.map(l => {
        const p = pt(l, 0)
        return <text key={l} x={p.x - 4} y={p.y} fontSize="9" fill="var(--text-muted)" textAnchor="end">{l}</text>
      })}
    </svg>
  )
}

function ScoreOverviewChart({ evaluations }) {
  const map = {}
  evaluations.forEach(ev => {
    const name = ev.intern?.userByUserId?.name ?? 'Unknown'
    const dept = ev.intern?.department?.name ?? ''
    if (!map[name]) map[name] = { scores: [], dept }
    map[name].scores.push(ev.overall_score ?? 0)
  })
  const rows = Object.entries(map)
    .map(([name, { scores, dept }]) => ({
      name, dept,
      avg: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
      count: scores.length,
    }))
    .sort((a, b) => b.avg - a.avg)

  if (!rows.length) return (
    <div className="card" style={{ padding: '48px', textAlign: 'center', marginBottom: '28px' }}>
      <p style={{ fontSize: '32px', marginBottom: '8px' }}></p>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No data to chart yet.</p>
    </div>
  )

  const LEFT = 150, RIGHT = 72, BAR_H = 38, GAP = 14, TOP = 32, W = 700
  const svgH = TOP + rows.length * (BAR_H + GAP) + 16
  const trackW = W - LEFT - RIGHT

  return (
    <div className="card animate-fadeUp" style={{ padding: '28px', marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: '700' }}>Overall Score per Intern</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
            Average overall evaluation score · {rows.length} intern{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
          {[{ label: 'Excellent', range: '8–10', c: '#1a3aff' }, { label: 'Good', range: '5–7', c: '#3b82f6' }, { label: 'Needs Work', range: '1–4', c: '#93c5fd' }]
            .map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.c }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.label} ({l.range})</span>
              </div>
            ))}
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${svgH}`} style={{ overflow: 'visible' }}>
        {[0, 2.5, 5, 7.5, 10].map(v => {
          const x = LEFT + (v / 10) * trackW
          return (
            <g key={v}>
              <line x1={x} y1={TOP - 14} x2={x} y2={svgH - 8} stroke="var(--border)" strokeWidth="1" strokeDasharray={v === 0 ? '0' : '4 3'} />
              <text x={x} y={TOP - 17} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{v}</text>
            </g>
          )
        })}
        {rows.map((r, i) => {
          const y = TOP + i * (BAR_H + GAP)
          const barW = (r.avg / 10) * trackW
          const c = scoreColor(r.avg)
          const shortName = r.name.length > 18 ? r.name.slice(0, 17) + '…' : r.name
          return (
            <g key={r.name}>
              <text x={LEFT - 10} y={y + BAR_H / 2 + 4} textAnchor="end" fontSize="12" fontWeight="500" fill="var(--text-primary)">{shortName}</text>
              <text x={LEFT - 10} y={y + BAR_H / 2 + 16} textAnchor="end" fontSize="10" fill="var(--text-muted)">{r.dept}</text>
              <rect x={LEFT} y={y + 8} width={trackW} height={BAR_H - 16} rx="8" fill="var(--bg-input)" />
              <rect x={LEFT} y={y + 8} width={Math.max(barW, 24)} height={BAR_H - 16} rx="8" fill={c} opacity="0.88" />
              <text x={LEFT + barW + 10} y={y + BAR_H / 2 + 4} fontSize="14" fontWeight="800" fill={c}>{r.avg}</text>
              <text x={LEFT + barW + 10} y={y + BAR_H / 2 + 16} fontSize="10" fill="var(--text-muted)">{r.count} eval{r.count !== 1 ? 's' : ''}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}


function InternProgressChart({ evaluations }) {
  if (evaluations.length < 2) return null
  const sorted = [...evaluations].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const W = 600, H = 200, PL = 40, PR = 20, PT = 20, PB = 40
  const chartW = W - PL - PR, chartH = H - PT - PB
  const n = sorted.length
  const pts = sorted.map((ev, i) => ({
    x: PL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW),
    y: PT + chartH - (((ev.overall_score ?? 0) - 1) / 9) * chartH,
    score: ev.overall_score ?? 0,
    period: ev.period ?? new Date(ev.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  }))
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `${pts[0].x},${PT + chartH} ` + polyline + ` ${pts[pts.length - 1].x},${PT + chartH}`
  const avgScore = (sorted.reduce((s, e) => s + (e.overall_score ?? 0), 0) / sorted.length).toFixed(1)

  return (
    <div className="card animate-fadeUp" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: '700' }}>My Score Progress</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {sorted.length} evaluation{sorted.length !== 1 ? 's' : ''} · avg {avgScore}/10
          </p>
        </div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: scoreColor(Number(avgScore)) }}>{avgScore}</div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {[1, 4, 7, 10].map(v => {
          const y = PT + chartH - ((v - 1) / 9) * chartH
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{v}</text>
            </g>
          )
        })}
        <polygon points={area} fill="rgba(26,58,255,0.08)" />
        <polyline points={polyline} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => {
          const c = scoreColor(p.score)
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill={c} stroke="#fff" strokeWidth="2" />
              <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill={c}>{p.score}</text>
              <text x={p.x} y={H - PB + 16} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{p.period}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}


function ScoreSlider({ label, fieldKey, value, onChange, disabled }) {
  const val = value === '' || value == null ? 0 : parseInt(value)
  const color = val > 0 ? scoreColor(val) : 'var(--text-muted)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
          {label}
        </label>
        <span style={{ fontSize: '16px', fontWeight: '800', color, fontFamily: 'var(--font-mono)', minWidth: '28px', textAlign: 'right' }}>
          {val > 0 ? val : '—'}
        </span>
      </div>
      <input
        type="range" min="0" max="10" step="1"
        value={val}
        onChange={e => onChange(fieldKey, parseInt(e.target.value) || 0)}
        disabled={disabled}
        style={{ width: '100%', accentColor: color, cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
    </div>
  )
}


const BLANK = {
  intern_id: '', evaluator_id: '', period: '',
  technical_skill_score: 0, problem_solving_score: 0, communication_score: 0,
  teamwork_score: 0, initiative_score: 0, time_management_score: 0,
  learning_ability_score: 0, ownership_score: 0,
  overall_score: 7,
  strengths: '', improvement_areas: '', mentor_feedback: '',
}

function EvalModal({ mode, initial, interns, evaluators, onClose, onSave, userRole }) {
  const [form, setForm] = useState(mode === 'edit' ? { ...BLANK, ...initial } : { ...BLANK })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [autoOverall, setAutoOverall] = useState(true)
  const overlayRef = useRef(null)

  const set = (k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v }
      if (SKILL_FIELDS.some(s => s.key === k) && autoOverall) {
        const auto = calcAutoOverall(next)
        if (auto !== '') next.overall_score = auto
      }
      return next
    })
  }

  const submit = async () => {
    if (!form.intern_id) { setError('Please select an intern.'); return }
    if (!form.overall_score || form.overall_score < 1 || form.overall_score > 10) {
      setError('Overall score must be 1–10.'); return
    }
    setSaving(true); setError(null)
    try {
      const method = mode === 'edit' ? 'PUT' : 'POST'
      const payload = mode === 'edit' ? { ...form, id: initial.id } : form
      const res = await fetch('/api/evaluations', {
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

  const overall = parseInt(form.overall_score) || 0
  const oColor = overall > 0 ? scoreColor(overall) : 'var(--text-muted)'

  return (
    <div
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10,15,46,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '24px 20px', overflowY: 'auto',
      }}
    >
      <div className="animate-fadeUp" style={{
        background: 'var(--bg-card)', borderRadius: '24px',
        width: '100%', maxWidth: '640px',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
        marginTop: 'auto', marginBottom: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 26px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700' }}>
              {mode === 'edit' ? 'Edit Evaluation' : 'Add Evaluation'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
              {mode === 'edit' ? 'Update scores and feedback' : 'Rate the intern across 8 skill areas'}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ flexShrink: 0, marginLeft: '12px' }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Intern + Period */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label">Intern *</label>
              <select className="input" value={form.intern_id} onChange={e => set('intern_id', e.target.value)}
                disabled={mode === 'edit'} style={{ cursor: mode === 'edit' ? 'not-allowed' : 'pointer', opacity: mode === 'edit' ? 0.55 : 1 }}>
                <option value="">Select intern…</option>
                {interns.map(i => (
                  <option key={i.id} value={i.id}>{i.userByUserId?.name ?? i.id} — {i.department?.name ?? 'No dept'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Period</label>
              <input className="input" placeholder="e.g. Week 4, Midterm" value={form.period} onChange={e => set('period', e.target.value)} />
            </div>
          </div>

          {/* Evaluator */}
          <div>
            <label className="label">Evaluator</label>
            <select className="input" value={form.evaluator_id} onChange={e => set('evaluator_id', e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="">Select evaluator…</option>
              {evaluators.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>
              Skill Scores (0 = not rated, 1–10 scale)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
              {SKILL_FIELDS.map(f => (
                <ScoreSlider key={f.key} label={f.label} fieldKey={f.key}
                  value={form[f.key]} onChange={set} />
              ))}
            </div>
          </div>

          {/* Overall Score */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '14px', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700' }}>Overall Score *</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {autoOverall ? 'Auto-calculated from skills above' : 'Manually set'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setAutoOverall(a => !a)}
                  style={{
                    fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)',
                    background: autoOverall ? 'var(--accent-soft)' : 'transparent',
                    color: autoOverall ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  {autoOverall ? 'Auto' : 'Manual'}
                </button>
                <span style={{ fontSize: '26px', fontWeight: '800', color: oColor, fontFamily: 'var(--font-mono)' }}>
                  {overall > 0 ? overall : '—'}
                  {overall > 0 && <span style={{ fontSize: '11px', fontWeight: '600', marginLeft: '6px' }}>— {scoreLabel(overall)}</span>}
                </span>
              </div>
            </div>
            {!autoOverall && (
              <>
                <input type="range" min="1" max="10" step="1" value={form.overall_score}
                  onChange={e => set('overall_score', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: oColor, cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <span key={n} style={{
                      fontSize: '10px', minWidth: '14px', textAlign: 'center',
                      color: n === parseInt(form.overall_score) ? oColor : 'var(--text-muted)',
                      fontWeight: n === parseInt(form.overall_score) ? '700' : '400',
                    }}>{n}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Text fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="label">Strengths</label>
              <textarea className="input" rows={2} placeholder="What did the intern do well?"
                value={form.strengths} onChange={e => set('strengths', e.target.value)}
                style={{ resize: 'vertical', minHeight: '64px', lineHeight: '1.6' }} />
            </div>
            <div>
              <label className="label">Areas for Improvement</label>
              <textarea className="input" rows={2} placeholder="What should the intern focus on improving?"
                value={form.improvement_areas} onChange={e => set('improvement_areas', e.target.value)}
                style={{ resize: 'vertical', minHeight: '64px', lineHeight: '1.6' }} />
            </div>
            <div>
              <label className="label">Mentor Feedback</label>
              <textarea className="input" rows={3} placeholder="Detailed mentor notes, context, and recommendations…"
                value={form.mentor_feedback} onChange={e => set('mentor_feedback', e.target.value)}
                style={{ resize: 'vertical', minHeight: '76px', lineHeight: '1.6' }} />
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: '10px', padding: '10px 14px', color: '#f87171', fontSize: '13px' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 26px 22px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Add Evaluation'}
          </button>
        </div>
      </div>
    </div>
  )
}


function RoleBadge({ role }) {
  const map = {
    admin:  { label: 'Admin · Full Access',          color: '#1a3aff', bg: '#e8eeff' },
    mentor: { label: 'Mentor · Your Interns Only',   color: '#1d4ed8', bg: '#dbeafe' },
    hr:     { label: 'HR · View Only',               color: '#2563eb', bg: '#eff6ff' },
    intern: { label: 'Intern · My Evaluations',      color: '#1e40af', bg: '#dbeafe' },
  }
  const cfg = map[role] ?? { label: role, color: 'var(--text-muted)', bg: 'var(--bg-input)' }
  return (
    <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  )
}


function EvaluationCard({ ev, canEdit, onEdit, showInternName }) {
  const [expanded, setExpanded] = useState(false)
  const hasSkills = SKILL_FIELDS.some(f => ev[f.key] > 0)
  const overall = ev.overall_score ?? ev.score ?? 0

  return (
    <div className="card animate-fadeUp" style={{ padding: '22px', position: 'relative' }}>
      {canEdit && (
        <button onClick={() => onEdit(ev)} className="btn-icon" title="Edit evaluation"
          style={{ position: 'absolute', top: '14px', right: '14px', width: '32px', height: '32px', borderRadius: '8px' }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}

      {showInternName && (
        <div style={{ marginBottom: '14px', paddingRight: canEdit ? '36px' : '0' }}>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>{ev.intern?.userByUserId?.name ?? '—'}</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{ev.intern?.department?.name ?? '—'}</p>
        </div>
      )}

      {/* Overall score */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Overall Score</p>
        <ScorePill score={overall} />
      </div>

      {ev.period && (
        <div style={{ marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '3px 9px', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}>
            {ev.period}
          </span>
        </div>
      )}

      {/* Skills preview — top 4 */}
      {hasSkills && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {SKILL_FIELDS.slice(0, 4).filter(f => ev[f.key] > 0).map(f => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label.split(' ')[0]}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: scoreColor(ev[f.key]), fontFamily: 'var(--font-mono)' }}>{ev[f.key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expand button */}
      {(hasSkills || ev.strengths || ev.improvement_areas || ev.mentor_feedback) && (
        <button
          onClick={() => setExpanded(x => !x)}
          style={{
            width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)', fontSize: '12px',
            cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}
        >
          {expanded ? 'Show less' : 'Show full evaluation'}
        </button>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {hasSkills && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Skill Breakdown</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <RadarChart ev={ev} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                {SKILL_FIELDS.filter(f => ev[f.key] > 0).map(f => (
                  <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1 }}>{f.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: scoreColor(ev[f.key]) }}>{ev[f.key]}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ev.strengths && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#1a3aff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Strengths</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{ev.strengths}</p>
            </div>
          )}

          {ev.improvement_areas && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Areas for Improvement</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{ev.improvement_areas}</p>
            </div>
          )}

          {ev.mentor_feedback && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Mentor Feedback</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{ev.mentor_feedback}</p>
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
        by {ev.user?.name ?? '—'} · {new Date(ev.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
// EvaluationsPage — main export
// ─────────────────────────────────────────────
export default function EvaluationsPage() {
  const { role, userId, canAdd, canEdit, isIntern } = useRole()

  const [evals, setEvals] = useState([])
  const [interns, setInterns] = useState([])
  const [evaluators, setEvaluators] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('cards')
  const [filterIntern, setFilter] = useState('all')

  const load = () => {
    setLoading(true)
    const base = fetch('/api/evaluations').then(r => r.json())
    const extra = canAdd
      ? Promise.all([
        fetch('/api/evaluations?type=interns').then(r => r.json()),
        fetch('/api/evaluations?type=evaluators').then(r => r.json()),
      ])
      : Promise.resolve([null, null])

    Promise.all([base, extra])
      .then(([evData, [iData, evalData]]) => {
        setEvals(evData?.evaluations ?? [])
        if (iData) setInterns(iData?.interns ?? [])
        if (evalData) setEvaluators(evalData?.users ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (role) load() }, [role])

  const avgOverall = evals.length
    ? (evals.reduce((s, e) => s + (e.overall_score ?? 0), 0) / evals.length).toFixed(1)
    : '—'
  const excellent = evals.filter(e => (e.overall_score ?? 0) >= 8).length
  const needsWork = evals.filter(e => (e.overall_score ?? 0) < 5 && (e.overall_score ?? 0) > 0).length

  const internNames = [...new Set(evals.map(e => e.intern?.userByUserId?.name).filter(Boolean))]
  const displayed = filterIntern === 'all'
    ? evals
    : evals.filter(e => e.intern?.userByUserId?.name === filterIntern)

  const openEdit = ev => setModal({
    mode: 'edit',
    initial: {
      id: ev.id,
      intern_id: ev.intern_id,
      evaluator_id: ev.evaluator_id ?? '',
      period: ev.period ?? '',
      technical_skill_score: ev.technical_skill_score ?? 0,
      problem_solving_score: ev.problem_solving_score ?? 0,
      communication_score: ev.communication_score ?? 0,
      teamwork_score: ev.teamwork_score ?? 0,
      initiative_score: ev.initiative_score ?? 0,
      time_management_score: ev.time_management_score ?? 0,
      learning_ability_score: ev.learning_ability_score ?? 0,
      ownership_score: ev.ownership_score ?? 0,
      overall_score: ev.overall_score ?? 7,
      strengths: ev.strengths ?? '',
      improvement_areas: ev.improvement_areas ?? '',
      mentor_feedback: ev.mentor_feedback ?? '',
    },
  })

  
  if (isIntern) {
    const myAvg = evals.length
      ? (evals.reduce((s, e) => s + (e.overall_score ?? 0), 0) / evals.length).toFixed(1)
      : '—'
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>My Evaluations</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              {loading ? '—' : `${evals.length} evaluation${evals.length !== 1 ? 's' : ''} · avg overall ${myAvg}`}
            </p>
          </div>
          <RoleBadge role="intern" />
        </div>

        {!loading && evals.length > 1 && <InternProgressChart evaluations={evals} />}

        {!loading && evals.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Total Evaluations', value: evals.length, color: 'var(--accent)' },
              { label: 'Avg Overall Score', value: myAvg, color: '#2563eb' },
              { label: 'Latest Score',       value: evals[0]?.overall_score ?? '—', color: '#1d4ed8' },
            ].map(s => (
              <div key={s.label} className="card animate-fadeUp" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '26px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
          {loading
            ? [1, 2, 3].map(i => <div key={i} className="skeleton card" style={{ height: '220px' }} />)
            : evals.length === 0
              ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '36px', marginBottom: '10px' }}></p>
                  <p style={{ fontSize: '14px' }}>No evaluations yet. Your mentor will add them here.</p>
                </div>
              )
              : evals.map(ev => (
                <EvaluationCard key={ev.id} ev={ev} canEdit={false} showInternName={false} />
              ))
          }
        </div>
      </div>
    )
  }


  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>Evaluations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {loading ? '—' : `${evals.length} total · avg overall score ${avgOverall}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <RoleBadge role={role} />
          {canAdd && (
            <button onClick={() => setModal('add')} className="btn-primary">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Evaluation
            </button>
          )}
          {role === 'hr' && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
               View only
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      {!loading && evals.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total Evaluations', value: evals.length, color: 'var(--accent)' },
            { label: 'Excellent  (≥ 8)',  value: excellent, color: '#1a3aff' },
            { label: 'Needs Work (< 5)',  value: needsWork, color: '#93c5fd' },
          ].map(s => (
            <div key={s.label} className="card animate-fadeUp" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '26px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          {['all', ...internNames].map(name => (
            <button key={name} onClick={() => setFilter(name)} style={{
              padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
              fontFamily: 'var(--font-body)', cursor: 'pointer', border: '1px solid',
              borderColor: filterIntern === name ? 'var(--accent)' : 'var(--border)',
              background: filterIntern === name ? 'var(--accent-soft)' : 'transparent',
              color: filterIntern === name ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>
              {name === 'all' ? 'All Interns' : name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
          {[{ key: 'cards', label: 'Cards' }, { key: 'chart', label: 'Chart' }].map(v => (
            <button key={v.key} onClick={() => setTab(v.key)} style={{
              padding: '6px 16px', borderRadius: '8px', fontSize: '13px',
              fontFamily: 'var(--font-body)', cursor: 'pointer', border: 'none',
              background: tab === v.key ? 'var(--bg-card)' : 'transparent',
              color: tab === v.key ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: tab === v.key ? '600' : '400',
              boxShadow: tab === v.key ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s',
            }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart view */}
      {tab === 'chart' && !loading && <ScoreOverviewChart evaluations={displayed} />}

      {/* Cards view */}
      {tab === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
          {loading
            ? [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton card" style={{ height: '220px' }} />)
            : displayed.length === 0
              ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '36px', marginBottom: '10px' }}></p>
                  <p style={{ fontSize: '14px' }}>No evaluations found.</p>
                </div>
              )
              : displayed.map(ev => (
                <EvaluationCard key={ev.id} ev={ev} canEdit={canEdit} onEdit={openEdit} showInternName={true} />
              ))
          }
        </div>
      )}

      {/* Modal */}
      {modal && canAdd && (
        <EvalModal
          mode={modal === 'add' ? 'add' : modal.mode}
          initial={modal !== 'add' ? modal.initial : undefined}
          interns={interns}
          evaluators={evaluators}
          userRole={role}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}