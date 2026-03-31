
import { NextResponse } from 'next/server'
import { gqlFetch } from '@/lib/graphql-client'
import { requireAuth } from '@/lib/middleware/RequireRole'

// ── Queries ──────────────────────────────────────────────────────────────────

// Full intern detail — used by the profile page
const GET_INTERN = `
  query GetIntern($id: uuid!) {
    interns_by_pk(id: $id) {
      id status start_date end_date college position_title created_at
      cgpa city skills languages experience_level
      userByUserId { id name email }
      department   { id name head_user_id }
      user         { id name }
      evaluations(order_by: { created_at: desc }) {
        id period score overall_score feedback mentor_feedback strengths improvement_areas
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

const UPDATE_INTERN = `
  mutation UpdateIntern(
    $id: uuid!
    $department_id: uuid
    $mentor_id: uuid
    $status: String
    $start_date: date
    $end_date: date
    $college: String
    $position_title: String
    $cgpa: numeric
    $city: String
    $skills: [String!]
    $languages: [String!]
    $experience_level: String
  ) {
    update_interns_by_pk(
      pk_columns: { id: $id }
      _set: {
        department_id: $department_id
        mentor_id: $mentor_id
        status: $status
        start_date: $start_date
        end_date: $end_date
        college: $college
        position_title: $position_title
        cgpa: $cgpa
        city: $city
        skills: $skills
        languages: $languages
        experience_level: $experience_level
      }
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
      userByUserId { 
        id
        name 
        email
      }
      department {
        id
        name
      }
      mentor: user {
        id
        name
      }
    }
  }
`

const DELETE_INTERN = `
  mutation DeleteIntern($id: uuid!) {
    delete_interns_by_pk(id: $id) { id }
  }
`

// ── Handlers ─────────────────────────────────────────────────────────────────

export async function GET(req, context) {
  const session = await requireAuth(req, ['admin', 'hr', 'mentor', 'intern'])
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  try {
    const data = await gqlFetch(GET_INTERN, { id })
    return NextResponse.json(data ?? {})
  } catch (error) {
    console.error('[interns/:id GET]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req, context) {
  const session = await requireAuth(req, ['admin', 'hr', 'mentor'])
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  try {
    const body = await req.json()
    
    // Process skills and languages arrays properly
    let skills = null
    if (body.skills !== undefined) {
      skills = Array.isArray(body.skills) ? body.skills : 
               (body.skills ? JSON.parse(body.skills) : null)
    }
    
    let languages = null
    if (body.languages !== undefined) {
      languages = Array.isArray(body.languages) ? body.languages : 
                  (body.languages ? JSON.parse(body.languages) : null)
    }
    
    // Only pass fields that were actually sent — undefined becomes null for Hasura
    const variables = {
      id,
      department_id:    body.department_id !== undefined ? body.department_id : null,
      mentor_id:        body.mentor_id !== undefined ? body.mentor_id : null,
      status:           body.status !== undefined ? body.status : null,
      start_date:       body.start_date !== undefined ? body.start_date : null,
      end_date:         body.end_date !== undefined ? body.end_date : null,
      college:          body.college !== undefined ? body.college : null,
      position_title:   body.position_title !== undefined ? body.position_title : null,
      cgpa:             body.cgpa !== undefined && body.cgpa !== null ? parseFloat(body.cgpa) : null,
      city:             body.city !== undefined ? body.city : null,
      skills:           skills,
      languages:        languages,
      experience_level: body.experience_level !== undefined ? body.experience_level : null,
    }

    const data = await gqlFetch(UPDATE_INTERN, variables)
    
    if (!data?.update_interns_by_pk) {
      return NextResponse.json({ error: 'Intern not found or update failed' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      ok: true, 
      intern: data.update_interns_by_pk 
    })
  } catch (error) {
    console.error('[interns/:id PATCH]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req, context) {
  const session = await requireAuth(req, ['admin','hr'])
  if (!session) return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 401 })

  const { id } = await context.params
  try {
    await gqlFetch(DELETE_INTERN, { id })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[interns/:id DELETE]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}