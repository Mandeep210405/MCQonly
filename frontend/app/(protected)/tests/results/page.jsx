'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function TestResultsPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('session_id')
  const internId = searchParams?.get('intern_id')

  const [results, setResults] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('results')

  useEffect(() => {
    fetchResults()
  }, [sessionId, internId])

  const fetchResults = async () => {
    try {
      let url = '/api/tests/results?'

      if (sessionId) {
        url += `session_id=${sessionId}`
      } else if (internId) {
        url += `intern_id=${internId}`
      } else {
        toast.error('No session or intern ID provided')
        setLoading(false)
        return
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch results')

      const data = await res.json()

      if (sessionId) {
        setResults(data[0] || null)
      } else {
        setResults(data)
      }

      // Fetch analytics if intern_id
      if (internId) {
        const analyticsRes = await fetch(`/api/tests/results?intern_id=${internId}&analytics=true`)
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json()
          setAnalytics(analyticsData)
        }
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <p style={{ textAlign: 'center' }}>Loading results...</p>
  }

  if (!results) {
    return <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No results found</p>
  }

  // Single result view
  if (sessionId && !Array.isArray(results)) {
    const result = results
    const detailedResults = result.detailed_results ? JSON.parse(result.detailed_results) : []

    const gradeColors = {
      A: '#22c55e',
      B: '#3b82f6',
      C: '#f59e0b',
      D: '#f97316',
      F: '#ef4444',
    }

    return (
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700', marginBottom: '24px' }}>
          Test Results
        </h1>

        {/* Score Card */}
        <div
          style={{
            padding: '32px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Overall Score
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <div
                style={{
                  fontSize: '64px',
                  fontWeight: '700',
                  color: gradeColors[result.grade] || '#666',
                  marginBottom: '8px',
                }}
              >
                {result.grade}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Grade</p>
            </div>

            <div>
              <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>
                {result.percentage}%
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                {result.obtained_points}/{result.total_points}
              </p>
            </div>

            <div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  marginBottom: '8px',
                }}
              >
                {result.ai_test_session?.intern?.user?.name}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Intern</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
              <span>Score Progress</span>
              <span>{result.obtained_points} points</span>
            </div>
            <div
              style={{
                height: '12px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${result.percentage}%`,
                  backgroundColor: gradeColors[result.grade] || '#666',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Feedback */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '6px',
              fontStyle: 'italic',
              color: 'var(--text-secondary)',
            }}
          >
            "{result.ai_feedback}"
          </div>
        </div>

        {/* Detailed Results */}
        <div
          style={{
            padding: '24px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          <h2 style={{ fontWeight: '600', marginBottom: '16px' }}>Question Breakdown</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {detailedResults.map((detail, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '6px',
                  border: `2px solid ${detail.obtained_points === detail.points ? '#22c55e' : '#ef4444'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>Q{detail.question_number}</strong>
                  <span
                    style={{
                      color: detail.obtained_points === detail.points ? '#22c55e' : '#ef4444',
                      fontWeight: '600',
                    }}
                  >
                    {detail.obtained_points}/{detail.points}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Type: <strong>{detail.question_type.toUpperCase()}</strong>
                </p>

                <p style={{ fontSize: '13px', fontStyle: 'italic' }}>{detail.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Multiple results / analytics view
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700', marginBottom: '24px' }}>
        Test Analytics
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        {['results', 'analytics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              borderBottom: activeTab === tab ? '3px solid var(--accent)' : 'none',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? '600' : '400',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'results' ? '📋 Results' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {activeTab === 'results' && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {Array.isArray(results) &&
            results.map((result) => (
              <div
                key={result.id}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {result.intern?.user?.name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Evaluated: {new Date(result.evaluated_at).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: result.grade === 'A' ? '#22c55e' : result.grade === 'B' ? '#3b82f6' : '#f59e0b',
                      }}
                    >
                      {result.grade}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {result.percentage}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div
            style={{
              padding: '20px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
              Total Tests
            </p>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>{analytics.total_tests}</div>
          </div>

          <div
            style={{
              padding: '20px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
              Average Score
            </p>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>{analytics.avg_percentage}%</div>
          </div>

          <div
            style={{
              padding: '20px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              gridColumn: '1 / -1',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
              Grade Distribution
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['A', 'B', 'C', 'D', 'F'].map((grade) => (
                <div key={grade} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                    {analytics.grade_distribution[grade] || 0}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Grade {grade}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
