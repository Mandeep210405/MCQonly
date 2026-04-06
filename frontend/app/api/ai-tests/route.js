import { getServerSession }              from 'next-auth';
import { authOptions }                   from '@/lib/auth';
import { NextResponse }                  from 'next/server';
import { generatePersonalizedQuestions } from '@/lib/ai-service';
import {
  createTestSession,
  insertTestQuestions,
  getTests,
  getMultipleInternsDetails,
} from '@/lib/test-queries';

// ─── POST /api/ai-tests — Schedule a new test ─────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'hr', 'mentor'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { intern_ids, scheduled_at, duration_minutes, question_config } = await req.json();

    if (!intern_ids || intern_ids.length === 0) {
      return NextResponse.json({ error: 'No interns selected' }, { status: 400 });
    }
    if (!scheduled_at) {
      return NextResponse.json({ error: 'scheduled_at is required' }, { status: 400 });
    }

    // Convert "YYYY-MM-DD HH:MM:SS" → UTC ISO string
    // Input is treated as IST (UTC+5:30), stored as UTC
    const [datePart, timePart] = scheduled_at.split(' ');
    const [year, month, day]   = datePart.split('-').map(Number);
    const [hours, mins, secs]  = timePart.split(':').map(Number);

    const utcTimestamp = new Date(
      Date.UTC(year, month - 1, day, hours, mins, secs || 0)
    ).toISOString();

    // Must be in the future
    if (new Date(utcTimestamp) <= new Date()) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
    }

    const internsDetails = await getMultipleInternsDetails(intern_ids);
    const sessions = [];

    for (const intern of internsDetails) {
      // Create session — no test_type
      const testSessionId = await createTestSession(
        intern.id,
        session.user.id,
        utcTimestamp,
        duration_minutes
      );

      // Generate MCQ questions for this intern
      const questions = await generatePersonalizedQuestions({
        count:         question_config.count,
        difficulty:    question_config.difficulty,
        internProfile: intern,
        // topic removed
      });

      // Build insert objects — no question_type, rubric, expected_output
      const toInsert = questions.map((q, i) => ({
        session_id:      testSessionId,
        question_number: i + 1,
        question_text:   q.text,
        difficulty:      q.difficulty,
        options:         q.options,
        correct_answer:  q.correct_answer,
        points:          q.points,
        // question_type, expected_output, rubric removed
      }));

      await insertTestQuestions(toInsert);

      sessions.push({
        id:              testSessionId,
        intern_id:       intern.id,
        intern_name:     intern.user?.name,
        questions_count: questions.length,
      });
    }

    return NextResponse.json({
      ok:      true,
      sessions,
      message: `Test scheduled for ${intern_ids.length} intern(s) at ${scheduled_at}`,
    });
  } catch (error) {
    console.error('Test creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── GET /api/ai-tests — Fetch all tests for current user ────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  try {
    const tests = await getTests(session.user.role, session.user.id, status);

    const formattedTests = tests.map(test => ({
      id:              test.id,
      intern_id:       test.intern_id,
      conducted_by:    test.conducted_by,
      conducted_by_name: test.conducted_by_user?.name,
      intern_name:     test.intern?.intern_user?.name,
      status:          test.status,
      // test_type removed
      scheduled_at:    test.scheduled_at,
      duration_minutes: test.duration_minutes,
      total_questions: test.test_questions_aggregate?.aggregate?.count || 0,
      answered_questions: test.test_responses_aggregate?.aggregate?.count || 0,
      percentage:      test.test_results?.[0]?.percentage ?? null,
      grade:           test.test_results?.[0]?.grade ?? null,
    }));

    return NextResponse.json({ ok: true, tests: formattedTests });
  } catch (error) {
    console.error('Fetch tests error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}