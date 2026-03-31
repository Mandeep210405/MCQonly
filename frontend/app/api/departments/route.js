import { NextResponse } from 'next/server'
import { gqlFetch } from '@/lib/graphql-client'
import { requireAuth } from '@/lib/middleware/RequireRole'

// ── Queries ──────────────────────────────────────────────────────────────────

const GET_DEPARTMENTS = `
  query GetDepartments {
    departments(order_by: { name: asc }) {
      id
      name
      description
      head_user_id
      created_at
      user {
        id
        name
        email
        role
      }
      interns_aggregate {
        aggregate { count }
      }
    }
  }
`

const CREATE_DEPARTMENT = `
  mutation CreateDepartment($name: String!, $description: String, $head_user_id: uuid) {
    insert_departments_one(object: {
      name: $name
      description: $description
      head_user_id: $head_user_id
    }) {
      id name description
      user { id name role }
    }
  }
`

const UPDATE_DEPARTMENT = `
  mutation UpdateDepartment($id: uuid!, $name: String!, $description: String, $head_user_id: uuid) {
    update_departments_by_pk(
      pk_columns: { id: $id }
      _set: { name: $name, description: $description, head_user_id: $head_user_id }
    ) {
      id name description
      user { id name role }
    }
  }
`

const DELETE_DEPARTMENT = `
  mutation DeleteDepartment($id: uuid!) {
    delete_departments_by_pk(id: $id) { id }
  }
`

// ── Handlers ─────────────────────────────────────────────────────────────────

// export async function GET(req) {
//   const session = await requireAuth(req, ['admin', 'hr', 'mentor'])
//   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//   try {
//     const data = await gqlFetch(GET_DEPARTMENTS)
//     return NextResponse.json(data ?? { departments: [] })
//   } catch (error) {
//     console.error('[departments GET]', error.message)
//     return NextResponse.json({ departments: [] })
//   }
// }
export async function GET(req) {
  const session = await requireAuth(req, ['admin', 'hr', 'mentor'])
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const data = await gqlFetch(GET_DEPARTMENTS)
    return NextResponse.json({ 
      data: data ?? { departments: [] }  // Wrap in 'data' property
    })
  } catch (error) {
    console.error('[departments GET]', error.message)
    return NextResponse.json({ data: { departments: [] } })  // Also wrap error response
  }
}

export async function POST(req) {
  const session = await requireAuth(req, ['admin','hr'])
  if (!session) return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 401 })
  try {
    const { name, description, head_user_id } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    const data = await gqlFetch(CREATE_DEPARTMENT, {
      name: name.trim(),
      description: description?.trim() || null,
      head_user_id: head_user_id || null,
    })
    return NextResponse.json({ ok: true, department: data.insert_departments_one }, { status: 201 })
  } catch (error) {
    console.error('[departments POST]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req) {
  const session = await requireAuth(req, ['admin','hr'])
  if (!session) return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 401 })
  try {
    const { id, name, description, head_user_id } = await req.json()
    if (!id || !name?.trim()) return NextResponse.json({ error: 'id and name required' }, { status: 400 })
    const data = await gqlFetch(UPDATE_DEPARTMENT, {
      id,
      name: name.trim(),
      description: description?.trim() || null,
      head_user_id: head_user_id || null,
    })
    return NextResponse.json({ ok: true, department: data.update_departments_by_pk })
  } catch (error) {
    console.error('[departments PATCH]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  const session = await requireAuth(req, ['admin','hr'])
  if (!session) return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 401 })
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await gqlFetch(DELETE_DEPARTMENT, { id })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[departments DELETE]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}