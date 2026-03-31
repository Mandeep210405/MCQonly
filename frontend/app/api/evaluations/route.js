import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'



const EVAL_FIELDS = `
  id period created_at
  intern_id evaluator_id
  technical_skill_score
  problem_solving_score
  communication_score
  teamwork_score
  initiative_score
  time_management_score
  learning_ability_score
  ownership_score
  overall_score
  strengths
  improvement_areas
  mentor_feedback
  intern {
    id
    userByUserId { name }
    department   { name }
  }
  user { name }
`



const GET_EVALUATIONS_ALL = `
  query GetEvaluations {
    evaluations(order_by: { created_at: desc }) { ${EVAL_FIELDS} }
  }
`

const GET_EVALUATIONS_MENTOR = `
  query GetEvaluationsMentor($mentorId: uuid!) {
    evaluations(
      where: { intern: { mentor_id: { _eq: $mentorId } } }
      order_by: { created_at: desc }
    ) { ${EVAL_FIELDS} }
  }
`

const GET_EVALUATIONS_INTERN = `
  query GetEvaluationsIntern($userId: uuid!) {
    evaluations(
      where: { intern: { user_id: { _eq: $userId } } }
      order_by: { created_at: desc }
    ) { ${EVAL_FIELDS} }
  }
`

const GET_INTERNS_ALL = `
  query GetInternsForEval {
    interns(order_by: { created_at: desc }) {
      id
      userByUserId { name }
      department { name }
    }
  }
`

const GET_INTERNS_MENTOR = `
  query GetInternsForMentor($mentorId: uuid!) {
    interns(
      where: { mentor_id: { _eq: $mentorId } }
      order_by: { created_at: desc }
    ) {
      id
      userByUserId { name }
      department { name }
    }
  }
`

const GET_EVALUATORS = `
  query GetEvaluators {
    users(where: { role: { _in: ["admin", "mentor", "hr"] } }, order_by: { name: asc }) {
      id name role
    }
  }
`

const INSERT_EVALUATION = `
  mutation InsertEvaluation(
    $intern_id: uuid!
    $evaluator_id: uuid
    $period: String
    $technical_skill_score: Int
    $problem_solving_score: Int
    $communication_score: Int
    $teamwork_score: Int
    $initiative_score: Int
    $time_management_score: Int
    $learning_ability_score: Int
    $ownership_score: Int
    $overall_score: numeric!
    $strengths: String
    $improvement_areas: String
    $mentor_feedback: String
  ) {
    insert_evaluations_one(object: {
      intern_id: $intern_id
      evaluator_id: $evaluator_id
      period: $period
      technical_skill_score: $technical_skill_score
      problem_solving_score: $problem_solving_score
      communication_score: $communication_score
      teamwork_score: $teamwork_score
      initiative_score: $initiative_score
      time_management_score: $time_management_score
      learning_ability_score: $learning_ability_score
      ownership_score: $ownership_score
      overall_score: $overall_score
      strengths: $strengths
      improvement_areas: $improvement_areas
      mentor_feedback: $mentor_feedback
    }) { ${EVAL_FIELDS} }
  }
`

const UPDATE_EVALUATION = `
  mutation UpdateEvaluation(
    $id: uuid!
    $evaluator_id: uuid
    $period: String
    $technical_skill_score: Int
    $problem_solving_score: Int
    $communication_score: Int
    $teamwork_score: Int
    $initiative_score: Int
    $time_management_score: Int
    $learning_ability_score: Int
    $ownership_score: Int
    $overall_score: numeric!
    $strengths: String
    $improvement_areas: String
    $mentor_feedback: String
  ) {
    update_evaluations_by_pk(
      pk_columns: { id: $id }
      _set: {
        evaluator_id: $evaluator_id
        period: $period
        technical_skill_score: $technical_skill_score
        problem_solving_score: $problem_solving_score
        communication_score: $communication_score
        teamwork_score: $teamwork_score
        initiative_score: $initiative_score
        time_management_score: $time_management_score
        learning_ability_score: $learning_ability_score
        ownership_score: $ownership_score
        overall_score: $overall_score
        strengths: $strengths
        improvement_areas: $improvement_areas
        mentor_feedback: $mentor_feedback
      }
    ) { ${EVAL_FIELDS} }
  }
`



function canMutate(role) {
  return role === 'admin' || role === 'mentor'
}

async function mentorOwnsIntern(mentorId, internId) {
  const CHECK = `
    query CheckOwnership($internId: uuid!, $mentorId: uuid!) {
      interns(where: { id: { _eq: $internId }, mentor_id: { _eq: $mentorId } }) { id }
    }
  `
  const data = await gqlFetch(CHECK, { internId, mentorId })
  return (data?.interns ?? []).length > 0
}

const intOrNull = v => (v != null && v !== '' && v !== 0 ? parseInt(v) : null)



