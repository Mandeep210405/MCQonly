# 📂 AI Test Module - Complete File Reference

## 📍 NEW FILES CREATED - Copy/Merge These Into Your Project

### 🗄️ Database Schema (1 file)
Located in **project root**:
- **File:** `ai_test_schema.sql`
  - 📝 Creates 4 new database tables
  - 🔧 Creates indexes for performance
  - ⚙️ Add proper constraints and relationships
  - ✅ Execute this in Hasura console first!

---

### 🔌 API Endpoints (6 files)
Located in **`frontend/app/api/tests/`**:

#### 1. **`route.js`** - Test Sessions Management
- **Purpose:** Create, read, update test sessions
- **Endpoints:**
  - `GET /api/tests` - Fetch all tests (with filters)
  - `POST /api/tests` - Create new test session
  - `PATCH /api/tests` - Update test status
- **Authentication:** Requires session
- **Role-Based:** Admin/HR/Mentor can conduct tests

#### 2. **`generate-questions/route.js`** - AI Question Generation
- **Purpose:** Generate 10 AI questions using OpenAI
- **Endpoint:** `POST /api/tests/generate-questions`
- **Call:** After creating test session
- **Input:** 
  ```json
  {
    "session_id": "uuid",
    "intern_id": "uuid",
    "test_type": "mcq|coding|descriptive|mixed",
    "num_questions": 10
  }
  ```
- **OpenAI Integration:** Uses GPT-3.5 Turbo
- **Output:** Stores questions in database

#### 3. **`responses/route.js`** - Test Responses Storage
- **Purpose:** Save intern answers during test
- **Endpoints:**
  - `GET /api/tests/responses?session_id=UUID` - Get test with questions
  - `POST /api/tests/responses` - Save single or batch responses
- **Auto-Save:** Called every 30 seconds
- **Conflict Handling:** Updates existing response if re-answered

#### 4. **`grade/route.js`** - Test Grading & Evaluation
- **Purpose:** Auto-grade test and generate results
- **Endpoint:** `POST /api/tests/grade`
- **Grading Logic:**
  - MCQ: Auto-graded (instant)
  - Coding/Descriptive: AI-graded (OpenAI)
- **Output:** 
  ```json
  {
    "result": { "grade": "A", "percentage": 95 },
    "detailed_results": [...],
    "summary": { ... }
  }
  ```
- **Grade System:** A=90%+, B=80-89%, C=70-79%, D=60-69%, F=<60%

#### 5. **`results/route.js`** - Results Retrieval & Analytics
- **Purpose:** Fetch test results and analytics
- **Endpoints:**
  - `GET /api/tests/results?session_id=UUID` - Single test result
  - `GET /api/tests/results?intern_id=UUID` - Intern's all results
  - `GET /api/tests/results?analytics=true` - Performance analytics
- **Role-Based:** Mentors see only their assigned interns
- **Analytics:** Total tests, average scores, grade distribution

#### 6. **`[id]/route.js`** - Individual Test Operations
- **Purpose:** Get or delete specific test
- **Endpoints:**
  - `GET /api/tests/[id]` - Get test details
  - `DELETE /api/tests/[id]` - Delete test (admin only)
- **Permission:** Only admin can delete

---

### 🎨 Frontend Pages (4 files)
Located in **`frontend/app/(protected)/tests/`**:

#### 1. **`page.jsx`** - Test List & Overview
- **Route:** `/tests`
- **Features:**
  - Lists all tests user has access to
  - Shows test status (scheduled, in_progress, submitted, completed)
  - "Conduct Test" button for admin/HR/mentor
  - "View Result" link for completed tests
  - Delete button (admin only)
- **Accessible By:** All roles

#### 2. **`conduct/page.jsx`** - Conduct New Test
- **Route:** `/tests/conduct`
- **Features:**
  - Select intern from dropdown
  - Choose test type (MCQ/Coding/Descriptive/Mixed)
  - Create test session
  - Auto-generate questions
  - Redirect to test taking page
- **Accessible By:** Admin, HR, Mentor only

#### 3. **`[id]/page.jsx`** - Take Test Interface
- **Route:** `/tests/[id]`
- **Features:**
  - 30-minute countdown timer
  - Question navigation (Previous/Next)
  - Question display based on type:
    - MCQ: Radio button options
    - Coding: Code editor (monospace)
    - Descriptive: Large textarea
  - All questions grid
  - Answered counter
  - Auto-save every 30 seconds
  - Auto-submit on timer expiry
  - Manual submit button
- **Accessible By:** Assigned interns only

#### 4. **`results/page.jsx`** - Test Results & Analytics
- **Route:** `/tests/results`
- **Tabs:**
  - **Results Tab:** 
    - Score card (Grade, Percentage, Points)
    - Progress bar
    - AI feedback
    - Question-by-question breakdown
  - **Analytics Tab:** 
    - Total tests count
    - Average percentage
    - Grade distribution chart
- **Accessible By:** Admin/HR (all results), Mentor (their interns), Interns (own results)

---

### 🎛️ Updated Components (1 file)
Located in **`frontend/components/`**:

#### **`Sidebar.js`** - Navigation Menu
- **Added:** "AI Tests" menu item
- **Icon:** BookOpen from lucide-react
- **Route:** `/tests`
- **Placement:** Between "Evaluations" and "Departments"
- **Visible To:** All roles (but interns see different features inside)

---

## 📋 QUICK REFERENCE - File Locations

