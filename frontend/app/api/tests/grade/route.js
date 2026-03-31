import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'

const GET_TEST_FOR_GRADING = `
  query GetTestForGrading($session_id: uuid!) {
    ai_test_sessions_by_pk(id: $session_id) {
      id intern_id status
      test_questions(order_by: { question_number: asc }) {
        id question_number question_text question_type correct_answer rubric points
      }
    }
    test_responses(where: { session_id: { _eq: $session_id } }) {
      id question_id intern_response
    }
  }
`

const INSERT_TEST_RESULT = `
  mutation InsertTestResult(
    $session_id: uuid!
    $intern_id: uuid!
    $total_points: Int!
    $obtained_points: Int!
    $percentage: numeric!
    $grade: String!
    $ai_feedback: String!
    $detailed_results: jsonb
  ) {
    insert_test_results_one(object: {
      session_id: $session_id
      intern_id: $intern_id
      total_points: $total_points
      obtained_points: $obtained_points
      percentage: $percentage
      grade: $grade
      ai_feedback: $ai_feedback
      detailed_results: $detailed_results
    }) {
      id session_id intern_id total_points obtained_points percentage grade
    }
  }
`

const UPDATE_TEST_SESSION_COMPLETED = `
  mutation UpdateTestSessionCompleted($id: uuid!) {
    update_ai_test_sessions_by_pk(
      pk_columns: { id: $id }
      _set: { status: "completed", completed_at: "now()" }
    ) {
      id status completed_at
    }
  }
`

// Grade non-MCQ questions using OpenAI
async function gradeWithAI(question, internResponse) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const prompt = `
You are an expert examiner grading a student's response to the following question:

**Question:** ${question.question_text}

**Question Type:** ${question.question_type}

**Grading Rubric:** ${question.rubric}

**Student's Response:**
${internResponse}

Your task:
1. Evaluate the response based on the rubric
2. Assign a score out of ${question.points} points
3. Provide brief feedback (1-2 sentences)

Return ONLY a JSON object (no markdown, no extra text):
{
  "score": <number between 0 and ${question.points}>,
  "feedback": "<brief feedback>"
}
`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert examiner. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('OpenAI error:', error)
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown'}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || '{}'

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse grading response')
  }

  return JSON.parse(jsonMatch[0])
}

// Grade MCQ questions automatically
function gradeMultipleChoice(question, internResponse) {
  const isCorrect = internResponse?.trim?.()?.toLowerCase?.() === question.correct_answer?.toLowerCase?.()
  return {
    score: isCorrect ? question.points : 0,
    feedback: isCorrect ? 'Correct!' : `Incorrect. Correct answer: ${question.correct_answer}`,
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session_id } = await req.json()

    if (!session_id) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 })
    }

    // Get test details and responses
    const data = await gqlFetch(GET_TEST_FOR_GRADING, { session_id })

    const testSession = data.ai_test_sessions_by_pk
    const responses = data.test_responses

    if (!testSession) {
      return NextResponse.json({ error: 'Test session not found' }, { status: 404 })
    }

    if (testSession.status === 'completed') {
      return NextResponse.json({ error: 'Test already graded' }, { status: 400 })
    }

    // Grade all questions
    const detailedResults = []
    let totalPoints = 0
    let obtainedPoints = 0

    for (const question of testSession.test_questions) {
      totalPoints += question.points
      const response = responses.find((r) => r.question_id === question.id)
      const internResponse = response?.intern_response || ''

      let gradeResult
      if (question.question_type === 'mcq') {
        gradeResult = gradeMultipleChoice(question, internResponse)
      } else {
        // Use AI for coding and descriptive questions
        gradeResult = await gradeWithAI(question, internResponse)
        // Ensure score doesn't exceed max points
        gradeResult.score = Math.min(gradeResult.score, question.points)
      }

      obtainedPoints += gradeResult.score

      detailedResults.push({
        question_id: question.id,
        question_number: question.question_number,
        question_type: question.question_type,
        points: question.points,
        obtained_points: gradeResult.score,
        feedback: gradeResult.feedback,
      })
    }

    // Calculate percentage and grade
    const percentage = totalPoints > 0 ? (obtainedPoints / totalPoints) * 100 : 0
    let grade = 'F'
    if (percentage >= 90) grade = 'A'
    else if (percentage >= 80) grade = 'B'
    else if (percentage >= 70) grade = 'C'
    else if (percentage >= 60) grade = 'D'

    // Generate overall feedback using AI
    const feedbackPrompt = `
The student scored ${obtainedPoints}/${totalPoints} (${percentage.toFixed(1)}%) with grade ${grade}. 
Summary of performance:
${detailedResults.map((d) => `Q${d.question_number}: ${d.obtained_points}/${d.points} points - ${d.feedback}`).join('\n')}

Write a brief 2-3 sentence overall feedback encouraging improvement.
`

    let aiFeedback = ''
    try {
      const feedbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: feedbackPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      })

      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json()
        aiFeedback = feedbackData.choices[0]?.message?.content || 'Great effort! Keep practicing.'
      }
    } catch (err) {
      console.log('⚠️ Could not generate AI feedback, using default')
      aiFeedback = 'Great effort! Keep practicing.'
    }

    // Save test result
    const resultData = await gqlFetch(INSERT_TEST_RESULT, {
      session_id,
      intern_id: testSession.intern_id,
      total_points: totalPoints,
      obtained_points: obtainedPoints,
      percentage: parseFloat(percentage.toFixed(2)),
      grade,
      ai_feedback: aiFeedback,
      detailed_results: JSON.stringify(detailedResults),
    })

    // Update test session status to completed
    await gqlFetch(UPDATE_TEST_SESSION_COMPLETED, { id: session_id })

    return NextResponse.json(
      {
        result: resultData.insert_test_results_one,
        detailed_results: detailedResults,
        summary: {
          total_points: totalPoints,
          obtained_points: obtainedPoints,
          percentage: parseFloat(percentage.toFixed(2)),
          grade,
          feedback: aiFeedback,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('❌ Error grading test:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
