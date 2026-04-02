// app/api/ai-tests/[id]/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { evaluateAnswers } from "@/lib/ai-service";
import {
  getTestSession,
  saveResponses,
  updateTestStatus,
  saveTestResults,
} from "@/lib/test-queries";

// Get test details with questions
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fix: Await params in Next.js 15+
  const { id } = await params;

  try {
    const test = await getTestSession(id);
    
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check access
    const isIntern = session.user.role === 'intern' && test.intern?.user_id === session.user.id;
    const isMentor = session.user.role === 'mentor' && test.intern?.mentor_id === session.user.id;
    const isAdmin = ['admin', 'hr'].includes(session.user.role);

    if (!isIntern && !isMentor && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ 
      ok: true, 
      test,
      questions: test.test_questions || [],
      responses: test.test_responses || [],
      results: test.test_results?.[0]
    });
  } catch (error) {
    console.error('Fetch test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Submit test answers
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fix: Await params in Next.js 15+
  const { id } = await params;

  try {
    const body = await req.json();
    const { answers } = body;

    const test = await getTestSession(id);
    
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Verify intern owns this test
    if (test.intern?.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not your test' }, { status: 403 });
    }

    // Check test availability
    const now = new Date();
    const scheduledAt = new Date(test.scheduled_at);
    const endTime = new Date(scheduledAt.getTime() + (test.duration_minutes || 30) * 60000);
    
    if (now < scheduledAt) {
      return NextResponse.json({ error: 'Test has not started yet' }, { status: 400 });
    }
    if (now > endTime) {
      return NextResponse.json({ error: 'Test time has expired' }, { status: 400 });
    }

    // Save responses
    await saveResponses(id, answers);

    // Update session status
    await updateTestStatus(id, 'submitted');

    // Get fresh test data with responses
    const updatedTest = await getTestSession(id);

    // Evaluate answers with AI
    const evaluation = await evaluateAnswers(updatedTest.test_questions, updatedTest.test_responses);

    // Calculate grade
    let grade;
    if (evaluation.percentage >= 90) grade = 'A';
    else if (evaluation.percentage >= 80) grade = 'B';
    else if (evaluation.percentage >= 70) grade = 'C';
    else if (evaluation.percentage >= 60) grade = 'D';
    else grade = 'F';

    // Save results
    await saveTestResults(id, test.intern_id, {
      total_points: evaluation.total_points,
      obtained_points: evaluation.obtained_points,
      percentage: evaluation.percentage,
      grade,
      overall_feedback: evaluation.overall_feedback,
      detailed_results: evaluation.results,
    });

    // Update session status to completed
    await updateTestStatus(id, 'completed');

    return NextResponse.json({ 
      ok: true, 
      evaluation: {
        percentage: evaluation.percentage,
        grade,
        total_points: evaluation.total_points,
        obtained_points: evaluation.obtained_points,
        feedback: evaluation.overall_feedback,
        detailed: evaluation.results
      }
    });
  } catch (error) {
    console.error('Submit test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}