```
intern_management_sttl/
├── 📄 ai_test_schema.sql ......................... [NEW] SQL Migrations
├── 📄 AI_TEST_MODULE_SETUP.md ................... [NEW] Setup Guide
├── 📄 AI_TEST_MODULE_FILES.md ................... [NEW] This file
│
├── frontend/
│   ├── components/
│   │   └── ✏️ Sidebar.js ........................ [MODIFIED] Added AI Tests link
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── tests/
│   │   │       ├── 📄 route.js ................. [NEW] Session management
│   │   │       ├── 📄 [id]/route.js ........... [NEW] Get/Delete specific test
│   │   │       ├── 📄 generate-questions/
│   │   │       │   └── route.js ............... [NEW] AI Question generation
│   │   │       ├── 📄 responses/
│   │   │       │   └── route.js ............... [NEW] Store test answers
│   │   │       ├── 📄 grade/
│   │   │       │   └── route.js ............... [NEW] Auto-grading
│   │   │       └── 📄 results/
│   │   │           └── route.js ............... [NEW] Results & Analytics
│   │   │
│   │   └── (protected)/
│   │       └── tests/
│   │           ├── 📄 page.jsx ................ [NEW] Test list page
│   │           ├── 📄 conduct/
│   │           │   └── page.jsx .............. [NEW] Create test
│   │           ├── 📄 [id]/
│   │           │   └── page.jsx .............. [NEW] Take test
│   │           └── 📄 results/
│   │               └── page.jsx .............. [NEW] View results
│   │
│   └── .env.local (.gitignore) ................. [MODIFY] Add OPENAI_API_KEY
│
└── docker-compose.yml (unchanged)
    chatbot_service/ (unchanged)
    schema.sql (unchanged - don't touch!)
```

---

## 🔧 Environment Variables to Add

**File:** `frontend/.env.local`

```env
# REQUIRED - OpenAI API Configuration
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXX

# Existing variables (keep these)
HASURA_URL=http://localhost:9090/v1/graphql
HASURA_ADMIN_SECRET=sttl6
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_existing_secret
```

⚠️ **Security Note:** 
- Never commit `.env.local` to git
- Keep API key private
- Rotate key if exposed

---

## 📊 Database Schema Summary

### Table: `ai_test_sessions`
```sql
Columns:
- id (UUID, PK)
- intern_id (FK to interns)
- conducted_by (FK to users)
- status (scheduled, in_progress, submitted, completed)
- test_type (mcq, coding, descriptive, mixed)
- scheduled_at, started_at, submitted_at, completed_at (timestamps)
- duration_minutes (default: 30)
- created_at, updated_at (timestamps)
```

### Table: `test_questions`
```sql
Columns:
- id (UUID, PK)
- session_id (FK to ai_test_sessions)
- question_number (1-10)
- question_text (text)
- question_type (mcq, coding, descriptive)
- difficulty (easy, medium, hard)
- options (JSONB, for MCQ: {"a": "option", "b": "option"})
- correct_answer (for MCQ only)
- expected_output (for coding)
- rubric (for coding/descriptive)
- points (default: 10)
- created_at
```

### Table: `test_responses`
```sql
Columns:
- id (UUID, PK)
- session_id (FK to ai_test_sessions)
- question_id (FK to test_questions)
- intern_response (text - the answer)
- submitted_at (timestamp)
```

### Table: `test_results`
```sql
Columns:
- id (UUID, PK)
- session_id (FK to ai_test_sessions)
- intern_id (FK to interns)
- total_points (integer)
- obtained_points (integer)
- percentage (numeric)
- grade (A, B, C, D, F)
- ai_feedback (text)
- detailed_results (JSONB - per-question scores)
- evaluated_at, created_at (timestamps)
```

---

## 🎯 Integration Checklist

- [ ] Copy `ai_test_schema.sql` to project root
- [ ] Execute SQL in Hasura console
- [ ] Track all 4 new tables in Hasura
- [ ] Set Hasura permissions for each table & role
- [ ] Create `frontend/app/api/tests/` directory
- [ ] Copy all API endpoint files
- [ ] Create `frontend/app/(protected)/tests/` directory
- [ ] Copy all frontend page files
- [ ] Update `frontend/components/Sidebar.js`
- [ ] Add `OPENAI_API_KEY` to `.env.local`
- [ ] Restart frontend (`npm run dev`)
- [ ] Verify "AI Tests" in sidebar
- [ ] Test creating a test session
- [ ] Test question generation
- [ ] Test taking interface
- [ ] Test grading & results

---

## ✅ Verification Commands

```bash
# Check if tables exist in PostgreSQL
docker exec intern_postgres psql -U postgres -d intern_management -c "
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema='public' AND table_name LIKE '%test%';
"

# Check API endpoints are working
curl -X GET http://localhost:3000/api/tests \
  -H "Cookie: your_auth_session_cookie"

# Verify OpenAI key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| API endpoints 404 | Ensure files in correct directory structure with exact names |
| OpenAI errors | Check `.env.local` has correct API key, restart frontend |
| Questions not generating | Verify OpenAI account has credit, API key is active |
| Sidebar doesn't show test link | Restart frontend, clear browser cache |
| Results not showing | Check Hasura permissions for all 4 tables |
| Timer not working | Clear browser localStorage, check network tab |
| Grading taking too long | OpenAI API may be slow, check status page |

---

## 📞 Support Resources

1. **OpenAI API Status:** https://status.openai.com/
2. **Hasura Console:** http://localhost:9090/console
3. **PostgreSQL Logs:** `docker logs intern_postgres`
4. **Browser DevTools:** F12 → Network tab for API debugging
5. **Next.js Console:** Check terminal output for `npm run dev`

---

**🎉 All files are ready for integration!**

Follow the setup guide in `AI_TEST_MODULE_SETUP.md` and use this file as reference for exact locations.
