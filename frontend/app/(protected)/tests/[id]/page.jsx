'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function TakingTestPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const sessionId = params?.id

  const [test, setTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [testStarted, setTestStarted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    fetchTest()
  }, [sessionId])

  const fetchTest = async () => {
    try {
      const res = await fetch(`/api/tests/responses?session_id=${sessionId}`)
      if (!res.ok) throw new Error('Failed to load test')

      const data = await res.json()
      setTest(data)

      // Initialize time (30 minutes = 1800 seconds)
      setTimeLeft(data.duration_minutes * 60 || 1800)

      // Load existing responses if any
      const existingRes = await fetch(`/api/tests/responses?session_id=${sessionId}`)
      if (existingRes.ok) {
        const responses = await existingRes.json()
        const responseMap = {}
        responses.forEach((r) => {
          responseMap[r.question_id] = r.intern_response
        })
        setResponses(responseMap)
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to load test')
    } finally {
      setLoading(false)
    }
  }

  // Timer countdown
  useEffect(() => {
    if (!testStarted || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Auto-submit
          handleSubmit()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [testStarted])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!testStarted) return

    const autoSaveTimer = setInterval(() => {
      saveResponses()
    }, 30000)

    return () => clearInterval(autoSaveTimer)
  }, [testStarted, responses])

  const saveResponses = useCallback(async () => {
    if (!sessionId || Object.keys(responses).length === 0) return

    try {
      const batch = Object.entries(responses).map(([questionId, response]) => ({
        question_id: questionId,
        intern_response: response,
      }))

      await fetch('/api/tests/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, batch_responses: batch }),
      })

      console.log('✅ Responses auto-saved')
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }, [sessionId, responses])

  const handleResponseChange = (questionId, value) => {
    setResponses({ ...responses, [questionId]: value })
  }

  const handleStartTest = async () => {
    try {
      await fetch('/api/tests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        }),
      })

      setTestStarted(true)
      toast.success('Test started!')
    } catch (err) {
      toast.error('Failed to start test')
    }
  }

  const handleSubmit = async () => {
    if (submitting) return

    setSubmitting(true)

    try {
      // Save all responses
      const batch = Object.entries(responses).map(([questionId, response]) => ({
        question_id: questionId,
        intern_response: response,
      }))

      await fetch('/api/tests/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, batch_responses: batch }),
      })

      // Update test status to submitted
      await fetch('/api/tests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        }),
      })

      toast.success('Test submitted! Your responses are being evaluated...')

      // Grade the test
      const gradeRes = await fetch('/api/tests/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })

      if (gradeRes.ok) {
        const result = await gradeRes.json()
        toast.success(`Test completed! Your grade: ${result.summary.grade}`)

        // Redirect to results
        setTimeout(() => {
          router.push(`/tests/results?session_id=${sessionId}`)
        }, 1000)
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to submit test')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p style={{ textAlign: 'center' }}>Loading test...</p>
  }

  if (!test || !test.test_questions || test.test_questions.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Test not found or not ready</p>
  }

  const question = test.test_questions[currentQuestion]
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const timeWarning = timeLeft < 300 // 5 minutes

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
            AI Test - Question {currentQuestion + 1}/{test.test_questions.length}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {test.test_type.toUpperCase()} • {test.duration_minutes} minutes
          </p>
        </div>

        <div
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: timeWarning ? '#ef4444' : 'var(--text-primary)',
            textAlign: 'center',
          }}
        >
          {formatTime(timeLeft)}
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Time Left
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Question */}
        <div
          style={{
            padding: '24px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          <h2 style={{ fontWeight: '600', marginBottom: '16px', fontSize: '16px' }}>
            {question.question_text}
          </h2>

          <div style={{ marginTop: '20px' }}>
            {question.question_type === 'mcq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {question.options &&
                  Object.entries(question.options).map(([key, option]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={question.id}
                        value={key}
                        checked={responses[question.id] === key}
                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
              </div>
            )}

            {(question.question_type === 'coding' || question.question_type === 'descriptive') && (
              <textarea
                value={responses[question.id] || ''}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                placeholder={question.question_type === 'coding' ? 'Write your code...' : 'Write your answer...'}
                style={{
                  width: '100%',
                  minHeight: '300px',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontFamily: question.question_type === 'coding' ? 'monospace' : 'inherit',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                }}
              />
            )}
          </div>

          {question.rubric && (
            <details style={{ marginTop: '16px', fontSize: '13px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
                📋 Grading Rubric
              </summary>
              <p
                style={{
                  padding: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '4px',
                  marginTop: '8px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {question.rubric}
              </p>
            </details>
          )}
        </div>

        {/* Navigation & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Question List */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>All Questions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {test.test_questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(idx)}
                  disabled={!testStarted}
                  style={{
                    padding: '8px',
                    border:
                      currentQuestion === idx
                        ? '2px solid var(--accent)'
                        : `1px solid ${responses[q.id] ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '4px',
                    backgroundColor:
                      currentQuestion === idx ? 'var(--accent)' : responses[q.id] ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                    color: currentQuestion === idx ? 'white' : 'var(--text-primary)',
                    fontWeight: '600',
                    fontSize: '12px',
                    cursor: testStarted ? 'pointer' : 'not-allowed',
                    opacity: testStarted ? 1 : 0.5,
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            <strong>Answered:</strong> {Object.keys(responses).length}/{test.test_questions.length}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!testStarted ? (
              <button
                onClick={handleStartTest}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Start Test ▶️
              </button>
            ) : (
              <>
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  style={{
                    padding: '8px',
                    backgroundColor: currentQuestion === 0 ? 'var(--border)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentQuestion === 0 ? 0.5 : 1,
                  }}
                >
                  ← Previous
                </button>

                <button
                  onClick={() => setCurrentQuestion(Math.min(test.test_questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === test.test_questions.length - 1}
                  style={{
                    padding: '8px',
                    backgroundColor:
                      currentQuestion === test.test_questions.length - 1 ? 'var(--border)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    cursor: currentQuestion === test.test_questions.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: currentQuestion === test.test_questions.length - 1 ? 0.5 : 1,
                  }}
                >
                  Next →
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    padding: '12px',
                    backgroundColor: submitting ? 'var(--border)' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Test ✓'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
