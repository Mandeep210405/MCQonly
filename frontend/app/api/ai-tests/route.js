// // app/api/ai-tests/route.js
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { NextResponse } from "next/server";
// import { generatePersonalizedQuestions } from "@/lib/ai-service";
// import { 
//   createTestSession, 
//   insertTestQuestions, 
//   getTests,
//   getMultipleInternsDetails
// } from "@/lib/test-queries";

// // Create a new test session
// export async function POST(req) {
//   const session = await getServerSession(authOptions);
//   if (!session || !['admin', 'hr', 'mentor'].includes(session.user.role)) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   try {
//     const body = await req.json();
//     const { 
//       intern_ids, 
//       test_type, 
//       scheduled_at, 
//       duration_minutes,
//       question_config 
//     } = body;

//     // Debug log
//     console.log('Received test creation request:', {
//       intern_ids,
//       test_type,
//       scheduled_at,
//       scheduled_at_type: typeof scheduled_at,
//       duration_minutes,
//       question_config
//     });

//     if (!intern_ids || intern_ids.length === 0) {
//       return NextResponse.json({ error: 'No interns selected' }, { status: 400 });
//     }

//     // Get all intern details for personalized questions
//     const internsDetails = await getMultipleInternsDetails(intern_ids);
    
//     const sessions = [];
    
//     for (const intern of internsDetails) {
//       // Create test session for this intern
//       const testSessionId = await createTestSession(
//         intern.id,
//         session.user.id,
//         test_type,
//         scheduled_at,
//         duration_minutes
//       );

//       // Generate PERSONALIZED questions based on intern's profile
//       const questions = await generatePersonalizedQuestions({
//         type: test_type,
//         count: question_config.count,
//         difficulty: question_config.difficulty,
//         topic: question_config.topic,
//         internProfile: intern  // Pass intern's skills, experience, etc.
//       });

//       // Prepare questions for insertion
//       const questionsToInsert = questions.map((q, i) => ({
//         session_id: testSessionId,
//         question_number: i + 1,
//         question_text: q.text,
//         question_type: q.type,
//         difficulty: q.difficulty,
//         options: q.options ? JSON.stringify(q.options) : null,
//         correct_answer: q.correct_answer,
//         expected_output: q.expected_output,
//         rubric: q.rubric,
//         points: q.points || (q.difficulty === 'easy' ? 10 : q.difficulty === 'medium' ? 15 : 20)
//       }));

//       await insertTestQuestions(questionsToInsert);
//       sessions.push({
//         id: testSessionId,
//         intern_id: intern.id,
//         intern_name: intern.user?.name,
//         questions_count: questions.length
//       });
//     }

//     return NextResponse.json({ 
//       ok: true, 
//       sessions,
//       message: `Test scheduled for ${intern_ids.length} intern(s) with personalized questions based on their skills`
//     });
//   } catch (error) {
//     console.error('Test creation error:', error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// // Get tests for current user
// export async function GET(req) {
//   const session = await getServerSession(authOptions);
//   if (!session) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   const { searchParams } = new URL(req.url);
//   const status = searchParams.get('status');

//   try {
//     const tests = await getTests(session.user.role, session.user.id, status);
    
//     // Transform to match expected format
//     const formattedTests = tests.map(test => ({
//       id: test.id,
//       intern_id: test.intern_id,
//       conducted_by: test.conducted_by,
//       conducted_by_name: test.conducted_by_user?.name,
//       intern_name: test.intern?.user?.name,
//       status: test.status,
//       test_type: test.test_type,
//       scheduled_at: test.scheduled_at,
//       duration_minutes: test.duration_minutes,
//       total_questions: test.test_questions_aggregate?.aggregate?.count || 0,
//       answered_questions: test.test_responses_aggregate?.aggregate?.count || 0,
//       percentage: test.test_results?.[0]?.percentage,
//       grade: test.test_results?.[0]?.grade,
//     }));

//     return NextResponse.json({ ok: true, tests: formattedTests });
//   } catch (error) {
//     console.error('Fetch tests error:', error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// app/api/ai-tests/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generatePersonalizedQuestions } from "@/lib/ai-service";
import { 
  createTestSession, 
  insertTestQuestions, 
  getTests,
  getMultipleInternsDetails
} from "@/lib/test-queries";

