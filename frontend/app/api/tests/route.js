// FILE: frontend/app/api/tests/route.js
// Replaces the old file — removed test_type field (MCQ only now)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'

const GET_TEST_SESSIONS = `
  query GetTestSessions($intern_id: uuid, $conducted_by: uuid) {
    ai_test_sessions(
      order_by: { created_at: desc }
      where: {
        _and: [
          { intern_id: { _eq: $intern_id } }
          { conducted_by: { _eq: $conducted_by } }
        ]
      }
    ) {
      id intern_id conducted_by status scheduled_at started_at
      submitted_at completed_at duration_minutes created_at
      intern { user { name } }
      user { name }
    }
  }
`

const CREATE_TEST_SESSION = `
  mutation CreateTestSession(
    $intern_id: uuid! $conducted_by: uuid! $scheduled_at: timestamp
  ) {
    insert_ai_test_sessions_one(object: {
      intern_id: $intern_id
      conducted_by: $conducted_by
      scheduled_at: $scheduled_at
      status: "scheduled"
    }) {
      id intern_id conducted_by status scheduled_at created_at
    }
  }
`

const UPDATE_TEST_SESSION = `
  mutation UpdateTestSession(
    $id: uuid! $status: String!
    $started_at: timestamp $submitted_at: timestamp
  ) {
    update_ai_test_sessions_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status started_at: $started_at submitted_at: $submitted_at }
    ) { id status started_at submitted_at }
  }
`

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const data = await gqlFetch(GET_TEST_SESSIONS, {
      intern_id: searchParams.get('intern_id'),
      conducted_by: searchParams.get('conducted_by'),
    })
    return NextResponse.json(data.ai_test_sessions)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['admin', 'hr', 'mentor'].includes(session.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { intern_id, scheduled_at } = await req.json()
    if (!intern_id) return NextResponse.json({ error: 'intern_id required' }, { status: 400 })

    // Mentors can only test their assigned interns
    if (session.user.role === 'mentor') {
      const check = await gqlFetch(
        `query Check($intern_id: uuid!, $mentor_id: uuid!) {
          interns(where: { id: { _eq: $intern_id }, mentor_id: { _eq: $mentor_id } }) { id }
        }`,
        { intern_id, mentor_id: session.user.id }
      )
      if (!check.interns.length)
        return NextResponse.json({ error: 'Not your assigned intern' }, { status: 403 })
    }

    const data = await gqlFetch(CREATE_TEST_SESSION, {
      intern_id,
      conducted_by: session.user.id,
      scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
    })
    return NextResponse.json(data.insert_ai_test_sessions_one, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, status, started_at, submitted_at } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

    const data = await gqlFetch(UPDATE_TEST_SESSION, {
      id, status,
      started_at: started_at ? new Date(started_at).toISOString() : null,
      submitted_at: submitted_at ? new Date(submitted_at).toISOString() : null,
    })
    return NextResponse.json(data.update_ai_test_sessions_by_pk)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}