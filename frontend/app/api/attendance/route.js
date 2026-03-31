import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'

const GET_ALL_ATTENDANCE = `
  query GetAttendance {
    attendance(order_by: { date: desc }) {
      id date check_in check_out status notes
      intern_id
      intern {
        id
        userByUserId { id name }
        department   { name }
      }
    }
  }
`

const GET_INTERN_ATTENDANCE = `
  query GetInternAttendance($user_id: uuid!) {
    attendance(
      where: { intern: { user_id: { _eq: $user_id } } }
      order_by: { date: desc }
    ) {
      id date check_in check_out status notes
      intern_id
      intern {
        id
        userByUserId { id name }
        department   { name }
      }
    }
  }
`

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    let data
    if (session?.user?.role === 'intern') {
      // Intern sees only their own attendance
      data = await gqlFetch(GET_INTERN_ATTENDANCE, { user_id: session.user.id })
    } else {
      // Admin, HR, Manager see all attendance
      data = await gqlFetch(GET_ALL_ATTENDANCE)
    }
    
    return NextResponse.json(data ?? { attendance: [] })
  } catch (error) {
    console.error('Attendance error:', error.message)
    return NextResponse.json({ attendance: [] }, { status: 200 })
  }
}