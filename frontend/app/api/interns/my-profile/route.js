import { NextResponse } from 'next/server'
import { gqlFetch } from '@/lib/graphql-client'
import { requireAuth } from '@/lib/middleware/RequireRole'

const GET_MY_INTERNS = `
  query GetMyInterns($user_id: uuid!) {
    interns(
      where: { user_id: { _eq: $user_id } }
      order_by: { created_at: desc }
    ) {
      id
      status
      start_date
      end_date
      college
      position_title
      cgpa
      city
      skills
      languages
      experience_level
      created_at
      userByUserId { id name email }
      department   { id name }
      user         { id name }
      evaluations(order_by: { created_at: desc }, limit: 5) {
        id period score overall_score feedback mentor_feedback
        strengths improvement_areas
        technical_skill_score problem_solving_score communication_score
        teamwork_score initiative_score time_management_score
        learning_ability_score ownership_score
        user { name }
        created_at
      }
      tasks(order_by: { created_at: desc }, limit: 10) {
        id title description status priority due_date created_at
      }
      attendances(order_by: { date: desc }, limit: 14) {
        id date check_in check_out status notes
      }
    }
  }
`

export async function GET(req) {
  const session = await requireAuth(req, ['admin', 'hr', 'mentor', 'intern'])
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await gqlFetch(GET_MY_INTERNS, { user_id: session.user.id })
    return NextResponse.json({ interns: data?.interns ?? [] })
  } catch (error) {
    console.error('[interns/my-profile GET]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}