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
      id intern_id conducted_by status test_type scheduled_at started_at 
      submitted_at completed_at duration_minutes created_at
      intern { user { name } }
      user { name }
    }
  }
`

const CREATE_TEST_SESSION = `
  mutation CreateTestSession(
    $intern_id: uuid!
    $conducted_by: uuid!
    $test_type: String!
    $scheduled_at: timestamp
  ) {
    insert_ai_test_sessions_one(object: {
      intern_id: $intern_id
      conducted_by: $conducted_by
      test_type: $test_type
      scheduled_at: $scheduled_at
      status: "scheduled"
    }) {
      id intern_id conducted_by status test_type scheduled_at created_at
    }
  }
`

const UPDATE_TEST_SESSION = `
  mutation UpdateTestSession(
    $id: uuid!
    $status: String!
    $started_at: timestamp
    $submitted_at: timestamp
    $completed_at: timestamp
  ) {
    update_ai_test_sessions_by_pk(
      pk_columns: { id: $id }
      _set: {
        status: $status
        started_at: $started_at
        submitted_at: $submitted_at
        completed_at: $completed_at
      }
    ) {
      id status started_at submitted_at completed_at
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
    const internId = searchParams.get('intern_id')
    const conductedBy = searchParams.get('conducted_by')

    const data = await gqlFetch(GET_TEST_SESSIONS, {
      intern_id: internId,
      conducted_by: conductedBy,
    })

    return NextResponse.json(data.ai_test_sessions)
  } catch (err) {
    console.error('❌ Error fetching test sessions:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Role-based access: only admin, hr, mentor can create tests
    if (!['admin', 'hr', 'mentor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { intern_id, test_type, scheduled_at } = await req.json()

    if (!intern_id || !test_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For mentors: verify they're assigned to this intern
    if (session.user.role === 'mentor') {
      const mentorCheck = await gqlFetch(
        `
        query CheckMentor($intern_id: uuid!, $mentor_id: uuid!) {
          interns(where: { id: { _eq: $intern_id }, mentor_id: { _eq: $mentor_id } }) {
            id
          }
        }
        `,
        { intern_id, mentor_id: session.user.id }
      )

      if (!mentorCheck.interns.length) {
        return NextResponse.json(
          { error: 'You are not assigned to this intern' },
          { status: 403 }
        )
      }
    }

    const data = await gqlFetch(CREATE_TEST_SESSION, {
      intern_id,
      conducted_by: session.user.id,
      test_type,
      scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
    })

    return NextResponse.json(data.insert_ai_test_sessions_one, { status: 201 })
  } catch (err) {
    console.error('❌ Error creating test session:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status, started_at, submitted_at, completed_at } = await req.json()

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const data = await gqlFetch(UPDATE_TEST_SESSION, {
      id,
      status,
      started_at: started_at ? new Date(started_at).toISOString() : null,
      submitted_at: submitted_at ? new Date(submitted_at).toISOString() : null,
      completed_at: completed_at ? new Date(completed_at).toISOString() : null,
    })

    return NextResponse.json(data.update_ai_test_sessions_by_pk)
  } catch (err) {
    console.error('❌ Error updating test session:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
