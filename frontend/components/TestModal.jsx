'use client';

import { useState, useEffect } from 'react';

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label className="label">{label}</label>
      {hint && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', marginTop: '-4px' }}>{hint}</p>}
      {children}
    </div>
  );
}

export default function TestModal({ open, interns, departments, onClose, onSave, saving }) {
  const [selectedInterns, setSelectedInterns] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [testType, setTestType] = useState('mixed');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [topic, setTopic] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [selectionMode, setSelectionMode] = useState('individual'); // individual, department, all
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    if (!open) {
      // Reset form on close
      setSelectedInterns([]);
      setSelectAll(false);
      setSelectionMode('individual');
      setSelectedDepartment('');
    }
  }, [open]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedInterns([]);
    } else {
      setSelectedInterns(interns.map(i => i.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectIntern = (internId) => {
    if (selectedInterns.includes(internId)) {
      setSelectedInterns(selectedInterns.filter(id => id !== internId));
    } else {
      setSelectedInterns([...selectedInterns, internId]);
    }
  };

  const getFilteredInterns = () => {
    if (selectionMode === 'department' && selectedDepartment) {
      return interns.filter(i => i.department?.id === selectedDepartment);
    }
    return interns;
  };

  const filteredInterns = getFilteredInterns();

// In TestModal.jsx - handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (selectedInterns.length === 0) {
    alert('Please select at least one intern');
    return;
  }

  if (!scheduledDate || !scheduledTime) {
    alert('Please select date and time for the test');
    return;
  }

  // Format exactly as entered - NO conversion!
  // scheduledTime is already in 24-hour format like "14:30" or "22:09"
  const scheduledDateTime = `${scheduledDate} ${scheduledTime}:00`;
  
  console.log('Sending to API (no conversion):', {
    date: scheduledDate,
    time: scheduledTime,
    full: scheduledDateTime
  });

  onSave({
    intern_ids: selectedInterns,
    test_type: testType,
    scheduled_at: scheduledDateTime, // Send as "YYYY-MM-DD HH:MM:SS"
    duration_minutes: duration,
    question_config: {
      count: questionCount,
      difficulty: difficulty,
      topic: topic
    }
  });
};
  if (!open) return null;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700' }}>Schedule AI Test</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Test Configuration */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>Test Configuration</h3>
            
            <Field label="Test Type">
              <select className="input" value={testType} onChange={e => setTestType(e.target.value)}>
                <option value="mcq">MCQ Only</option>
                <option value="coding">Coding Only</option>
                <option value="descriptive">Descriptive Only</option>
                <option value="mixed">Mixed (All Types)</option>
              </select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Number of Questions">
                <input
                  type="number"
                  className="input"
                  value={questionCount}
                  onChange={e => setQuestionCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={20}
                />
              </Field>

              <Field label="Difficulty Level">
                <select className="input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </Field>
            </div>

            <Field label="Topic (optional)" hint="Leave empty for general questions">
              <input
                className="input"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., React, Python, Data Structures..."
              />
            </Field>
          </div>

          {/* Schedule */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>Schedule</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Date">
                <input
                  type="date"
                  className="input"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  required
                />
              </Field>

              <Field label="Time (24-hour format)">
                <input
                  type="time"
                  className="input"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  required
                  step="60" // Optional: removes seconds
                />
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Use 24-hour format (e.g., 14:30 for 2:30 PM)
                </p>
              </Field>
            </div>

            <Field label="Duration (minutes)">
              <select className="input" value={duration} onChange={e => setDuration(parseInt(e.target.value))}>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </Field>
          </div>

          {/* Select Interns */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>Select Interns</h3>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                type="button"
                className={selectionMode === 'individual' ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => setSelectionMode('individual')}
              >
                Individual
              </button>
              <button
                type="button"
                className={selectionMode === 'department' ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => setSelectionMode('department')}
              >
                By Department
              </button>
              <button
                type="button"
                className={selectionMode === 'all' ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => {
                  setSelectionMode('all');
                  setSelectedInterns(interns.map(i => i.id));
                }}
              >
                All Interns
              </button>
            </div>

            {selectionMode === 'department' && (
              <Field label="Select Department">
                <select className="input" value={selectedDepartment} onChange={e => {
                  setSelectedDepartment(e.target.value);
                  const deptInterns = interns.filter(i => i.department?.id === e.target.value);
                  setSelectedInterns(deptInterns.map(i => i.id));
                }}>
                  <option value="">Select a department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </Field>
            )}

            {(selectionMode === 'individual' || (selectionMode === 'department' && selectedDepartment)) && (
              <div className="card" style={{ padding: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                <div style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>Select All ({filteredInterns.length})</span>
                  </label>
                </div>
                {filteredInterns.map(intern => (
                  <label key={intern.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedInterns.includes(intern.id)}
                      onChange={() => handleSelectIntern(intern.id)}
                    />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '500' }}>{intern.userByUserId?.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{intern.department?.name || 'No department'}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {selectionMode === 'all' && (
              <div className="card" style={{ padding: '16px', background: 'var(--bg-blue-soft)' }}>
                <p style={{ fontSize: '13px', color: 'var(--accent)' }}>
                  ✓ Test will be scheduled for all {interns.length} interns
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Scheduling...' : `Schedule Test for ${selectedInterns.length} intern${selectedInterns.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