// Helper function to convert local time to IST timestamp
function convertToISTTimestamp(scheduledAt) {
  // If scheduled_at already has timezone info, use as is
  if (scheduledAt.includes('+') || scheduledAt.includes('Z')) {
    return scheduledAt;
  }
  
  // Otherwise, treat it as local time and add IST offset
  // Expected format: "2026-04-02T22:09:00"
  if (scheduledAt.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
    return `${scheduledAt}+05:30`; // Add IST offset (UTC+5:30)
  }
  
  // If it's just date and time without T
  if (scheduledAt.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    return `${scheduledAt.replace(' ', 'T')}+05:30`;
  }
  
  // Fallback: return as is
  return scheduledAt;
}

// app/api/ai-tests/route.js - Updated POST handler

// Create a new test session
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'hr', 'mentor'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      intern_ids, 
      test_type, 
      scheduled_at,  // This will be "2026-04-02 22:09:00"
      duration_minutes,
      question_config 
    } = body;

    // Parse the datetime - treat it as local time without any conversion
    // Split date and time
    const [date, time] = scheduled_at.split(' ');
    const [year, month, day] = date.split('-');
    const [hours, minutes, seconds] = time.split(':');
    
    // Create a date object using local components
    // This creates a date with the exact time you entered, in local time
    const localDateTime = new Date(Date.UTC(
      parseInt(year), 
      parseInt(month) - 1, 
      parseInt(day), 
      parseInt(hours), 
      parseInt(minutes), 
      parseInt(seconds || 0)
    ));
    
    // Convert to ISO string for storage
    // This will store the exact moment in UTC
    const utcTimestamp = localDateTime.toISOString();
    
    console.log('=== TIME CONVERSION DEBUG ===');
    console.log('User entered:', scheduled_at);
    console.log('Parsed as local components:', { year, month, day, hours, minutes });
    console.log('Stored as UTC:', utcTimestamp);
    console.log('Will display as:', new Date(utcTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    console.log('============================');

    if (!intern_ids || intern_ids.length === 0) {
      return NextResponse.json({ error: 'No interns selected' }, { status: 400 });
    }

    // Validate future date
    const now = new Date();
    if (new Date(utcTimestamp) <= now) {
      return NextResponse.json({ 
        error: 'Scheduled time must be in the future',
        scheduled: scheduled_at,
        current: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      }, { status: 400 });
    }

    // Get all intern details
    const internsDetails = await getMultipleInternsDetails(intern_ids);
    
    const sessions = [];
    
    for (const intern of internsDetails) {
      // Create test session - pass the UTC timestamp
      const testSessionId = await createTestSession(
        intern.id,
        session.user.id,
        test_type,
        utcTimestamp, // Store as UTC
        duration_minutes
      );

      // Generate personalized questions
      const questions = await generatePersonalizedQuestions({
        type: test_type,
        count: question_config.count,
        difficulty: question_config.difficulty,
        topic: question_config.topic,
        internProfile: intern
      });

      // Insert questions
      const questionsToInsert = questions.map((q, i) => ({
        session_id: testSessionId,
        question_number: i + 1,
        question_text: q.text,
        question_type: q.type,
        difficulty: q.difficulty,
        options: q.options ? JSON.stringify(q.options) : null,
        correct_answer: q.correct_answer,
        expected_output: q.expected_output,
        rubric: q.rubric,
        points: q.points || (q.difficulty === 'easy' ? 10 : q.difficulty === 'medium' ? 15 : 20)
      }));

      await insertTestQuestions(questionsToInsert);
      sessions.push({
        id: testSessionId,
        intern_id: intern.id,
        intern_name: intern.user?.name,
        questions_count: questions.length
      });
    }

    return NextResponse.json({ 
      ok: true, 
      sessions,
      scheduled_at_local: scheduled_at,
      message: `Test scheduled for ${intern_ids.length} intern(s) at ${scheduled_at}`
    });
  } catch (error) {
    console.error('Test creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get tests for current user
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  try {
    const tests = await getTests(session.user.role, session.user.id, status);
    
    // Transform to match expected format and add formatted time for display
    const formattedTests = tests.map(test => ({
      id: test.id,
      intern_id: test.intern_id,
      conducted_by: test.conducted_by,
      conducted_by_name: test.conducted_by_user?.name,
      intern_name: test.intern?.user?.name,
      status: test.status,
      test_type: test.test_type,
      scheduled_at: test.scheduled_at,
      scheduled_at_local: test.scheduled_at ? new Date(test.scheduled_at).toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) : null,
      duration_minutes: test.duration_minutes,
      total_questions: test.test_questions_aggregate?.aggregate?.count || 0,
      answered_questions: test.test_responses_aggregate?.aggregate?.count || 0,
      percentage: test.test_results?.[0]?.percentage,
      grade: test.test_results?.[0]?.grade,
    }));

    return NextResponse.json({ ok: true, tests: formattedTests });
  } catch (error) {
    console.error('Fetch tests error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}