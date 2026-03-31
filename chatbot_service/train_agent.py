"""
train_agent.py
==============
Training script for the InternHub Vanna agent.
Expects that the environment variables (GROQ, DB_PASSWORD, CHROMA_PATH) are set.
"""

import logging
from vanna_setup import vn, connect_to_postgres

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── DDL (Data Definition Language) ─────────────────────────────────────
DDL_STATEMENTS = [
    """
    CREATE TABLE public.users (
        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        name varchar(100) NOT NULL,
        email varchar(150) NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role varchar(20) NOT NULL CHECK (role IN ('admin','mentor','intern','hr')),
        created_at timestamp DEFAULT now()
    );
    """,
    """
    CREATE TABLE public.departments (
        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        name varchar(100) NOT NULL,
        description text,
        head_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
        created_at timestamp DEFAULT now()
    );
    """,
    """
    CREATE TABLE public.interns (
        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
        mentor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
        status varchar(20) DEFAULT 'active' CHECK (status IN ('active','completed','terminated')),
        start_date date NOT NULL,
        end_date date,
        college varchar(150),
        position_title varchar(100),
        created_at timestamp DEFAULT now(),
        cgpa numeric(3,1) CHECK (cgpa >= 0 AND cgpa <= 10),
        city varchar(100),
        skills text[],
        languages text[],
        experience_level varchar(20) CHECK (experience_level IN ('beginner','intermediate','advanced'))
    );
    """,
    """
    CREATE TABLE public.attendance (
        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
        date date NOT NULL,
        check_in time,
        check_out time,
        status varchar(20) DEFAULT 'present' CHECK (status IN ('present','absent','half_day','wfh')),
        notes text,
        UNIQUE (intern_id, date)
    );
    """,
    """
    CREATE TABLE public.announcements (
        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
        title varchar(200) NOT NULL,
        body text NOT NULL,
        audience varchar(30) DEFAULT 'all' CHECK (audience IN ('all','interns_only','mentors_only')),
        created_at timestamp DEFAULT now()
    );
    """,
    """
    CREATE TABLE public.documents (
        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
        type varchar(50),
        file_url text NOT NULL,
        uploaded_at timestamp DEFAULT now()
    );
    """,
    """
    CREATE TABLE public.tasks (
        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
        assigned_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
        title varchar(200) NOT NULL,
        description text,
        status varchar(20) DEFAULT 'todo' CHECK (status IN ('todo','in_progress','in_review','done')),
        priority varchar(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
        due_date date,
        created_at timestamp DEFAULT now()
    );
    """,
    """
    CREATE TABLE public.evaluations (
        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
        evaluator_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
        score integer CHECK (score BETWEEN 1 AND 10),
        technical_skill_score integer CHECK (technical_skill_score BETWEEN 1 AND 10),
        problem_solving_score integer CHECK (problem_solving_score BETWEEN 1 AND 10),
        communication_score integer CHECK (communication_score BETWEEN 1 AND 10),
        teamwork_score integer CHECK (teamwork_score BETWEEN 1 AND 10),
        initiative_score integer CHECK (initiative_score BETWEEN 1 AND 10),
        time_management_score integer CHECK (time_management_score BETWEEN 1 AND 10),
        learning_ability_score integer CHECK (learning_ability_score BETWEEN 1 AND 10),
        ownership_score integer CHECK (ownership_score BETWEEN 1 AND 10),
        overall_score numeric(4,1) CHECK (overall_score BETWEEN 1 AND 10),
        strengths text,
        improvement_areas text,
        mentor_feedback text,
        feedback text,
        period varchar(50),
        created_at timestamp DEFAULT now()
    );
    """,
    """
    CREATE TABLE public.intern_feedback (
        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
        given_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
        type varchar(20) CHECK (type IN ('positive','negative','neutral')),
        message text,
        created_at timestamp DEFAULT now()
    );
    """,
]

# ── Documentation ──────────────────────────────────────────────────────
DOCUMENTATION = [
    """
    Roles: admin has full access. Mentor and HR are department admins and should only
    query data for their own department. Interns must not access the chatbot.
    """,
    """
    Active interns are those with status = 'active'.
    """,
    """
    Skills and languages are stored as text[] arrays on interns.
    Use ARRAY operators such as: skills @> ARRAY['Python','Next.js'].
    """,
]

# ── Golden Queries ───────────────────────────────────────────────────
GOLDEN_QUERIES = [
    {
        "question": "How many students have a CGPA above 6?",
        "sql": """
            SELECT COUNT(*) AS count
            FROM public.interns
            WHERE cgpa > 6;
        """
    },
    {
        "question": "How many students are skilled in Python and Next.js?",
        "sql": """
            SELECT COUNT(*) AS count
            FROM public.interns
            WHERE skills @> ARRAY['Python','Next.js'];
        """
    },
    {
        "question": "List interns in the Engineering department with CGPA above 8.",
        "sql": """
            SELECT i.id, u.name, i.cgpa, d.name AS department
            FROM public.interns i
            JOIN public.users u ON u.id = i.user_id
            JOIN public.departments d ON d.id = i.department_id
            WHERE d.name = 'Engineering' AND i.cgpa > 8;
        """
    },
    {
        "question": "Show attendance count by status for July 2025.",
        "sql": """
            SELECT status, COUNT(*) AS count
            FROM public.attendance
            WHERE date >= '2025-07-01' AND date < '2025-08-01'
            GROUP BY status
            ORDER BY count DESC;
        """
    },
    {
        "question": "Which mentors have more than 2 interns assigned?",
        "sql": """
            SELECT u.name AS mentor_name, COUNT(*) AS intern_count
            FROM public.interns i
            JOIN public.users u ON u.id = i.mentor_id
            GROUP BY u.name
            HAVING COUNT(*) > 2
            ORDER BY intern_count DESC;
        """
    },
    {
        "question": "Show all announcements",
        "sql": """
            SELECT a.id, u.name AS created_by, a.title, a.body, a.audience
            FROM public.announcements a
            LEFT JOIN public.users u ON a.created_by = u.id
            ORDER BY a.created_at DESC;
        """
    },
    {
        "question": "Show all announcements with creator information",
        "sql": """
            SELECT a.id, u.name AS created_by, a.title, a.body, a.audience, a.created_at
            FROM public.announcements a
            LEFT JOIN public.users u ON a.created_by = u.id;
        """
    },
    {
        "question": "List all announcements and who created them",
        "sql": """
            SELECT u.name AS created_by, a.title, a.body, a.audience
            FROM public.announcements a
            LEFT JOIN public.users u ON a.created_by = u.id;
        """
    },
]

def run_training():
    logger.info("Starting training of InternHub AI...")

    # 1. DDL
    for ddl in DDL_STATEMENTS:
        vn.train(ddl=ddl)
    
    # 2. Docs
    for doc in DOCUMENTATION:
        vn.train(documentation=doc)
    
    # 3. Golden Queries
    for query in GOLDEN_QUERIES:
        vn.train(question=query['question'], sql=query['sql'])

    logger.info("Training complete! ChromaDB seed successful.")

if __name__ == "__main__":
    run_training()
