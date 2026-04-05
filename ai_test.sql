-- ================================================
-- AI TEST MODULE - MCQ ONLY SCHEMA
-- FILE: place this at your project root
-- Run in Hasura console → SQL tab
-- Does NOT touch any existing tables
-- ================================================

-- Table 1: Test sessions
CREATE TABLE IF NOT EXISTS public.ai_test_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
    conducted_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    status varchar(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','submitted','completed')),
    scheduled_at timestamp,
    started_at timestamp,
    submitted_at timestamp,
    completed_at timestamp,
    duration_minutes integer DEFAULT 30,
    created_at timestamp DEFAULT now()
);

-- Table 2: MCQ questions only (removed: expected_output, rubric, question_type)
CREATE TABLE IF NOT EXISTS public.test_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.ai_test_sessions(id) ON DELETE CASCADE,
    question_number integer NOT NULL,
    question_text text NOT NULL,
    difficulty varchar(20) CHECK (difficulty IN ('easy','medium','hard')),
    options jsonb NOT NULL, -- { "a": "...", "b": "...", "c": "...", "d": "..." }
    correct_answer varchar(1) NOT NULL, -- a, b, c, or d
    points integer DEFAULT 10,
    created_at timestamp DEFAULT now(),
    UNIQUE(session_id, question_number)
);

-- Table 3: Intern answers
CREATE TABLE IF NOT EXISTS public.test_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.ai_test_sessions(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.test_questions(id) ON DELETE CASCADE,
    intern_response varchar(1), -- a, b, c, or d
    submitted_at timestamp DEFAULT now(),
    UNIQUE(session_id, question_id)
);

-- Table 4: Final results
CREATE TABLE IF NOT EXISTS public.test_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.ai_test_sessions(id) ON DELETE CASCADE,
    intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
    total_points integer DEFAULT 0,
    obtained_points integer DEFAULT 0,
    percentage numeric(5,2) DEFAULT 0,
    grade varchar(1) CHECK (grade IN ('A','B','C','D','F')),
    detailed_results jsonb, -- per-question scores
    created_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_test_sessions_intern ON public.ai_test_sessions(intern_id);
CREATE INDEX IF NOT EXISTS idx_ai_test_sessions_conducted_by ON public.ai_test_sessions(conducted_by);
CREATE INDEX IF NOT EXISTS idx_test_questions_session ON public.test_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_test_responses_session ON public.test_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_test_results_session ON public.test_results(session_id);
CREATE INDEX IF NOT EXISTS idx_test_results_intern ON public.test_results(intern_id);

-- After running this SQL, go to Hasura → Data → Track all 4 new tables
-- Set permissions for: admin, hr, mentor, intern roles on each table