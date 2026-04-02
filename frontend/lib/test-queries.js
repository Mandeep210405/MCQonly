// lib/test-queries.js
import { gqlFetch } from './graphql-client';

// Helper to format date for Hasura timestamptz - MUST be ISO string
function formatTimestamptz(date) {
  if (!date) return null;
  const d = new Date(date);
  // Return ISO string - this is what Hasura expects for timestamptz
  return d.toISOString();
}

// lib/test-queries.js - createTestSession remains the same
// Just ensure it accepts the UTC timestamp
export async function createTestSession(internId, conductedBy, testType, scheduledAt, durationMinutes) {
  // scheduledAt is already UTC timestamp from the API
  console.log('Creating test session with UTC timestamp:', scheduledAt);

  const mutation = `
    mutation CreateTestSession($object: ai_test_sessions_insert_input!) {
      insert_ai_test_sessions_one(object: $object) {
        id
      }
    }
  `;

  const data = await gqlFetch(mutation, {
    object: {
      intern_id: internId,
      conducted_by: conductedBy,
      status: "scheduled",
      test_type: testType,
      scheduled_at: scheduledAt, // Pass as is (UTC)
      duration_minutes: durationMinutes,
    }
  });

  return data.insert_ai_test_sessions_one.id;
}

// Get intern details with skills, experience, department for personalized questions
export async function getInternDetails(internId) {
  const query = `
    query GetInternDetails($intern_id: uuid!) {
      interns_by_pk(id: $intern_id) {
        id
        user_id
        user: user {
          id
          name
          email
        }
        department {
          id
          name
          description
        }
        skills
        languages
        experience_level
        position_title
        college
        cgpa
        mentor: user {
          id
          name
        }
        evaluations(order_by: {created_at: desc}, limit: 1) {
          overall_score
          technical_skill_score
          problem_solving_score
        }
      }
    }
  `;

  const data = await gqlFetch(query, { intern_id: internId });
  return data.interns_by_pk;
}

// Get multiple interns details
export async function getMultipleInternsDetails(internIds) {
  const query = `
    query GetMultipleInternsDetails($intern_ids: [uuid!]!) {
      interns(where: {id: {_in: $intern_ids}}) {
        id
        user_id
        user: user {
          id
          name
          email
        }
        department {
          id
          name
          description
        }
        skills
        languages
        experience_level
        position_title
        college
        cgpa
        evaluations(order_by: {created_at: desc}, limit: 1) {
          overall_score
          technical_skill_score
          problem_solving_score
        }
      }
    }
  `;

  const data = await gqlFetch(query, { intern_ids: internIds });
  return data.interns;
}

// Insert test questions
export async function insertTestQuestions(questions) {
  const mutation = `
    mutation InsertTestQuestions($objects: [test_questions_insert_input!]!) {
      insert_test_questions(objects: $objects) {
        affected_rows
        returning {
          id
          question_number
        }
      }
    }
  `;

  const data = await gqlFetch(mutation, { objects: questions });
  return data.insert_test_questions.returning;
}

// Get test session with questions and responses
export async function getTestSession(sessionId) {
  const query = `
    query GetTestSession($session_id: uuid!) {
      ai_test_sessions_by_pk(id: $session_id) {
        id
        intern_id
        conducted_by
        status
        test_type
        scheduled_at
        started_at
        submitted_at
        completed_at
        duration_minutes
        conducted_by_user: user {
          id
          name
          email
        }
        intern: intern {
          id
          user_id
          mentor_id
          skills
          experience_level
          department {
            id
            name
          }
          user: user {
            id
            name
            email
          }
        }
        test_questions(order_by: {question_number: asc}) {
          id
          question_number
          question_text
          question_type
          difficulty
          options
          correct_answer
          expected_output
          rubric
          points
        }
        test_responses {
          id
          question_id
          intern_response
          submitted_at
        }
        test_results {
          id
          total_points
          obtained_points
          percentage
          grade
          ai_feedback
          detailed_results
          evaluated_at
        }
      }
    }
  `;

  try {
    const data = await gqlFetch(query, { session_id: sessionId });
    return data.ai_test_sessions_by_pk;
  } catch (error) {
    console.error('getTestSession error:', error);
    throw error;
  }
}

