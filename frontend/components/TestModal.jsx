// FILE: frontend/components/TestModal.jsx
// Removed: test_type dropdown, topic field
// Removed: test_type from onSave payload (fixes Hasura "field not found" error)

'use client';

import { useState, useEffect } from 'react';

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export default function TestModal({ open, interns, departments, onClose, onSave, saving }) {
  const [selectedInterns,   setSelectedInterns]   = useState([]);
  const [selectAll,         setSelectAll]         = useState(false);
  const [questionCount,     setQuestionCount]     = useState(5);
  const [difficulty,        setDifficulty]        = useState('medium');
  const [scheduledDate,     setScheduledDate]     = useState('');
  const [scheduledTime,     setScheduledTime]     = useState('');
  const [duration,          setDuration]          = useState(30);
  const [selectionMode,     setSelectionMode]     = useState('individual'); // individual | department | all
  const [selectedDepartment,setSelectedDepartment]= useState('');

  // Reset form whenever modal closes
  useEffect(() => {
    if (!open) {
      setSelectedInterns([]);
      setSelectAll(false);
      setSelectionMode('individual');
      setSelectedDepartment('');
    }
  }, [open]);

  // ─── Intern selection helpers ─────────────────────────────────────────────

  const filteredInterns = selectionMode === 'department' && selectedDepartment
    ? interns.filter(i => i.department?.id === selectedDepartment)
    : interns;

  const toggleSelectAll = () => {
    if (selectAll) setSelectedInterns([]);
    else setSelectedInterns(interns.map(i => i.id));
    setSelectAll(!selectAll);
  };

  const toggleIntern = (id) => {
    setSelectedInterns(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedInterns.length === 0) { alert('Please select at least one intern'); return; }
    if (!scheduledDate || !scheduledTime) { alert('Please select date and time'); return; }

    onSave({
      intern_ids:       selectedInterns,
      scheduled_at:     `${scheduledDate} ${scheduledTime}:00`, // "YYYY-MM-DD HH:MM:SS"
      duration_minutes: duration,
      question_config: {
        count:      questionCount,
        difficulty: difficulty,
      },
    });
    // Note: test_type is NOT sent — it no longer exists in the schema
  };

  if (!open) return null;

  // ─── Render ───────────────────────────────────────────────────────────────

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
        className="card"
        style={{ width: '100%', maxWidth: '800px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700' }}>Schedule MCQ Test</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── Section 1: Test configuration ─────────────────────────────── */}
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Test Configuration</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <Field label="Number of Questions">
              <input
                type="number" className="input"
                value={questionCount}
                onChange={e => setQuestionCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                min={1} max={20}
              />
            </Field>

            <Field label="Difficulty">
              <select className="input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </Field>
          </div>

          {/* ── Section 2: Schedule ───────────────────────────────────────── */}
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', marginTop: '8px' }}>Schedule</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <Field label="Date">
              <input type="date" className="input" value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)} required />
            </Field>

            <Field label="Time (24-hour)">
              <input type="time" className="input" value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)} required step="60" />
            </Field>
          </div>

          <Field label="Duration">
            <select className="input" value={duration} onChange={e => setDuration(parseInt(e.target.value))}>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </Field>

          {/* ── Section 3: Select interns ─────────────────────────────────── */}
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', marginTop: '8px' }}>Select Interns</h3>

          {/* Selection mode buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            {['individual', 'department', 'all'].map(mode => (
              <button
                key={mode} type="button"
                className={selectionMode === mode ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => {
                  setSelectionMode(mode);
                  if (mode === 'all') setSelectedInterns(interns.map(i => i.id));
                }}
              >
                {mode === 'individual' ? 'Individual' : mode === 'department' ? 'By Department' : 'All Interns'}
              </button>
            ))}
          </div>

          {/* Department picker */}
          {selectionMode === 'department' && (
            <Field label="Department">
              <select className="input" value={selectedDepartment} onChange={e => {
                setSelectedDepartment(e.target.value);
                setSelectedInterns(interns.filter(i => i.department?.id === e.target.value).map(i => i.id));
              }}>
                <option value="">Select a department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          )}

          {/* Intern checklist */}
          {(selectionMode === 'individual' || (selectionMode === 'department' && selectedDepartment)) && (
            <div className="card" style={{ padding: '16px', maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
              {/* Select all row */}
              <div style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Select All ({filteredInterns.length})</span>
                </label>
              </div>
              {/* Intern rows */}
              {filteredInterns.map(intern => (
                <label key={intern.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedInterns.includes(intern.id)} onChange={() => toggleIntern(intern.id)} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '500' }}>{intern.userByUserId?.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{intern.department?.name || 'No department'}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* All interns confirmation */}
          {selectionMode === 'all' && (
            <div className="card" style={{ padding: '16px', background: 'var(--bg-blue-soft)', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--accent)' }}>
                ✓ Test will be scheduled for all {interns.length} interns
              </p>
            </div>
          )}

          {/* ── Footer buttons ────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Scheduling...' : `Schedule for ${selectedInterns.length} intern${selectedInterns.length !== 1 ? 's' : ''}`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}