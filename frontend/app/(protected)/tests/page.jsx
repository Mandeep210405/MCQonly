'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Eye, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TestsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const canManage = ['admin', 'hr', 'mentor'].includes(session?.user?.role)

  useEffect(() => {
    if (!session) return
    fetchTests()
  }, [session])

  const fetchTests = async () => {
    try {
      const query = canManage
        ? `?conducted_by=${session.user.id}`
        : `?intern_id=${session.user.id}`

      const res = await fetch(`/api/tests${query}`)
      if (!res.ok) throw new Error('Failed to fetch tests')

      const data = await res.json()
      setTests(data || [])
    } catch (err) {
      console.error('Error fetching tests:', err)
      toast.error('Failed to load tests')
    } finally {
      setLoading(false)
    }
  }

  const deleteTest = async (testId) => {
    if (!confirm('Are you sure? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/tests/${testId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')

      toast.success('Test deleted')
      setTests(tests.filter((t) => t.id !== testId))
    } catch (err) {
      toast.error('Failed to delete test')
    }
  }

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    submitted: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>AI Tests</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Total: {tests.length} test{tests.length !== 1 ? 's' : ''}
          </p>
        </div>

        {canManage && (
          <Link
            href="/tests/conduct"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: 'var(--accent)',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            <Plus size={18} />
            Conduct Test
          </Link>
        )}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</p>
      ) : tests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <p>No tests yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {tests.map((test) => (
            <div
              key={test.id}
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
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {test.intern?.user?.name}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
                  Conducted by: {test.user?.name} • Type: {test.test_type}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    ...(() => {
                      const color = statusColors[test.status] || 'bg-gray-100 text-gray-800'
                      return color.includes('bg-') ? {} : {}
                    })(),
                    backgroundColor: statusColors[test.status]?.split(' ')[0] || 'bg-gray-100',
                    color: statusColors[test.status]?.split(' ')[1] || 'text-gray-800',
                  }}
                >
                  {test.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {test.status === 'completed' && (
                  <button
                    onClick={() => router.push(`/tests/results?session_id=${test.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    <Eye size={16} />
                    View Result
                  </button>
                )}

                {session?.user?.role === 'admin' && (
                  <button
                    onClick={() => deleteTest(test.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      backgroundColor: 'rgba(239,68,68,0.1)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: '13px',
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
