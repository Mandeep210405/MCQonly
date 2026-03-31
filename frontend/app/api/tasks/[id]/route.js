import { NextResponse } from 'next/server'
import { gqlFetch } from '@/lib/graphql-client'
import { requireAuth } from '@/lib/middleware/RequireRole'

const UPDATE_TASK = `
  mutation UpdateTask($id: uuid!, $set: tasks_set_input!) {
    update_tasks_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
    }
  }
`

const DELETE_TASK = `
  mutation DeleteTask($id: uuid!) {
    delete_tasks_by_pk(id: $id) {
      id
    }
  }
`

export async function PUT(req, context) {
  const session = await requireAuth(req, ["admin", "manager", "intern", "mentor"])
  if (!session) return NextResponse.json({ error: "Unauthorized", ok: false }, { status: 401 })

  try {
    const params = await context.params;
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing ID", ok: false }, { status: 400 })

    const body = await req.json()
    let payload = {}

    if (session.user.role === "intern") {
      // Interns can only update the status
      if (body.status !== undefined) payload.status = body.status;
    } else {
      if (body.title !== undefined) payload.title = body.title;
      if (body.description !== undefined) payload.description = body.description;
      if (body.status !== undefined) payload.status = body.status;
      if (body.priority !== undefined) payload.priority = body.priority;
      if (body.due_date !== undefined) payload.due_date = body.due_date;
      if (body.intern_id !== undefined) payload.intern_id = body.intern_id;
      if (body.assigned_id !== undefined) payload.assigned_id = body.assigned_id;
    }

    // Do not attempt update if payload is empty
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No valid fields to update", ok: false }, { status: 400 })
    }

    const data = await gqlFetch(UPDATE_TASK, { id, set: payload })

    return NextResponse.json({ success: true, data: data.update_tasks_by_pk }, { status: 200 })
  } catch (error) {
    console.error('Tasks PUT error:', error.message)
    return NextResponse.json({ error: error.message, ok: false }, { status: 500 })
  }
}

export async function DELETE(req, context) {
  const session = await requireAuth(req, ["admin", "manager", "mentor"])
  if (!session) return NextResponse.json({ error: "Unauthorized", ok: false }, { status: 401 })

  try {
    const params = await context.params;
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing ID", ok: false }, { status: 400 })

    const data = await gqlFetch(DELETE_TASK, { id })

    return NextResponse.json({ success: true, data: data.delete_tasks_by_pk }, { status: 200 })
  } catch (error) {
    console.error('Tasks DELETE error:', error.message)
    return NextResponse.json({ error: error.message, ok: false }, { status: 500 })
  }
}
