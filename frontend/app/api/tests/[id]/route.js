// FILE: frontend/app/api/tests/[id]/route.js
// No changes needed — get/delete test by ID

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'

const GET_TEST_BY_ID = `
  query GetTestById($id: uuid!) {
    ai_test_sessions_by_pk(id: $id) {
      id intern_id conducted_by status scheduled_at started_at
      submitted_at completed_at duration_minutes created_at
      intern { user { name } }
      user { name }
    }
  }
`

const DELETE_TEST = `
  mutation DeleteTest($id: uuid!) {
    delete_ai_test_sessions_by_pk(id: $id) { id }
  }
`

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await gqlFetch(GET_TEST_BY_ID, { id: params.id })
    if (!data.ai_test_sessions_by_pk)
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })

    return NextResponse.json(data.ai_test_sessions_by_pk)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'admin')
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    await gqlFetch(DELETE_TEST, { id: params.id })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}