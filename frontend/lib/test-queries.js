import { gqlFetch } from './graphql-client';

// ─── Create test session (no test_type anymore) ───────────────────────────────
export async function createTestSession(internId, conductedBy, scheduledAt, durationMinutes) {
  const mutation = `
    mutation CreateTestSession($object: ai_test_sessions_insert_input!) {
      insert_ai_test_sessions_one(object: $object) { id }
    }
  `;
  const data = await gqlFetch(mutation, {
    object: {
      intern_id:        internId,
      conducted_by:     conductedBy,
      status:           'scheduled',
      scheduled_at:     scheduledAt,
      duration_minutes: durationMinutes,
      // test_type removed — not in schema
    }
  });
  return data.insert_ai_test_sessions_one.id;
}

// ─── Get one intern's details for question generation ────────────────────────
export async function getInternDetails(internId) {
  const query = `
    query GetInternDetails($intern_id: uuid!) {
      interns_by_pk(id: $intern_id) {
        id user_id skills languages experience_level position_title college cgpa
        user { id name email }
        department { id name description }
        evaluations(order_by: {created_at: desc}, limit: 1) {
          overall_score technical_skill_score problem_solving_score
        }
      }
    }
  `;
  const data = await gqlFetch(query, { intern_id: internId });
  return data.interns_by_pk;
}

// ─── Get multiple interns' details ───────────────────────────────────────────
export async function getMultipleInternsDetails(internIds) {
  const query = `
    query GetMultipleInternsDetails($intern_ids: [uuid!]!) {
      interns(where: {id: {_in: $intern_ids}}) {
        id user_id skills languages experience_level position_title college cgpa
        user { id name email }
        department { id name description }
        evaluations(order_by: {created_at: desc}, limit: 1) {
          overall_score technical_skill_score problem_solving_score
        }
      }
    }
  `;
  const data = await gqlFetch(query, { intern_ids: internIds });
  return data.interns;
}

// ─── Insert MCQ questions (no question_type, rubric, expected_output) ─────────
export async function insertTestQuestions(questions) {
  const mutation = `
    mutation InsertTestQuestions($objects: [test_questions_insert_input!]!) {
      insert_test_questions(objects: $objects) {
        affected_rows
        returning { id question_number }
      }
    }
  `;
  const data = await gqlFetch(mutation, { objects: questions });
  return data.insert_test_questions.returning;
}

// ─── Get a single test session with questions + responses + results ───────────
export async function getTestSession(sessionId) {
  const query = `
    query GetTestSession($session_id: uuid!) {
      ai_test_sessions_by_pk(id: $session_id) {
        id intern_id conducted_by status scheduled_at
        started_at submitted_at completed_at duration_minutes
        conducted_by_user: user { id name email }
        intern {
          id user_id mentor_id skills experience_level
          department { id name }
          user { id name email }
        }
        test_questions(order_by: {question_number: asc}) {
          id question_number question_text difficulty options correct_answer points
          # question_type, expected_output, rubric removed
        }
        test_responses {
          id question_id intern_response submitted_at
        }
        test_results {
          id total_points obtained_points percentage grade detailed_results
          # ai_feedback removed
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

// ─── Get all tests (filtered by role) ────────────────────────────────────────
export async function getTests(userRole, userId, filterStatus = null) {
  try {
    let internId = null;

    // Interns need their intern record ID (not user ID)
    if (userRole === 'intern') {
      const res = await gqlFetch(
        `query GetInternByUserId($user_id: uuid!) { interns(where: {user_id: {_eq: $user_id}}) { id } }`,
        { user_id: userId }
      );
      internId = res.interns[0]?.id;
      if (!internId) return [];
    }

    // Build where clause based on role
    const whereCondition = {};
    if (userRole === 'intern')  whereCondition.intern_id = { _eq: internId };
    if (userRole === 'mentor')  whereCondition.intern    = { mentor_id: { _eq: userId } };
    if (filterStatus && filterStatus !== 'all') whereCondition.status = { _eq: filterStatus };

    const query = `
      query GetTests($where: ai_test_sessions_bool_exp!) {
        ai_test_sessions(where: $where, order_by: {scheduled_at: desc}) {
          id intern_id conducted_by status scheduled_at
          started_at submitted_at completed_at duration_minutes
          conducted_by_user: user { id name email }
          intern {
            id
            user_id
            intern_user: userByUserId { id name email }
          }
          test_questions_aggregate { aggregate { count } }
          test_responses_aggregate  { aggregate { count } }
          test_results { id percentage grade }
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

// ─── Save intern answers ──────────────────────────────────────────────────────
export async function saveResponses(sessionId, responses) {
  const mutation = `
    mutation SaveResponses($objects: [test_responses_insert_input!]!) {
      insert_test_responses(
        objects: $objects,
        on_conflict: {
          constraint: test_responses_session_id_question_id_key,
          update_columns: [intern_response, submitted_at]
        }
      ) { affected_rows }
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

// ─── Update test session status ───────────────────────────────────────────────
export async function updateTestStatus(sessionId, status) {
  const now = new Date().toISOString();
  const _set = { status };
  if (status === 'in_progress') _set.started_at  = now;
  if (status === 'submitted')   _set.submitted_at = now;
  if (status === 'completed')   _set.completed_at = now;

  const mutation = `
    mutation UpdateTestStatus($id: uuid!, $_set: ai_test_sessions_set_input!) {
      update_ai_test_sessions_by_pk(pk_columns: {id: $id}, _set: $_set) { id }
    }
  `;
  await gqlFetch(mutation, { id: sessionId, _set });
}

// ─── Save final test results (no ai_feedback) ─────────────────────────────────
export async function saveTestResults(sessionId, internId, results) {
  const mutation = `
    mutation SaveTestResults($object: test_results_insert_input!) {
      insert_test_results_one(object: $object) { id }
    }
  `;
  await gqlFetch(mutation, {
    object: {
      session_id:       sessionId,
      intern_id:        internId,
      total_points:     results.total_points,
      obtained_points:  results.obtained_points,
      percentage:       results.percentage,
      grade:            results.grade,
      detailed_results: JSON.stringify(results.detailed_results),
      // ai_feedback removed — not in schema
    }
  });
}