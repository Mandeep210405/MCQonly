-- Enable UUID generation extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- SCHEMA
CREATE SCHEMA IF NOT EXISTS public;

-- USERS
CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name varchar(100) NOT NULL,
    email varchar(150) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role varchar(20) NOT NULL CHECK (role IN ('admin','mentor','intern','hr')),
    created_at timestamp DEFAULT now()
);

-- DEPARTMENTS
CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name varchar(100) NOT NULL,
    description text,
    head_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now()
);

-- INTERNS
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

-- ATTENDANCE
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

-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    title varchar(200) NOT NULL,
    body text NOT NULL,
    audience varchar(30) DEFAULT 'all' CHECK (audience IN ('all','interns_only','mentors_only')),
    created_at timestamp DEFAULT now()
);

-- DOCUMENTS
CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
    type varchar(50),
    file_url text NOT NULL,
    uploaded_at timestamp DEFAULT now()
);

-- TASKS
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

-- EVALUATIONS
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

-- INTERN FEEDBACK
CREATE TABLE public.intern_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
    given_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    type varchar(20) CHECK (type IN ('positive','negative','neutral')),
    message text,
    created_at timestamp DEFAULT now()
);


-- USERS
INSERT INTO public.users (id, name, email, password_hash, role, created_at) VALUES
('16d14e29-32fa-4bf8-80c7-96745dc0af92', 'Admin User', 'admin@company.com', '$2a$06$mFN/99D/uwC54tUgCsd2z.m.1dZu7KVNYJrr2mSFGHZ2RnUb1R4jm', 'admin', '2026-03-23 10:13:56'),
('4253d38d-4a1d-4ce3-9419-342a930d1859', 'Amit Patel', 'amit.patel@company.com', '$2a$06$0S7GU81b1sRqjlQ7N9Z.VeV8ErA4ISNPKyvDBxfiKwiNlIP0niP.S', 'mentor', '2026-03-23 10:13:56'),
('ea0f3808-74ba-470d-a6c1-93abe63efc16', 'Priya Mehta', 'priya.mehta@company.com', '$2a$06$DAMvDCQIYZSMX84a.2wib.3.xkZd16MapfIsUQQLuRcJH9bXzJ7ES', 'mentor', '2026-03-23 10:13:56'),
('9df80d23-431e-4115-a42d-d9a1b25e4f1b', 'Rahul Sharma', 'rahul.sharma@example.com', '$2a$06$bsP2i8Nw1F8ImtIhB3Zi8OAuV2jvkAE3PLNdA9yje8sgBLzVRZ1/G', 'intern', '2026-03-23 10:13:56'),
('b861be4b-c936-4460-b532-1800ad2abe12', 'Sneha Patel', 'sneha.patel@example.com', '$2a$06$htEQl748dqkMHZmjfa7uKe6NRDPiF9a2QQ85AcunrtEcHt/cswIom', 'intern', '2026-03-23 10:13:56'),
('a70a1cc0-7039-423d-91a3-5e73cf834b30', 'Karan Desai', 'karan.desai@example.com', '$2a$06$EBaxn5ZQvquvXAmhLdwMseGwdGE0rcf2LSzFgoROCXAzC2R19CYc.', 'intern', '2026-03-23 10:13:56'),
('8f4d9963-2d17-4037-932c-ea5061a967a5', 'Meera Shah', 'meera.shah@example.com', '$2a$06$QiVIe8.EJpa5slJYsFfS.eZ.YbpyICrJElwLfxSWY836.CCvSMmcm', 'intern', '2026-03-23 10:13:56'),
('16707d7f-8979-441d-b52e-221a2b8f63fd', 'Arjun Trivedi', 'arjun.trivedi@example.com', '$2a$06$QvQQ7E4NmElS5RqNTSOrT.vN.XuLle0fwgnv4QDnyLReYgAsvA/zO', 'intern', '2026-03-23 10:13:56');

-- DEPARTMENTS
INSERT INTO public.departments (id, name, description, head_user_id, created_at) VALUES
('ffa47aef-9ebb-47f1-a366-79ecaba022b6','Engineering','Software development and tech', NULL,'2026-03-23 10:13:56'),
('74a7733f-e3d3-48f0-b558-466bd36f08f5','Design','UI/UX and product design', NULL,'2026-03-23 10:13:56'),
('5e911d64-dece-45f1-8d60-9be7eea3f9c3','Marketing','Growth and communications', NULL,'2026-03-23 10:13:56'),
('97cc59b3-ede6-4071-aed3-cb489027b650','HR','Human resources and operations', NULL,'2026-03-23 10:13:56');

