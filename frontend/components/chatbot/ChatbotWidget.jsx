"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import DataTable from './DataTable'

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

export default function ChatbotWidget() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const canAccess = ROLE_ALLOWLIST.has(role)

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (!open || !listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [open, messages, loading])

  const placeholder = useMemo(() => {
    if (role === 'admin') return 'Ask anything about interns, tasks, or departments...'
    return 'Ask about your department interns and stats...'
  }, [role])

  if (!canAccess) return null

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

  return (
    <div className="chatbot-root">
      {!open && (
        <button className="chatbot-fab" onClick={() => setOpen(true)} type="button">
          <span className="chatbot-fab-dot" />
          AI
        </button>
      )}

      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div>
              <div className="chatbot-title">InternHub AI</div>
              <div className="chatbot-subtitle">Ask about interns, tasks, and stats</div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)} type="button">
              Close
            </button>
          </div>

          <div className="chatbot-messages" ref={listRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-message ${msg.role}`}>
                <div className="chatbot-bubble">
                  <p>{msg.content}</p>
                  
                  {/* Security Warning for Sensitive Queries */}
                  {msg.sql && !msg.error && detectSensitiveQuery(msg.sql) && (
                    <div style={{
                      marginTop: '8px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'rgba(251, 191, 36, 0.12)',
                      border: '1px solid rgba(251, 191, 36, 0.25)',
                      fontSize: '11px',
                      color: 'rgba(120, 53, 15, 0.85)',
                    }}>
                      ⚠️ Sensitive columns filtered
                    </div>
                  )}
                  
                  {msg.sql ? (
                    <details className="chatbot-sql">
                      <summary>SQL</summary>
                      <pre>{msg.sql}</pre>
                    </details>
                  ) : null}
                  {msg.columns?.length ? (
                    <div className="mt-4 -mx-4 px-4">
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
                  ) : null}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-message assistant">
                <div className="chatbot-bubble">Thinking...</div>
              </div>
            )}
          </div>

          {error ? <div className="chatbot-error">{error}</div> : null}

          <div className="chatbot-input">
            <textarea
              className="chatbot-textarea"
              rows={2}
              placeholder={placeholder}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="chatbot-send" onClick={handleSend} type="button" disabled={loading}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
