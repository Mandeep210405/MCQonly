// FILE: frontend/app/api/tests/grade/route.js
// Replaces the old file — pure MCQ grading, NO OpenAI needed here

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'

const GET_TEST_FOR_GRADING = `
  query GetTestForGrading($session_id: uuid!) {
    ai_test_sessions_by_pk(id: $session_id) {
      id intern_id status
      test_questions(order_by: { question_number: asc }) {
        id question_number question_text correct_answer points
      }
    }
    test_responses(where: { session_id: { _eq: $session_id } }) {
      question_id intern_response
    }
  }
`

const INSERT_RESULT = `
  mutation InsertResult(
    $session_id: uuid! $intern_id: uuid!
    $total_points: Int! $obtained_points: Int!
    $percentage: numeric! $grade: String! $detailed_results: jsonb
  ) {
    insert_test_results_one(object: {
      session_id: $session_id intern_id: $intern_id
      total_points: $total_points obtained_points: $obtained_points
      percentage: $percentage grade: $grade detailed_results: $detailed_results
    }) { id grade percentage }
  }
`

const MARK_COMPLETED = `
  mutation MarkCompleted($id: uuid!) {
    update_ai_test_sessions_by_pk(
      pk_columns: { id: $id }
      _set: { status: "completed", completed_at: "now()" }
    ) { id status }
  }
`

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { session_id } = await req.json()
    if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

    const data = await gqlFetch(GET_TEST_FOR_GRADING, { session_id })
    const testSession = data.ai_test_sessions_by_pk
    if (!testSession) return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    if (testSession.status === 'completed')
      return NextResponse.json({ error: 'Already graded' }, { status: 400 })

    // Grade all MCQ questions instantly — no AI needed
    let totalPoints = 0
    let obtainedPoints = 0
    const detailedResults = []

    for (const q of testSession.test_questions) {
      totalPoints += q.points
      const response = data.test_responses.find((r) => r.question_id === q.id)
      const answer = response?.intern_response?.trim()?.toLowerCase() || ''
      const correct = answer === q.correct_answer?.toLowerCase()
      const scored = correct ? q.points : 0
      obtainedPoints += scored

      detailedResults.push({
        question_id: q.id,
        question_number: q.question_number,
        points: q.points,
        obtained_points: scored,
        correct: correct,
        given_answer: answer || 'not answered',
        correct_answer: q.correct_answer,
      })
    }

    const percentage = totalPoints > 0 ? (obtainedPoints / totalPoints) * 100 : 0
    const grade =
      percentage >= 90 ? 'A' :
      percentage >= 80 ? 'B' :
      percentage >= 70 ? 'C' :
      percentage >= 60 ? 'D' : 'F'

    // Save result
    const resultData = await gqlFetch(INSERT_RESULT, {
      session_id,
      intern_id: testSession.intern_id,
      total_points: totalPoints,
      obtained_points: obtainedPoints,
      percentage: parseFloat(percentage.toFixed(2)),
      grade,
      detailed_results: JSON.stringify(detailedResults),
    })

    await gqlFetch(MARK_COMPLETED, { id: session_id })

    return NextResponse.json({
      result: resultData.insert_test_results_one,
      summary: { total_points: totalPoints, obtained_points: obtainedPoints, percentage: parseFloat(percentage.toFixed(2)), grade },
      detailed_results: detailedResults,
    }, { status: 201 })
  } catch (err) {
    console.error('Error grading test:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}