-- INTERNS
INSERT INTO public.interns (id, user_id, department_id, mentor_id, status, start_date, end_date, college, position_title, created_at, cgpa, city, skills, languages, experience_level) VALUES
('3e8ce5cc-9837-4cb8-be22-dc6241d9a000','9df80d23-431e-4115-a42d-d9a1b25e4f1b','ffa47aef-9ebb-47f1-a366-79ecaba022b6','4253d38d-4a1d-4ce3-9419-342a930d1859','active','2025-06-01','2025-08-31','PDEU Ahmedabad','Frontend Intern','2026-03-23 10:13:56',9.2,'Ahmedabad',ARRAY['React','JavaScript','CSS'],NULL,NULL),
('d50080b0-8af6-428a-b093-da937f2a750a','b861be4b-c936-4460-b532-1800ad2abe12','74a7733f-e3d3-48f0-b558-466bd36f08f5','ea0f3808-74ba-470d-a6c1-93abe63efc16','active','2025-06-01','2025-08-31','GTU Ahmedabad','UI/UX Intern','2026-03-23 10:13:56',8.5,'Surat',ARRAY['Figma','UI Design','Illustrator'],NULL,NULL),
('d87b4932-304f-415d-9812-30dda92874de','a70a1cc0-7039-423d-91a3-5e73cf834b30','ffa47aef-9ebb-47f1-a366-79ecaba022b6','4253d38d-4a1d-4ce3-9419-342a930d1859','active','2025-05-01','2025-07-31','DAIICT Gandhinagar','Backend Intern','2026-03-23 10:13:56',7.8,'Gandhinagar',ARRAY['Python','Django','PostgreSQL'],NULL,NULL),
('1e61a957-43f3-4ae8-97f2-e4dbeedc5939','8f4d9963-2d17-4037-932c-ea5061a967a5','5e911d64-dece-45f1-8d60-9be7eea3f9c3','ea0f3808-74ba-470d-a6c1-93abe63efc16','completed','2025-01-01','2025-03-31','LD College Ahmedabad','Marketing Intern','2026-03-23 10:13:56',9.5,'Ahmedabad',ARRAY['Marketing','SEO','Content Writing'],NULL,NULL),
('d174344d-c347-49ac-b3b9-3ea2c49969e0','16707d7f-8979-441d-b52e-221a2b8f63fd','97cc59b3-ede6-4071-aed3-cb489027b650','4253d38d-4a1d-4ce3-9419-342a930d1859','active','2025-07-01','2025-09-30','Nirma University','HR Intern','2026-03-23 10:13:56',8.1,'Vadodara',ARRAY['HR','Recruitment','Excel'],NULL,NULL);

-- ATTENDANCE
INSERT INTO public.attendance (id, intern_id, date, check_in, check_out, status, notes) VALUES
('0895955c-d99b-4e55-84d0-f7fbce931e3e','3e8ce5cc-9837-4cb8-be22-dc6241d9a000','2025-07-01','09:05:00','18:10:00','present',NULL),
('bf5d50fb-a810-478b-ba3c-9408442f54de','3e8ce5cc-9837-4cb8-be22-dc6241d9a000','2025-07-02','09:15:00','18:00:00','present',NULL),
('ec0fcee0-39f8-416b-a5f1-9c8a2cd70aff','3e8ce5cc-9837-4cb8-be22-dc6241d9a000','2025-07-03',NULL,NULL,'absent',NULL),
('2115e8f1-c6e6-4434-b7c4-9d979db684f6','d50080b0-8af6-428a-b093-da937f2a750a','2025-07-01','09:00:00','18:00:00','present',NULL),
('5e977848-e6ca-488d-8535-b93c0b9c1139','d50080b0-8af6-428a-b093-da937f2a750a','2025-07-02','09:30:00','14:00:00','half_day',NULL),
('d0f193cb-3947-40a3-a248-be23f95192e9','d87b4932-304f-415d-9812-30dda92874de','2025-07-01','10:00:00','18:30:00','wfh',NULL),
('48cd5392-f76f-4801-9aef-e3972df30bf8','d87b4932-304f-415d-9812-30dda92874de','2025-07-02','09:00:00','18:00:00','present',NULL),
('423be3b0-36f7-42e4-a816-659718e8c612','d174344d-c347-49ac-b3b9-3ea2c49969e0','2025-07-01','09:10:00','18:05:00','present',NULL);

-- ANNOUNCEMENTS
INSERT INTO public.announcements (id, created_by, title, body, audience, created_at) VALUES
('18279361-1cfc-4332-aa8a-80794111519b','16d14e29-32fa-4bf8-80c7-96745dc0af92','Welcome to Summer Internship 2025!','We are excited to welcome all our interns for the Summer 2025 batch.','all','2026-03-23 10:13:56'),
('f61db5f9-6dd5-4400-8a0d-37f6324bc892','16d14e29-32fa-4bf8-80c7-96745dc0af92','Weekly standup schedule','All interns must attend Monday 10am standup.','interns_only','2026-03-23 10:13:56'),
('99eba78f-71a6-474e-b56e-ba0ed0608e66','16d14e29-32fa-4bf8-80c7-96745dc0af92','Mentor evaluation reminder','Please submit intern evaluations for Week 4 by Friday.','mentors_only','2026-03-23 10:13:56');
