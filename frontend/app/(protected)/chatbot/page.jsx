"use client"

import { useEffect, useRef, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import DataTable from '@/components/chatbot/DataTable'

const ROLE_ALLOWLIST = new Set(['admin', 'mentor', 'hr'])
const HIDDEN_COLUMNS = new Set([
  'id',
  'user_id',
  'intern_id',
  'department_id',
  'mentor_id',
  'assigned_by',
  'created_at',
  'updated_at',
  'password',
  'password_hash',
  'api_key',
  'secret',
  'token',
])

function pickVisibleColumns(columns) {
  return columns.filter((col) => !HIDDEN_COLUMNS.has(col))
}

function formatAnswer(results, columns) {
  if (!results.length || !columns.length) return 'No results found for that query.'

  if (columns.length === 1) {
    const key = columns[0]
    const value = results[0]?.[key]
    return `Answer: ${value ?? 'No data'}.`
  }

  return `Found ${results.length} result(s).`
}

function detectSensitiveQuery(sql) {
  const sensitiveTables = ['users', 'password']
  const sensitiveColumns = ['password', 'password_hash', 'api_key', 'secret', 'token']
  
  const sqlLower = sql.toLowerCase()
  
  const hasSensitiveTable = sensitiveTables.some(table => sqlLower.includes(`${table}`))
  const hasSensitiveColumn = sensitiveColumns.some(col => sqlLower.includes(`${col}`))
  
  return hasSensitiveTable || hasSensitiveColumn
}

export default function ChatbotPage() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const canAccess = ROLE_ALLOWLIST.has(role)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, loading])

  const placeholder = useMemo(() => {
    if (role === 'admin') return 'Ask anything about interns, tasks, or departments...'
    return 'Ask about your department interns and stats...'
  }, [role])

  if (!canAccess) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,255,0.98) 100%)',
      }}>
        <div style={{
          borderRadius: '22px',
          background: 'rgba(255,255,255,0.98)',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(12, 22, 70, 0.18)',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'rgba(15, 26, 74, 1)',
            marginBottom: '8px',
          }}>Access Denied</h1>
          <p style={{
            color: 'rgba(44, 56, 110, 0.8)',
            fontSize: '14px',
          }}>Only Admins, Mentors, and HR can access the chatbot.</p>
        </div>
      </div>
    )
  }

  async function handleSend() {
    const question = input.trim()
    if (!question || loading) return

    setError('')
    setInput('')
    setLoading(true)

    const nextMessages = [
      ...messages,
      { id: crypto.randomUUID(), role: 'user', content: question },
    ]
    setMessages(nextMessages)

    try {
      const res = await fetch('/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Chatbot error')
      }

      setMessages([
        ...nextMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: formatAnswer(payload?.results || [], payload?.columns || []),
          results: payload?.results || [],
          columns: pickVisibleColumns(payload?.columns || []),
          sql: payload?.sql || '',
        },
      ])
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setMessages([
        ...nextMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${err.message}`,
          error: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  function handleClearChat() {
    setMessages([])
    setError('')
    setInput('')
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,255,0.98) 100%)',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(26,58,255,0.16), rgba(255,255,255,0.02))',
        borderBottom: '1px solid rgba(15, 26, 74, 0.08)',
      }}>
        <div>
          <div style={{
            fontWeight: 700,
            fontSize: '18px',
            letterSpacing: '0.02em',
            color: 'rgba(15, 26, 74, 1)',
          }}>InternHub AI Chat</div>
          <div style={{
            fontSize: '11px',
            color: 'rgba(44, 56, 110, 0.8)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: '4px',
          }}>
            Ask about interns, tasks, and stats
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleClearChat}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'rgba(12, 22, 70, 0.65)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 12px',
              fontSize: '13px',
            }}
          >
            Clear
          </button>
          <a
            href="/dashboard"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'rgba(12, 22, 70, 0.65)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 12px',
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            Back
          </a>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 20px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: 'radial-gradient(circle at top left, rgba(26,58,255,0.08), transparent 45%)',
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            flex: 1,
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'rgba(15, 26, 74, 1)',
              marginBottom: '8px',
            }}>Start Chatting</div>
            <p style={{
              maxWidth: '400px',
              color: 'rgba(44, 56, 110, 0.8)',
              fontSize: '14px',
              marginBottom: '24px',
            }}>
              Ask me anything about your interns, tasks, departments, and statistics. I&apos;ll query the database for you.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              maxWidth: '500px',
              width: '100%',
            }}>
              <button
                onClick={() => setInput('Show all interns')}
                style={{
                  border: '1px solid rgba(15, 26, 74, 0.12)',
                  background: 'rgba(255,255,255,0.92)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(15, 26, 74, 0.8)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(26,58,255,0.08)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.92)'}
              >
                Show all interns
              </button>
              <button
                onClick={() => setInput('Show all announcements')}
                style={{
                  border: '1px solid rgba(15, 26, 74, 0.12)',
                  background: 'rgba(255,255,255,0.92)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(15, 26, 74, 0.8)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(26,58,255,0.08)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.92)'}
              >
                Show announcements
              </button>
              <button
                onClick={() => setInput('How many interns per department?')}
                style={{
                  border: '1px solid rgba(15, 26, 74, 0.12)',
                  background: 'rgba(255,255,255,0.92)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(15, 26, 74, 0.8)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(26,58,255,0.08)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.92)'}
              >
                Interns per department
              </button>
              <button
                onClick={() => setInput('Show active interns')}
                style={{
                  border: '1px solid rgba(15, 26, 74, 0.12)',
                  background: 'rgba(255,255,255,0.92)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(15, 26, 74, 0.8)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(26,58,255,0.08)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.92)'}
              >
                Show active interns
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="chatbot-message" style={{ justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  className="chatbot-bubble"
                  style={msg.role === 'user' ? {
                    background: 'linear-gradient(135deg, #0f1f66, #3752ff)',
                    color: 'rgba(255, 255, 255, 0.95)',
                  } : msg.error ? {
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  } : {}}
                >
                  <p style={{ margin: '0 0 8px 0', color: msg.role === 'user' ? 'white' : 'inherit' }}>
                    {msg.content}
                  </p>

                  {/* Security Warning for Sensitive Queries */}
                  {msg.sql && !msg.error && detectSensitiveQuery(msg.sql) && (
                    <div style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      fontSize: '12px',
                      color: 'rgba(120, 53, 15, 0.8)',
                    }}>
                      ⚠️ Sensitive columns have been filtered for security
                    </div>
                  )}

                  {/* SQL Details */}
                  {msg.sql && !msg.error && (
                    <details className="chatbot-sql">
                      <summary>SQL</summary>
                      <pre>{msg.sql}</pre>
                    </details>
                  )}

                  {/* Results Table */}
                  {msg.columns?.length && !msg.error && (
                    <div style={{ marginTop: '12px', marginLeft: '-14px', marginRight: '-14px', paddingLeft: '14px', paddingRight: '14px' }}>
                      <DataTable
                        data={msg.results}
                        columns={msg.columns}
                        showSearch={false}
                        showPagination={msg.results.length > 10}
                        pageSize={10}
                        emptyMessage="No data found"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading State */}
            {loading && (
              <div className="chatbot-message">
                <div className="chatbot-bubble">
                  <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'rgba(26, 58, 255, 0.6)',
                      animation: 'bounce 1.4s ease infinite',
                    }} />
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'rgba(26, 58, 255, 0.6)',
                      animation: 'bounce 1.4s ease infinite 0.2s',
                    }} />
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'rgba(26, 58, 255, 0.6)',
                      animation: 'bounce 1.4s ease infinite 0.4s',
                    }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        borderTop: '1px solid rgba(15, 26, 74, 0.08)',
        padding: '14px 20px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,255,0.92) 100%)',
      }}>
        {error && (
          <div style={{
            marginBottom: '12px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '12px',
            color: 'rgba(239, 68, 68, 0.8)',
          }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={3}
            style={{
              flex: 1,
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 14,
              paddingRight: 14,
              borderRadius: '14px',
              border: '1px solid rgba(15, 26, 74, 0.12)',
              background: 'rgba(255,255,255,0.92)',
              color: 'rgba(15, 26, 74, 0.95)',
              fontSize: '13.5px',
              lineHeight: '1.4',
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'none',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(26, 58, 255, 0.4)'
              e.target.style.background = 'rgba(255,255,255,0.98)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(15, 26, 74, 0.12)'
              e.target.style.background = 'rgba(255,255,255,0.92)'
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              background: loading || !input.trim() ? 'rgba(26, 58, 255, 0.5)' : 'linear-gradient(135deg, #0b1b5a, #1a3aff)',
              color: 'white',
              border: 'none',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s ease',
              opacity: loading || !input.trim() ? 0.6 : 1,
            }}
          >
            Send
          </button>
        </div>
        <p style={{
          marginTop: '8px',
          fontSize: '11px',
          color: 'rgba(44, 56, 110, 0.7)',
          letterSpacing: '0.05em',
        }}>
          💡 Shift+Enter for new line, Enter to send
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
