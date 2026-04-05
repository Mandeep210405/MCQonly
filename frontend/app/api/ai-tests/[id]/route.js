// app/api/ai-tests/[id]/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  getTestSession,
  saveResponses,
  updateTestStatus,
  saveTestResults,
} from "@/lib/test-queries";

// MCQ instant grading — no AI needed, just compare selected vs correct answer
function evaluateMCQAnswers(questions, responses) {
  let total_points = 0;
  let obtained_points = 0;

  const results = questions.map((q) => {
    const response = responses.find((r) => r.question_id === q.id);
    const selected = response?.intern_response ?? null;
    const correct = q.correct_answer;
    const points = q.points ?? 10;
    const is_correct = selected !== null && selected === correct;

    total_points += points;
    if (is_correct) obtained_points += points;

    return {
      question_id: q.id,
      question_text: q.question_text ?? q.text,
      selected_option: selected,
      correct_answer: correct,
      is_correct,
      points_earned: is_correct ? points : 0,
      max_points: points,
    };
  });

  const percentage =
    total_points > 0
      ? Math.round((obtained_points / total_points) * 100)
      : 0;

  const overall_feedback =
    percentage >= 90
      ? "Excellent work! Outstanding performance."
      : percentage >= 80
      ? "Great job! Strong understanding of the material."
      : percentage >= 70
      ? "Good effort. Review the questions you missed."
      : percentage >= 60
      ? "Passing grade. Significant review recommended."
      : "Below passing. Please revisit the core concepts.";

  return { total_points, obtained_points, percentage, overall_feedback, results };
}

// Get test details with questions
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const test = await getTestSession(id);

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const isIntern =
      session.user.role === "intern" &&
      test.intern?.user_id === session.user.id;
    const isMentor =
      session.user.role === "mentor" &&
      test.intern?.mentor_id === session.user.id;
    const isAdmin = ["admin", "hr"].includes(session.user.role);

    if (!isIntern && !isMentor && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      test,
      questions: test.test_questions || [],
      responses: test.test_responses || [],
      results: test.test_results?.[0],
    });
  } catch (error) {
    console.error("Fetch test error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Submit test answers
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { answers } = body;

    const test = await getTestSession(id);

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (test.intern?.user_id !== session.user.id) {
      return NextResponse.json({ error: "Not your test" }, { status: 403 });
    }

    const now = new Date();
    const scheduledAt = new Date(test.scheduled_at);
    const endTime = new Date(
      scheduledAt.getTime() + (test.duration_minutes || 30) * 60000
    );

    if (now < scheduledAt) {
      return NextResponse.json(
        { error: "Test has not started yet" },
        { status: 400 }
      );
    }
    if (now > endTime) {
      return NextResponse.json(
        { error: "Test time has expired" },
        { status: 400 }
      );
    }

    await saveResponses(id, answers);
    await updateTestStatus(id, "submitted");

    const updatedTest = await getTestSession(id);

    // Instant MCQ grading — no AI call
    const evaluation = evaluateMCQAnswers(
      updatedTest.test_questions,
      updatedTest.test_responses
    );

    let grade;
    if (evaluation.percentage >= 90) grade = "A";
    else if (evaluation.percentage >= 80) grade = "B";
    else if (evaluation.percentage >= 70) grade = "C";
    else if (evaluation.percentage >= 60) grade = "D";
    else grade = "F";

    await saveTestResults(id, test.intern_id, {
      total_points: evaluation.total_points,
      obtained_points: evaluation.obtained_points,
      percentage: evaluation.percentage,
      grade,
      overall_feedback: evaluation.overall_feedback,
      detailed_results: evaluation.results,
    });

    await updateTestStatus(id, "completed");

    return NextResponse.json({
      ok: true,
      evaluation: {
        percentage: evaluation.percentage,
        grade,
        total_points: evaluation.total_points,
        obtained_points: evaluation.obtained_points,
        feedback: evaluation.overall_feedback,
        detailed: evaluation.results,
      },
    });
  } catch (error) {
    console.error("Submit test error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 