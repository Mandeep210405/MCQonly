import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'

const GET_TEST_WITH_QUESTIONS = `
  query GetTestWithQuestions($session_id: uuid!) {
    ai_test_sessions_by_pk(id: $session_id) {
      id intern_id conducted_by status test_type scheduled_at started_at 
      submitted_at completed_at duration_minutes created_at
      intern { user { name } }
      test_questions(order_by: { question_number: asc }) {
        id question_number question_text question_type difficulty options
        correct_answer expected_output rubric points
      }
    }
  }
`

const INSERT_RESPONSE = `
  mutation InsertResponse(
    $session_id: uuid!
    $question_id: uuid!
    $intern_response: String!
  ) {
    insert_test_responses_one(
      object: {
        session_id: $session_id
        question_id: $question_id
        intern_response: $intern_response
      }
      on_conflict: {
        constraint: test_responses_session_id_question_id_key
        update_columns: [intern_response, submitted_at]
      }
    ) {
      id session_id question_id intern_response submitted_at
    }
  }
`

const INSERT_RESPONSES_BATCH = `
  mutation InsertResponsesBatch($objects: [test_responses_insert_input!]!) {
    insert_test_responses(
      objects: $objects
      on_conflict: {
        constraint: test_responses_session_id_question_id_key
        update_columns: [intern_response, submitted_at]
      }
    ) {
      affected_rows
    }
  }
`

const GET_TEST_RESPONSES = `
  query GetTestResponses($session_id: uuid!) {
    test_responses(where: { session_id: { _eq: $session_id } }) {
      id session_id question_id intern_response submitted_at
      test_question {
        question_number question_text question_type correct_answer
      }
    }
  }
`

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id query parameter required' },
        { status: 400 }
      )
    }

    const data = await gqlFetch(GET_TEST_WITH_QUESTIONS, { session_id: sessionId })

    if (!data.ai_test_sessions_by_pk) {
      return NextResponse.json({ error: 'Test session not found' }, { status: 404 })
    }

    return NextResponse.json(data.ai_test_sessions_by_pk)
  } catch (err) {
    console.error('❌ Error fetching test with questions:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session_id, question_id, intern_response, batch_responses } = await req.json()

    // Single response
    if (question_id && intern_response !== undefined) {
      const result = await gqlFetch(INSERT_RESPONSE, {
        session_id,
        question_id,
        intern_response,
      })
      return NextResponse.json(result.insert_test_responses_one, { status: 201 })
    }

    // Batch responses (auto-save all responses)
    if (batch_responses && Array.isArray(batch_responses)) {
      const objects = batch_responses.map((r) => ({
        session_id,
        question_id: r.question_id,
        intern_response: r.intern_response,
        submitted_at: new Date().toISOString(),
      }))

      const result = await gqlFetch(INSERT_RESPONSES_BATCH, { objects })
      return NextResponse.json(
        { message: `Saved ${result.insert_test_responses.affected_rows} responses` },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { error: 'Provide either question_id+intern_response or batch_responses' },
      { status: 400 }
    )
  } catch (err) {
    console.error('❌ Error saving response:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
