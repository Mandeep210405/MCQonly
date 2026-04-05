// FILE: frontend/app/api/tests/generate-questions/route.js
// Replaces the old file — MCQ only, no coding/descriptive

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'

const GET_INTERN_DETAILS = `
  query GetInternDetails($intern_id: uuid!) {
    interns_by_pk(id: $intern_id) {
      id position_title experience_level skills
      department { name }
      user { name }
    }
  }
`

const INSERT_QUESTIONS = `
  mutation InsertQuestions($objects: [test_questions_insert_input!]!) {
    insert_test_questions(objects: $objects) {
      returning { id session_id question_number question_text difficulty }
    }
  }
`

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['admin', 'hr', 'mentor'].includes(session.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { session_id, intern_id, num_questions = 10 } = await req.json()
    if (!session_id || !intern_id)
      return NextResponse.json({ error: 'Missing session_id or intern_id' }, { status: 400 })

    // Get intern profile for the AI prompt
    const internData = await gqlFetch(GET_INTERN_DETAILS, { intern_id })
    const intern = internData.interns_by_pk
    if (!intern) return NextResponse.json({ error: 'Intern not found' }, { status: 404 })

    // Call OpenAI — MCQ only
    const prompt = `
You are a technical assessment expert. Generate ${num_questions} MCQ questions for an intern:
- Name: ${intern.user.name}
- Position: ${intern.position_title}
- Department: ${intern.department.name}
- Experience: ${intern.experience_level}
- Skills: ${intern.skills?.join(', ') || 'general'}

Rules:
1. Return ONLY a valid JSON array, no extra text
2. Each question: question_text, difficulty (easy/medium/hard), options ({a,b,c,d}), correct_answer (a/b/c/d), points (10)
3. Difficulty based on experience: beginner=easy, intermediate=medium, advanced=hard

[{"question_text":"...","difficulty":"easy","options":{"a":"...","b":"...","c":"...","d":"..."},"correct_answer":"a","points":10}]`

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Respond only with valid JSON array.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })

    if (!aiRes.ok) {
      const err = await aiRes.json()
      throw new Error(err.error?.message || 'OpenAI error')
    }

    const aiData = await aiRes.json()
    const content = aiData.choices[0]?.message?.content || '[]'
    const match = content.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Could not parse AI response')

    const questions = JSON.parse(match[0]).slice(0, num_questions)

    // Save to DB
    const toInsert = questions.map((q, i) => ({
      session_id,
      question_number: i + 1,
      question_text: q.question_text,
      difficulty: q.difficulty,
      options: q.options,
      correct_answer: q.correct_answer,
      points: q.points || 10,
    }))

    const result = await gqlFetch(INSERT_QUESTIONS, { objects: toInsert })

    return NextResponse.json(
      { message: `Generated ${questions.length} questions`, questions: result.insert_test_questions.returning },
      { status: 201 }
    )
  } catch (err) {
    console.error('Error generating questions:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}