export async function GET(request) {
  const session = await getServerSession(authOptions)
  const role    = session?.user?.role ?? ''
  const userId  = session?.user?.id   ?? ''

  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    if (type === 'interns') {
      if (!canMutate(role)) return NextResponse.json({ interns: [] })
      if (role === 'mentor') {
        const data = await gqlFetch(GET_INTERNS_MENTOR, { mentorId: userId })
        return NextResponse.json(data ?? { interns: [] })
      }
      const data = await gqlFetch(GET_INTERNS_ALL)
      return NextResponse.json(data ?? { interns: [] })
    }

    if (type === 'evaluators') {
      if (!canMutate(role)) return NextResponse.json({ users: [] })
      const data = await gqlFetch(GET_EVALUATORS)
      return NextResponse.json(data ?? { users: [] })
    }

    if (role === 'intern') {
      const data = await gqlFetch(GET_EVALUATIONS_INTERN, { userId })
      return NextResponse.json(data ?? { evaluations: [] })
    }
    if (role === 'mentor') {
      const data = await gqlFetch(GET_EVALUATIONS_MENTOR, { mentorId: userId })
      return NextResponse.json(data ?? { evaluations: [] })
    }
    const data = await gqlFetch(GET_EVALUATIONS_ALL)
    return NextResponse.json(data ?? { evaluations: [] })

  } catch (error) {
    console.error('Evaluations GET error:', error.message)
    return NextResponse.json({ evaluations: [] }, { status: 200 })
  }
}



export async function POST(request) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role ?? ''
  const userId = session?.user?.id ?? ''

  if (!canMutate(role))
    return NextResponse.json({ error: 'Not authorized to add evaluations' }, { status: 403 })

  try {
    const body = await request.json()
    const { intern_id, evaluator_id, period, overall_score,
      technical_skill_score, problem_solving_score, communication_score,
      teamwork_score, initiative_score, time_management_score,
      learning_ability_score, ownership_score,
      strengths, improvement_areas, mentor_feedback } = body

    if (!intern_id || overall_score == null)
      return NextResponse.json({ error: 'intern_id and overall_score are required' }, { status: 400 })

    if (role === 'mentor') {
      const owns = await mentorOwnsIntern(userId, intern_id)
      if (!owns)
        return NextResponse.json({ error: 'You can only evaluate your assigned interns' }, { status: 403 })
    }

    const data = await gqlFetch(INSERT_EVALUATION, {
      intern_id,
      evaluator_id: evaluator_id || null,
      period: period || null,
      technical_skill_score: intOrNull(technical_skill_score),
      problem_solving_score: intOrNull(problem_solving_score),
      communication_score: intOrNull(communication_score),
      teamwork_score: intOrNull(teamwork_score),
      initiative_score: intOrNull(initiative_score),
      time_management_score: intOrNull(time_management_score),
      learning_ability_score: intOrNull(learning_ability_score),
      ownership_score: intOrNull(ownership_score),
      overall_score: parseFloat(overall_score),
      strengths: strengths || null,
      improvement_areas: improvement_areas || null,
      mentor_feedback: mentor_feedback || null,
    })
    return NextResponse.json(data?.insert_evaluations_one ?? {}, { status: 201 })
  } catch (error) {
    console.error('Evaluations POST error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



export async function PUT(request) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role ?? ''
  const userId = session?.user?.id ?? ''

  if (!canMutate(role))
    return NextResponse.json({ error: 'Not authorized to edit evaluations' }, { status: 403 })

  try {
    const body = await request.json()
    const { id, intern_id, evaluator_id, period, overall_score,
      technical_skill_score, problem_solving_score, communication_score,
      teamwork_score, initiative_score, time_management_score,
      learning_ability_score, ownership_score,
      strengths, improvement_areas, mentor_feedback } = body

    if (!id || overall_score == null)
      return NextResponse.json({ error: 'id and overall_score are required' }, { status: 400 })

    if (role === 'mentor' && intern_id) {
      const owns = await mentorOwnsIntern(userId, intern_id)
      if (!owns)
        return NextResponse.json({ error: 'You can only edit evaluations for your assigned interns' }, { status: 403 })
    }

    const data = await gqlFetch(UPDATE_EVALUATION, {
      id,
      evaluator_id: evaluator_id || null,
      period: period || null,
      technical_skill_score: intOrNull(technical_skill_score),
      problem_solving_score: intOrNull(problem_solving_score),
      communication_score: intOrNull(communication_score),
      teamwork_score: intOrNull(teamwork_score),
      initiative_score: intOrNull(initiative_score),
      time_management_score: intOrNull(time_management_score),
      learning_ability_score: intOrNull(learning_ability_score),
      ownership_score: intOrNull(ownership_score),
      overall_score: parseFloat(overall_score),
      strengths: strengths || null,
      improvement_areas: improvement_areas || null,
      mentor_feedback: mentor_feedback || null,
    })
    return NextResponse.json(data?.update_evaluations_by_pk ?? {}, { status: 200 })
  } catch (error) {
    console.error('Evaluations PUT error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}