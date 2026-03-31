import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'

const GET_TEST_RESULTS_BY_SESSION = `
  query GetTestResultsBySession($session_id: uuid!) {
    test_results(where: { session_id: { _eq: $session_id } }) {
      id session_id intern_id total_points obtained_points percentage grade
      ai_feedback detailed_results evaluated_at created_at
      ai_test_session {
        intern { user { name } }
        user { name }
      }
      intern { user { name } }
    }
  }
`

const GET_TEST_RESULTS_BY_INTERN = `
  query GetTestResultsByIntern($intern_id: uuid!) {
    test_results(where: { intern_id: { _eq: $intern_id } }, order_by: { created_at: desc }) {
      id session_id intern_id total_points obtained_points percentage grade
      ai_feedback evaluated_at created_at
      ai_test_session {
        intern { user { name } }
        conducted_by
        user { name }
      }
    }
  }
`

const GET_ALL_TEST_RESULTS = `
  query GetAllTestResults($limit: Int = 100) {
    test_results(limit: $limit, order_by: { created_at: desc }) {
      id session_id intern_id total_points obtained_points percentage grade
      evaluated_at created_at
      intern { user { name } department { name } }
      ai_test_session {
        user { name }
      }
    }
  }
`

const GET_TEST_ANALYTICS = `
  query GetTestAnalytics($intern_id: uuid) {
    test_results(where: { intern_id: { _eq: $intern_id } }) {
      percentage grade total_points obtained_points created_at
    }
  }
`

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')
    const internId = searchParams.get('intern_id')
    const analytics = searchParams.get('analytics')

    // Get results for a specific test session
    if (sessionId) {
      const data = await gqlFetch(GET_TEST_RESULTS_BY_SESSION, { session_id: sessionId })
      return NextResponse.json(data.test_results)
    }

    // Get results for a specific intern
    if (internId) {
      // For mentors: verify they're assigned to this intern
      if (session.user.role === 'mentor') {
        const mentorCheck = await gqlFetch(
          `
          query CheckMentor($intern_id: uuid!, $mentor_id: uuid!) {
            interns(where: { id: { _eq: $intern_id }, mentor_id: { _eq: $mentor_id } }) {
              id
            }
          }
          `,
          { intern_id: internId, mentor_id: session.user.id }
        )

        if (!mentorCheck.interns.length) {
          return NextResponse.json(
            { error: 'Access denied to this intern' },
            { status: 403 }
          )
        }
      }

      // Check if requesting analytics
      if (analytics === 'true') {
        const data = await gqlFetch(GET_TEST_ANALYTICS, { intern_id: internId })

        // Calculate aggregate analytics
        const results = data.test_results
        if (results.length === 0) {
          return NextResponse.json({
            total_tests: 0,
            avg_score: 0,
            avg_percentage: 0,
            grade_distribution: {},
          })
        }

        const avgPercentage = results.reduce((sum, r) => sum + r.percentage, 0) / results.length
        const gradeDistribution = results.reduce((acc, r) => {
          acc[r.grade] = (acc[r.grade] || 0) + 1
          return acc
        }, {})

        return NextResponse.json({
          total_tests: results.length,
          avg_percentage: parseFloat(avgPercentage.toFixed(2)),
          grade_distribution: gradeDistribution,
          latest_results: results.slice(0, 5),
        })
      }

      const data = await gqlFetch(GET_TEST_RESULTS_BY_INTERN, { intern_id: internId })
      return NextResponse.json(data.test_results)
    }

    // Get all results (admin/hr only)
    if (!['admin', 'hr'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only admin and HR can view all results' },
        { status: 403 }
      )
    }

    const data = await gqlFetch(GET_ALL_TEST_RESULTS, {})
    return NextResponse.json(data.test_results)
  } catch (err) {
    console.error('❌ Error fetching test results:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
