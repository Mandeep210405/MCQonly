-- ========================
-- AI TEST MODULE SCHEMA
-- Add these 4 tables to Hasura
-- ========================

-- AI_TEST_SESSIONS: Stores test session metadata
CREATE TABLE IF NOT EXISTS public.ai_test_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
    conducted_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    status varchar(20) DEFAULT 'not_started' CHECK (status IN ('scheduled','in_progress','submitted','completed')),
    test_type varchar(50) DEFAULT 'mixed' CHECK (test_type IN ('mcq','coding','descriptive','mixed')),
    scheduled_at timestamp,
    started_at timestamp,
    submitted_at timestamp,
    completed_at timestamp,
    duration_minutes integer DEFAULT 30,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- TEST_QUESTIONS: Stores AI-generated questions for each test session
CREATE TABLE IF NOT EXISTS public.test_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.ai_test_sessions(id) ON DELETE CASCADE,
    question_number integer NOT NULL,
    question_text text NOT NULL,
    question_type varchar(20) NOT NULL CHECK (question_type IN ('mcq','coding','descriptive')),
    difficulty varchar(20) CHECK (difficulty IN ('easy','medium','hard')),
    options jsonb, -- For MCQ: {"a": "option A", "b": "option B", ...}
    correct_answer varchar(100), -- For MCQ only
    expected_output text, -- For coding questions
    rubric text, -- For descriptive/coding grading guidelines
    points integer DEFAULT 10,
    created_at timestamp DEFAULT now(),
    UNIQUE(session_id, question_number)
);

-- TEST_RESPONSES: Stores intern answers
CREATE TABLE IF NOT EXISTS public.test_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.ai_test_sessions(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.test_questions(id) ON DELETE CASCADE,
    intern_response text NOT NULL,
    submitted_at timestamp DEFAULT now(),
    UNIQUE(session_id, question_id)
);

-- TEST_RESULTS: Stores final evaluation and scores
CREATE TABLE IF NOT EXISTS public.test_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.ai_test_sessions(id) ON DELETE CASCADE,
    intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
    total_points integer DEFAULT 0,
    obtained_points integer DEFAULT 0,
    percentage numeric(5,2) DEFAULT 0,
    grade varchar(1) CHECK (grade IN ('A','B','C','D','F')),
    ai_feedback text,
    detailed_results jsonb, -- Stores per-question scores and feedback
    evaluated_at timestamp DEFAULT now(),
    created_at timestamp DEFAULT now()
);

-- Add permissions and table tracking to Hasura manually
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_test_sessions_intern ON public.ai_test_sessions(intern_id);
CREATE INDEX IF NOT EXISTS idx_ai_test_sessions_conducted_by ON public.ai_test_sessions(conducted_by);
CREATE INDEX IF NOT EXISTS idx_ai_test_sessions_status ON public.ai_test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_test_questions_session ON public.test_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_test_responses_session ON public.test_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_test_responses_question ON public.test_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_test_results_session ON public.test_results(session_id);
CREATE INDEX IF NOT EXISTS idx_test_results_intern ON public.test_results(intern_id);
