import { NextResponse } from 'next/server'
import { gqlFetch } from '@/lib/graphql-client'
import { requireAuth } from '@/lib/middleware/RequireRole'

const GET_TASKS = `
  query GetTasks($where: tasks_bool_exp!) {
    tasks(order_by: { created_at: desc }, where: $where) {
      id title description status priority due_date created_at
      intern { 
        id
        department { name }
        userByUserId { name email } 
      }
    }
  }
`

export async function GET(req) {
  const session = await requireAuth(req, ["admin", "manager", "intern", "mentor"])
  if (!session) return NextResponse.json({ error: "Unauthorized", ok: false }, { status: 401 })

  try {
    let where = {}
    if (session.user.role === "manager" || session.user.role === "mentor") {
      where = {
        intern: {
          _or: [
            { department: { head_user_id: { _eq: session.user.id } } },
            { mentor_id: { _eq: session.user.id } }
          ]
        }
      }
    } else if (session.user.role === "intern") {
      where = { intern: { user_id: { _eq: session.user.id } } }
    }

    const data = await gqlFetch(GET_TASKS, { where })
    return NextResponse.json(data ?? { tasks: [] })
  } catch (error) {
    console.error('Tasks GET error:', error.message)
    return NextResponse.json({ tasks: [] }, { status: 200 })
  }
}

const CREATE_TASK = `
  mutation CreateTask(
    $title: String!, 
    $description: String, 
    $status: String!, 
    $priority: String!, 
    $due_date: date, 
    $intern_id: uuid, 
    $assigned_by: uuid
  ) {
    insert_tasks_one(object: {
      title: $title,
      description: $description,
      status: $status,
      priority: $priority,
      due_date: $due_date,
      intern_id: $intern_id,
      assigned_by: $assigned_by
    }) {
      id
    }
  }
`

export async function POST(req) {
  const session = await requireAuth(req, ["admin", "manager", "mentor"])
  if (!session) return NextResponse.json({ error: "Unauthorized", ok: false }, { status: 401 })

  try {
    const body = await req.json()
    const { title, description, status, priority, due_date, intern_id, assigned_by } = body

    if (!title || !status || !priority) {
      return NextResponse.json({ error: "Missing required fields", ok: false }, { status: 400 })
    }

    const data = await gqlFetch(CREATE_TASK, {
      title,
      description: description || null,
      status,
      priority,
      due_date: due_date || null,
      intern_id: intern_id || null,
      assigned_by: assigned_by || null
    })

    return NextResponse.json({ success: true, data: data.insert_tasks_one }, { status: 201 })
  } catch (error) {
    console.error('Tasks POST error:', error.message)
    return NextResponse.json({ error: error.message, ok: false }, { status: 500 })
  }
}