'use client';

import { useState, useEffect } from 'react';

export default function TestTaker({ test, questions, responses, onSubmit, onClose }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testStarted, setTestStarted] = useState(false);

  // Load existing responses
  useEffect(() => {
    const initialAnswers = {};
    responses.forEach(r => {
      initialAnswers[r.question_id] = r.intern_response;
    });
    setAnswers(initialAnswers);
  }, [responses]);

  // Live timer that updates every second
  useEffect(() => {
    if (!test.scheduled_at) return;

    const scheduledAt = new Date(test.scheduled_at);
    const endTime = new Date(scheduledAt.getTime() + (test.duration_minutes || 30) * 60000);
    
    const updateTimer = () => {
      const now = new Date();
      
      // Check if test hasn't started yet
      if (now < scheduledAt) {
        const timeUntilStart = scheduledAt - now;
        const hours = Math.floor(timeUntilStart / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntilStart % (1000 * 60)) / 1000);
        setTimeLeft({ 
          status: 'not_started',
          hours, 
          minutes, 
          seconds,
          startTime: scheduledAt
        });
        setTestStarted(false);
        return;
      }
      
      // Test has started, check remaining time
      const remaining = endTime - now;
      
      if (remaining <= 0) {
        setTimeLeft({ status: 'expired', minutes: 0, seconds: 0 });
        // Auto-submit when time runs out
        if (Object.keys(answers).length > 0 && !submitting) {
          handleSubmit(true);
        }
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeLeft({ 
          status: 'in_progress',
          hours,
          minutes, 
          seconds,
          totalSeconds: Math.floor(remaining / 1000)
        });
        setTestStarted(true);
      }
    };

    // Update immediately
    updateTimer();
    
    // Update every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [test, answers, submitting]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !confirm('Are you sure you want to submit your test?')) return;
    
    setSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = questions[currentQuestion];
  const isAnswered = answers[currentQ?.id];

  // Format time display
  const formatTimeDisplay = () => {
    if (!timeLeft) return '--:--:--';
    
    if (timeLeft.status === 'not_started') {
      if (timeLeft.hours > 0) {
        return `${timeLeft.hours}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;
      }
      return `${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;
    }
    
    if (timeLeft.status === 'in_progress') {
      if (timeLeft.hours > 0) {
        return `${timeLeft.hours}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;
      }
      return `${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;
    }
    
    return '00:00:00';
  };

  const getTimeColor = () => {
    if (!timeLeft) return 'var(--text-primary)';
    
    if (timeLeft.status === 'not_started') {
      return 'var(--status-progress)';
    }
    
    if (timeLeft.status === 'in_progress') {
      if (timeLeft.minutes < 5) {
        return 'var(--status-terminated)';
      } else if (timeLeft.minutes < 10) {
        return 'var(--status-progress)';
      }
      return 'var(--status-active)';
    }
    
    return 'var(--status-terminated)';
  };

  const getTimeStatusText = () => {
    if (!timeLeft) return '';
    
    if (timeLeft.status === 'not_started') {
      const startTime = new Date(timeLeft.startTime);
      return `Starts at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
    
    if (timeLeft.status === 'in_progress') {
      return 'Time Remaining';
    }
    
    return 'Test Expired';
  };

  // Show waiting screen if test hasn't started
  if (timeLeft?.status === 'not_started') {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>⏰</div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
          Test Not Started Yet
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Your test is scheduled to start at:
        </p>
        <p style={{ fontSize: '20px', fontWeight: '600', marginBottom: '32px' }}>
          {new Date(test.scheduled_at).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })}
        </p>
        <div style={{ 
          fontSize: '48px', 
          fontWeight: '700', 
          fontFamily: 'monospace',
          color: 'var(--accent)',
          marginBottom: '32px'
        }}>
          {formatTimeDisplay()}
        </div>
        <button className="btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  // Show expired screen
  if (timeLeft?.status === 'expired') {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>⌛</div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
          Test Time Expired
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          The time allocated for this test has ended.
        </p>
        <button className="btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  // Main test interface
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '500px' }}>
      {/* Sidebar - Question Navigation */}
      <div className="card" style={{ width: '280px', marginRight: '20px', padding: '20px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {getTimeStatusText()}
          </p>
          <p style={{ 
            fontFamily: 'monospace', 
            fontSize: '28px', 
            fontWeight: '700', 
            color: getTimeColor(),
            letterSpacing: '2px'
          }}>
            {formatTimeDisplay()}
          </p>
          {testStarted && timeLeft?.totalSeconds && (
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Total: {Math.floor(timeLeft.totalSeconds / 60)} minutes
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(idx)}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: currentQuestion === idx ? 'var(--accent)' : answers[q.id] ? 'var(--status-active)' : 'var(--border)',
                background: currentQuestion === idx ? 'rgba(26,58,255,0.1)' : 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: answers[q.id] ? '600' : '400'
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          className="btn-primary"
          onClick={() => handleSubmit()}
          disabled={submitting}
          style={{ width: '100%' }}
        >
          {submitting ? 'Submitting...' : 'Submit Test'}
        </button>
      </div>

      {/* Main Content - Current Question */}
      <div className="card" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {currentQ && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge" style={{
                  background: currentQ.difficulty === 'easy' ? 'rgba(34,197,94,0.12)' : 
                              currentQ.difficulty === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                  color: currentQ.difficulty === 'easy' ? '#22c55e' : 
                         currentQ.difficulty === 'medium' ? '#f59e0b' : '#ef4444'
                }}>
                  {currentQ.difficulty?.toUpperCase()} · {currentQ.points} points
                </span>
                <span className="badge" style={{ background: 'var(--bg-input)' }}>
                  {currentQ.question_type?.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '16px', fontWeight: '500', lineHeight: '1.6', marginBottom: '16px' }}>
                {currentQ.question_number}. {currentQ.question_text}
              </p>
            </div>


{currentQ.options && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {(() => {
      // Parse options if it's a string, otherwise use as is
      let optionsObj = currentQ.options;
      if (typeof currentQ.options === 'string') {
        try {
          optionsObj = JSON.parse(currentQ.options);
        } catch (e) {
          console.error('Failed to parse options:', e);
          optionsObj = {};
        }
      }
      
      // Handle both array and object formats
      let optionsList = [];
      if (Array.isArray(optionsObj)) {
        optionsList = optionsObj;
      } else if (typeof optionsObj === 'object') {
        optionsList = Object.entries(optionsObj);
      }
      
      return optionsList.map(([key, value]) => {
        // Handle different option formats
        let optionKey = key;
        let optionValue = value;
        
        // If it's an array entry without key, use index as key
        if (typeof key === 'number') {
          optionKey = String.fromCharCode(97 + key); // a, b, c, d
          optionValue = value;
        }
        
        // Clean up the value (remove quotes if they exist)
        if (typeof optionValue === 'string') {
          optionValue = optionValue.replace(/^["']|["']$/g, '');
        }
        
        return (
          <label 
            key={optionKey} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid var(--border)', 
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: answers[currentQ.id] === optionKey ? 'rgba(26,58,255,0.08)' : 'transparent',
              borderColor: answers[currentQ.id] === optionKey ? 'var(--accent)' : 'var(--border)'
            }}
          >
            <input
              type="radio"
              name={`question_${currentQ.id}`}
              value={optionKey}
              checked={answers[currentQ.id] === optionKey}
              onChange={() => handleAnswerChange(currentQ.id, optionKey)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontWeight: '600', minWidth: '24px' }}>{optionKey.toUpperCase()}.</span>
            <span style={{ fontSize: '14px', lineHeight: '1.5', flex: 1 }}>{optionValue}</span>
          </label>
        );
      });
    })()}
  </div>
)}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <button
                className="btn-ghost"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                ← Previous
              </button>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '12px' }}>
                  {Object.keys(answers).length} of {questions.length} answered
                </span>
                {currentQuestion === questions.length - 1 ? (
                  <button className="btn-primary" onClick={() => handleSubmit()} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Test'}
                  </button>
                ) : (
                  <button className="btn-primary" onClick={() => setCurrentQuestion(currentQuestion + 1)}>
                    Next →
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}