// Get tests for intern, mentor, or admin - FIXED VERSION
export async function getTests(userRole, userId, filterStatus = null) {
  try {
    let internId = null;
    
    // If intern, get their intern ID first
    if (userRole === 'intern') {
      const internQuery = `
        query GetInternByUserId($user_id: uuid!) {
          interns(where: {user_id: {_eq: $user_id}}) {
            id
          }
        }
      `;
      const internData = await gqlFetch(internQuery, { user_id: userId });
      internId = internData.interns[0]?.id;
      
      if (!internId) {
        return []; // No intern record found
      }
    }

    // Build the where condition based on role
    let whereCondition = {};
    
    if (userRole === 'intern') {
      whereCondition = { intern_id: { _eq: internId } };
    } else if (userRole === 'mentor') {
      whereCondition = { intern: { mentor_id: { _eq: userId } } };
    }
    
    // Add status filter if provided
    if (filterStatus && filterStatus !== 'all') {
      whereCondition.status = { _eq: filterStatus };
    }

    const query = `
      query GetTests($where: ai_test_sessions_bool_exp!) {
        ai_test_sessions(
          where: $where,
          order_by: {scheduled_at: desc}
        ) {
          id
          intern_id
          conducted_by
          status
          test_type
          scheduled_at
          started_at
          submitted_at
          completed_at
          duration_minutes
          conducted_by_user: user {
            id
            name
            email
          }
          intern: intern {
            id
            user: user {
              id
              name
              email
            }
          }
          test_questions_aggregate {
            aggregate {
              count
            }
          }
          test_responses_aggregate {
            aggregate {
              count
            }
          }
          test_results {
            id
            percentage
            grade
          }
        }
      }
    `;

    const data = await gqlFetch(query, { where: whereCondition });
    return data.ai_test_sessions;
  } catch (error) {
    console.error('getTests error:', error);
    throw error;
  }
}

// Save test responses
export async function saveResponses(sessionId, responses) {
  const mutation = `
    mutation SaveResponses($objects: [test_responses_insert_input!]!) {
      insert_test_responses(
        objects: $objects,
        on_conflict: {
          constraint: test_responses_session_id_question_id_key,
          update_columns: [intern_response, submitted_at]
        }
      ) {
        affected_rows
      }
    }
  `;

  const objects = Object.entries(responses).map(([question_id, intern_response]) => ({
    session_id: sessionId,
    question_id,
    intern_response,
    submitted_at: new Date().toISOString(),
  }));

  await gqlFetch(mutation, { objects });
}

// Update test session status
export async function updateTestStatus(sessionId, status) {
  const now = new Date().toISOString();
  
  const updateData = { status };
  if (status === 'in_progress') updateData.started_at = now;
  if (status === 'submitted') updateData.submitted_at = now;
  if (status === 'completed') updateData.completed_at = now;

  const mutation = `
    mutation UpdateTestStatus($id: uuid!, $_set: ai_test_sessions_set_input!) {
      update_ai_test_sessions_by_pk(pk_columns: {id: $id}, _set: $_set) {
        id
      }
    }
  `;

  await gqlFetch(mutation, {
    id: sessionId,
    _set: updateData
  });
}

// Save test results
export async function saveTestResults(sessionId, internId, results) {
  const mutation = `
    mutation SaveTestResults($object: test_results_insert_input!) {
      insert_test_results_one(object: $object) {
        id
      }
    }
  `;

  const object = {
    session_id: sessionId,
    intern_id: internId,
    total_points: results.total_points,
    obtained_points: results.obtained_points,
    percentage: results.percentage,
    grade: results.grade,
    ai_feedback: results.overall_feedback,
    detailed_results: JSON.stringify(results.detailed_results),
    evaluated_at: new Date().toISOString(),
  };

  await gqlFetch(mutation, { object });
}

// Get interns for test creation
export async function getInternsForTest(userRole, userId) {
  try {
    let whereCondition = { status: { _eq: "active" } };
    
    if (userRole === 'mentor') {
      whereCondition.mentor_id = { _eq: userId };
    }

    const query = `
      query GetInternsForTest($where: interns_bool_exp!) {
        interns(
          where: $where,
          order_by: {created_at: desc}
        ) {
          id
          user_id
          skills
          experience_level
          position_title
          user: user {
            id
            name
            email
          }
          department {
            id
            name
          }
          evaluations(order_by: {created_at: desc}, limit: 1) {
            overall_score
            technical_skill_score
          }
        }
      }
    `;

    const data = await gqlFetch(query, { where: whereCondition });
    return data.interns;
  } catch (error) {
    console.error('getInternsForTest error:', error);
    throw error;
  }
}

// Get departments for test creation
export async function getDepartments() {
  const query = `
    query GetDepartments {
      departments(order_by: {name: asc}) {
        id
        name
        description
        user: user {
          id
          name
          email
        }
      }
    }
  `;

  const data = await gqlFetch(query);
  return data.departments;
}