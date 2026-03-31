'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ConductTestPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    intern_id: '',
    test_type: 'mixed',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchInterns()
  }, [])

  const fetchInterns = async () => {
    try {
      const res = await fetch(`/api/interns`)
      if (!res.ok) throw new Error('Failed to fetch interns')

      const data = await res.json()
      setInterns(data?.interns || [])
    } catch (err) {
      console.error('Error fetching interns:', err)
      toast.error('Failed to load interns')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.intern_id) {
      toast.error('Please select an intern')
      return
    }

    setCreating(true)

    try {
      // Create test session
      const sessionRes = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intern_id: formData.intern_id,
          test_type: formData.test_type,
          scheduled_at: new Date().toISOString(),
        }),
      })

      if (!sessionRes.ok) {
        const error = await sessionRes.json()
        throw new Error(error.error || 'Failed to create test')
      }

      const testSession = await sessionRes.json()

      toast.success('Test created! Generating questions...')

      // Generate questions
      const genRes = await fetch('/api/tests/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: testSession.id,
          intern_id: formData.intern_id,
          test_type: formData.test_type,
          num_questions: 10,
        }),
      })

      if (!genRes.ok) {
        const error = await genRes.json()
        throw new Error(error.error || 'Failed to generate questions')
      }

      await genRes.json()

      toast.success('Questions generated! Ready to start test.')

      // Redirect to test taking page
      router.push(`/tests/${testSession.id}`)
    } catch (err) {
      console.error('Error:', err)
      toast.error(err.message || 'Failed to conduct test')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700', marginBottom: '24px' }}>
        Conduct AI Test
      </h1>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Select Intern */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Select Intern *
            </label>
            <select
              value={formData.intern_id}
              onChange={(e) => setFormData({ ...formData, intern_id: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">-- Choose an intern --</option>
              {interns.map((intern) => (
                <option key={intern.id} value={intern.id}>
                  {intern.userByUserId?.name} ({intern.position_title})
                </option>
              ))}
            </select>
          </div>

          {/* Test Type */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px' }}>
              Test Type *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {['mixed', 'mcq', 'coding', 'descriptive'].map((type) => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="test_type"
                    value={type}
                    checked={formData.test_type === type}
                    onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{type}</span>
                </label>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              📝 Mixed: 50% MCQ, 30% Coding, 20% Descriptive
            </p>
          </div>

          {/* Info Box */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '6px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            ⏱️ <strong>Test Details:</strong> 10 questions, 30 minutes, auto-save every 30 seconds, auto-submit when time expires.
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={creating || !formData.intern_id}
            style={{
              padding: '12px 24px',
              backgroundColor: creating ? 'var(--border)' : 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: creating || !formData.intern_id ? 'not-allowed' : 'pointer',
              opacity: creating || !formData.intern_id ? 0.6 : 1,
            }}
          >
            {creating ? 'Creating Test...' : 'Create & Generate Questions'}
          </button>
        </form>
      )}
    </div>
  )
}
