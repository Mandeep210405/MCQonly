// FILE: frontend/app/api/tests/results/route.js
// No major changes — just cleaned up unused ai_feedback field

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'

const GET_BY_SESSION = `
  query GetBySession($session_id: uuid!) {
    test_results(where: { session_id: { _eq: $session_id } }) {
      id session_id intern_id total_points obtained_points percentage grade
      detailed_results created_at
      intern { user { name } }
    }
  }
`

const GET_BY_INTERN = `
  query GetByIntern($intern_id: uuid!) {
    test_results(where: { intern_id: { _eq: $intern_id } }, order_by: { created_at: desc }) {
      id session_id total_points obtained_points percentage grade created_at
    }
  }
`

const GET_ALL = `
  query GetAll {
    test_results(limit: 100, order_by: { created_at: desc }) {
      id session_id intern_id total_points obtained_points percentage grade created_at
      intern { user { name } department { name } }
    }
  }
`

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')
    const internId = searchParams.get('intern_id')
    const analytics = searchParams.get('analytics')

    if (sessionId) {
      const data = await gqlFetch(GET_BY_SESSION, { session_id: sessionId })
      return NextResponse.json(data.test_results)
    }

    if (internId) {
      // Mentors can only see their own interns
      if (session.user.role === 'mentor') {
        const check = await gqlFetch(
          `query Check($intern_id: uuid!, $mentor_id: uuid!) {
            interns(where: { id: { _eq: $intern_id }, mentor_id: { _eq: $mentor_id } }) { id }
          }`,
          { intern_id: internId, mentor_id: session.user.id }
        )
        if (!check.interns.length)
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      if (analytics === 'true') {
        const data = await gqlFetch(GET_BY_INTERN, { intern_id: internId })
        const results = data.test_results
        if (!results.length) return NextResponse.json({ total_tests: 0, avg_percentage: 0, grade_distribution: {} })

        const avg = results.reduce((s, r) => s + r.percentage, 0) / results.length
        const grades = results.reduce((acc, r) => { acc[r.grade] = (acc[r.grade] || 0) + 1; return acc }, {})
        return NextResponse.json({ total_tests: results.length, avg_percentage: parseFloat(avg.toFixed(2)), grade_distribution: grades })
      }

      const data = await gqlFetch(GET_BY_INTERN, { intern_id: internId })
      return NextResponse.json(data.test_results)
    }

    if (!['admin', 'hr'].includes(session.user.role))
      return NextResponse.json({ error: 'Admin/HR only' }, { status: 403 })

    const data = await gqlFetch(GET_ALL, {})
    return NextResponse.json(data.test_results)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}