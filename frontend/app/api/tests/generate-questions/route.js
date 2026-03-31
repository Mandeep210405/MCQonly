import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'

const GET_INTERN_DETAILS = `
  query GetInternDetails($intern_id: uuid!) {
    interns_by_pk(id: $intern_id) {
      id department_id position_title experience_level skills
      department { name }
      user { name }
    }
  }
`

const INSERT_QUESTIONS = `
  mutation InsertQuestions($objects: [test_questions_insert_input!]!) {
    insert_test_questions(objects: $objects) {
      returning {
        id session_id question_number question_text question_type difficulty
      }
    }
  }
`

// Call OpenAI API to generate questions
async function generateQuestionsWithAI(internProfile, testType, numQuestions = 10) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const prompt = `
You are an expert technical assessment coordinator. Generate ${numQuestions} interview questions for an intern with the following profile:

**Intern Profile:**
- Name: ${internProfile.name}
- Position: ${internProfile.position_title}
- Department: ${internProfile.department.name}
- Experience Level: ${internProfile.experience_level}
- Skills: ${internProfile.skills?.join(', ') || 'Not specified'}

**Test Type:** ${testType}

Requirements:
1. Return a valid JSON array with exactly ${numQuestions} questions
2. Each question MUST have: question_text, question_type, difficulty, points
3. For MCQ questions: include "options" (object with keys a,b,c,d) and "correct_answer" (single letter)
4. For coding questions: include "expected_output" and "rubric"
5. For descriptive questions: include "rubric"
6. Tailor difficulty based on experience_level (beginner=easy, intermediate=medium, advanced=hard)
7. All points = 10 points per question

Question Type Distribution:
- If test_type = "mcq": all MCQ questions
- If test_type = "coding": all coding questions
- If test_type = "descriptive": all descriptive questions
- If test_type = "mixed": 50% MCQ, 30% Coding, 20% Descriptive

Return ONLY valid JSON array, no other text:
[
  {
    "question_text": "...",
    "question_type": "mcq|coding|descriptive",
    "difficulty": "easy|medium|hard",
    "points": 10,
    "options": {"a": "...", "b": "...", "c": "...", "d": "..."},  // MCQ only
    "correct_answer": "a",  // MCQ only
    "expected_output": "...",  // Coding only
    "rubric": "..."  // Coding/Descriptive
  }
]
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
          content: 'You are an expert technical assessment coordinator. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || '[]'

  // Try to extract JSON from response (in case there's extra text)
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON')
  }

  const questions = JSON.parse(jsonMatch[0])

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('AI did not generate valid questions')
  }

  return questions.slice(0, numQuestions)
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin, hr, mentor can generate tests
    if (!['admin', 'hr', 'mentor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { session_id, intern_id, test_type = 'mixed', num_questions = 10 } = await req.json()

    if (!session_id || !intern_id) {
      return NextResponse.json(
        { error: 'Missing session_id or intern_id' },
        { status: 400 }
      )
    }

    // Get intern details for AI prompt
    const internData = await gqlFetch(GET_INTERN_DETAILS, { intern_id })
    const internProfile = internData.interns_by_pk

    if (!internProfile) {
      return NextResponse.json({ error: 'Intern not found' }, { status: 404 })
    }

    // Generate questions using AI
    const questions = await generateQuestionsWithAI(
      internProfile,
      test_type,
      num_questions
    )

    // Prepare questions for database insertion
    const questionsToInsert = questions.map((q, index) => ({
      session_id,
      question_number: index + 1,
      question_text: q.question_text,
      question_type: q.question_type,
      difficulty: q.difficulty,
      points: q.points,
      options: q.options ? JSON.stringify(q.options) : null,
      correct_answer: q.correct_answer || null,
      expected_output: q.expected_output || null,
      rubric: q.rubric || null,
    }))

    // Insert questions into database
    const result = await gqlFetch(INSERT_QUESTIONS, {
      objects: questionsToInsert,
    })

    return NextResponse.json(
      {
        message: `Generated ${questions.length} questions successfully`,
        questions: result.insert_test_questions.returning,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('❌ Error generating questions:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
