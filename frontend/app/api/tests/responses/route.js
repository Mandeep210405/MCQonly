// FILE: frontend/app/api/tests/responses/route.js
// Replaces the old file — MCQ only, intern_response is just a/b/c/d

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'

const GET_TEST_WITH_QUESTIONS = `
  query GetTestWithQuestions($session_id: uuid!) {
    ai_test_sessions_by_pk(id: $session_id) {
      id intern_id status duration_minutes
      intern { user { name } }
      test_questions(order_by: { question_number: asc }) {
        id question_number question_text difficulty options points
      }
    }
  }
`

// Upsert — saves or updates answer if intern changes their mind
const UPSERT_RESPONSES = `
  mutation UpsertResponses($objects: [test_responses_insert_input!]!) {
    insert_test_responses(
      objects: $objects
      on_conflict: {
        constraint: test_responses_session_id_question_id_key
        update_columns: [intern_response, submitted_at]
      }
    ) { affected_rows }
  }
`

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sessionId = new URL(req.url).searchParams.get('session_id')
    if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

    const data = await gqlFetch(GET_TEST_WITH_QUESTIONS, { session_id: sessionId })
    if (!data.ai_test_sessions_by_pk)
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })

    return NextResponse.json(data.ai_test_sessions_by_pk)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { session_id, responses } = await req.json()
    // responses: [{ question_id, intern_response }]
    if (!session_id || !Array.isArray(responses))
      return NextResponse.json({ error: 'session_id and responses[] required' }, { status: 400 })

    const objects = responses.map((r) => ({
      session_id,
      question_id: r.question_id,
      intern_response: r.intern_response, // "a", "b", "c", or "d"
      submitted_at: new Date().toISOString(),
    }))

    const result = await gqlFetch(UPSERT_RESPONSES, { objects })
    return NextResponse.json({ saved: result.insert_test_responses.affected_rows }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}