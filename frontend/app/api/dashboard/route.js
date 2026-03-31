import { NextResponse } from 'next/server'
import { gqlFetch } from '@/lib/graphql-client'

const DASHBOARD_QUERY = `
  query DashboardStats {
    interns_aggregate { aggregate { count } }
    active: interns_aggregate(where: { status: { _eq: "active" } }) { aggregate { count } }
    tasks_aggregate { aggregate { count } }
    pending_tasks: tasks_aggregate(where: { status: { _neq: "done" } }) { aggregate { count } }
    departments_aggregate { aggregate { count } }
    recent_interns: interns(limit: 5, order_by: { created_at: desc }) {
      id status position_title
      userByUserId { name email }
      department   { name }
    }
    recent_tasks: tasks(limit: 5, order_by: { created_at: desc }) {
      id title status priority
      intern { userByUserId { name } }
    }
  }
`

export async function GET() {
  try {
    const data = await gqlFetch(DASHBOARD_QUERY)
    return NextResponse.json(data ?? {})
  } catch (error) {
    console.error('Dashboard error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 200 })
  }
}