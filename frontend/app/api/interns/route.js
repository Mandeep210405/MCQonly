import { NextResponse } from 'next/server'
import { gqlFetch } from '@/lib/graphql-client'
import { requireAuth } from '@/lib/middleware/RequireRole'

// ── Queries ──────────────────────────────────────────────────────────────────

const GET_INTERNS = `
  query GetInterns($where: interns_bool_exp!) {
    interns(order_by: { created_at: desc }, where: $where) {
      id status start_date end_date college position_title created_at
      cgpa city skills languages experience_level
      userByUserId { id name email }
      department   { id name head_user_id }
      user         { id name }
    }
  }
`

// Check for existing active internship
const CHECK_ACTIVE_INTERNSHIP = `
  query CheckActiveInternship($user_id: uuid!) {
    interns(where: {
      user_id: { _eq: $user_id },
      status: { _eq: "active" }
    }) {
      id
      status
      start_date
      userByUserId {
        name
      }
    }
  }
`

const CREATE_INTERN = `
  mutation CreateIntern(
    $user_id: uuid!
    $department_id: uuid
    $mentor_id: uuid
    $status: String!
    $start_date: date!
    $end_date: date
    $college: String
    $position_title: String
    $cgpa: numeric
    $city: String
    $experience_level: String
    $skills: [String!]
    $languages: [String!]
  ) {
    insert_interns_one(object: {
      user_id: $user_id
      department_id: $department_id
      mentor_id: $mentor_id
      status: $status
      start_date: $start_date
      end_date: $end_date
      college: $college
      position_title: $position_title
      cgpa: $cgpa
      city: $city
      experience_level: $experience_level
      skills: $skills
      languages: $languages
    }) {
      id
      userByUserId { name email }
    }
  }
`

// ── Handlers ─────────────────────────────────────────────────────────────────

export async function GET(req) {
  const session = await requireAuth(req, ['admin', 'hr', 'mentor'])
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Mentors only see interns assigned to them or their department
    let where = {}
    if (session.user.role === 'mentor') {
      where = {
        _or: [
          { mentor_id: { _eq: session.user.id } },
          { department: { head_user_id: { _eq: session.user.id } } },
        ],
      }
    }
    const data = await gqlFetch(GET_INTERNS, { where })
    return NextResponse.json(data ?? { interns: [] })
  } catch (error) {
    console.error('[interns GET]', error.message)
    return NextResponse.json({ interns: [] })
  }
}

export async function POST(req) {
  const session = await requireAuth(req, ['admin', 'hr'])
  if (!session) return NextResponse.json({ error: 'Unauthorized — admin/hr only' }, { status: 401 })

  try {
    const {
      user_id, department_id, mentor_id, status = 'active',
      start_date, end_date, college, position_title,
      cgpa, city, experience_level,
      skills, languages
    } = await req.json()

    if (!user_id || !start_date) {
      return NextResponse.json({ error: 'user_id and start_date are required' }, { status: 400 })
    }

    // Check if the user already has an active internship
    const activeCheck = await gqlFetch(CHECK_ACTIVE_INTERNSHIP, { user_id })
    
    if (activeCheck?.interns && activeCheck.interns.length > 0) {
      const existingIntern = activeCheck.interns[0]
      return NextResponse.json({ 
        error: `User ${existingIntern.userByUserId.name} already has an active internship. Complete the current internship before creating a new one.`,
        existingInternship: {
          id: existingIntern.id,
          start_date: existingIntern.start_date,
          status: existingIntern.status
        }
      }, { status: 400 })
    }

    const data = await gqlFetch(CREATE_INTERN, {
      user_id,
      department_id: department_id || null,
      mentor_id: mentor_id || null,
      status,
      start_date,
      end_date: end_date || null,
      college: college || null,
      position_title: position_title || null,
      cgpa: cgpa ? parseFloat(cgpa) : null,
      city: city || null,
      experience_level: experience_level || null,
      skills: Array.isArray(skills) ? skills : [],
      languages: Array.isArray(languages) ? languages : [],
    })

    return NextResponse.json({ ok: true, intern: data.insert_interns_one }, { status: 201 })
  } catch (error) {
    console.error('[interns POST]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}