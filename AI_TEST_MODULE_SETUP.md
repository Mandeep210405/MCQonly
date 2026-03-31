# 📚 AI Test Module - Complete Setup & Integration Guide

## 🎯 Overview
This guide provides step-by-step instructions to integrate the complete AI-powered Test Module into your Intern Management System. The module allows Admin, HR, and Mentors to conduct AI-generated tests for interns with automatic grading using OpenAI.

---

## 📋 STEP 1: Database Setup

### 1.1 Execute SQL Migration
1. Open your PostgreSQL client or Hasura console
2. Navigate to: **SQL** section in Hasura (http://localhost:9090)
3. Copy the entire content from: `ai_test_schema.sql` (in your project root)
4. Paste and execute the SQL
5. Wait for completion (no errors should appear)

**What gets created:**
- ✅ `ai_test_sessions` - Test session metadata
- ✅ `test_questions` - AI-generated questions  
- ✅ `test_responses` - Student answers
- ✅ `test_results` - Final scores and feedback
- ✅ Indexes for performance

### 1.2 Add Tables to Hasura
1. Go to Hasura Console: http://localhost:9090/console
2. Navigate to **Data → Schema**
3. Under "Untracked tables", you should see:
   - `ai_test_sessions`
   - `test_questions`
   - `test_responses`
   - `test_results`
4. Click "Track" for each table
5. For each table, go to **Permissions** and set:
   - **Admin role**: SELECT, INSERT, UPDATE, DELETE all records
   - **HR role**: SELECT all, INSERT for any intern
   - **Mentor role**: SELECT/INSERT only for interns assigned to them
   - **Intern role**: SELECT own results only

---

## 🔑 STEP 2: Environment Variables Setup

### 2.1 Update `.env.local` in `frontend/` folder

Add these variables:

```env
# OpenAI Configuration (REQUIRED for test generation and grading)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Keep your existing configuration and add above
HASURA_URL=http://localhost:9090/v1/graphql
HASURA_ADMIN_SECRET=sttl6
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key
```

**How to get `OPENAI_API_KEY`:**
1. Go to https://platform.openai.com/account/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-`)
4. Paste into `.env.local`
5. ⚠️ **DO NOT commit this to git** (it will be auto-ignored)

### 2.2 Update `.env` in `chatbot_service/` (if exists)
If you have Python service using AI, also add there:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📁 STEP 3: File Placement Verification

### ✅ Files Already Created (No action needed)

**API Endpoints** (in `frontend/app/api/tests/`):
```
✅ route.js                      (Sessions CRUD)
✅ generate-questions/route.js   (AI question generation)
✅ responses/route.js           (Store test answers)
✅ grade/route.js               (Auto-grading)
✅ results/route.js             (View results & analytics)
✅ [id]/route.js               (Get/delete specific test)
```

**Frontend Pages** (in `frontend/app/(protected)/tests/`):
```
✅ page.jsx                 (Test list & overview)
✅ conduct/page.jsx        (Create new test)
✅ [id]/page.jsx           (Take test interface)
✅ results/page.jsx        (View test results)
```

**Updated Components**:
```
✅ frontend/components/Sidebar.js (Added "AI Tests" menu)
```

**Database**:
```
✅ ai_test_schema.sql (in project root)
```

---

## 🚀 STEP 4: Verification & Testing

### 4.1 Restart Services
```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# Should start on http://localhost:3000

# Terminal 2: Keep Hasura running
docker-compose up -d

# Terminal 3: Database (already running in docker)
```

### 4.2 Test Navigation
1. Login to http://localhost:3000
2. Sidebar should show "AI Tests" menu item (for Admin/HR/Mentor)
3. Click "AI Tests" → should load tests page

### 4.3 Test Creation (Admin/HR)
1. Click "AI Tests"
2. Click "Conduct Test" button
3. Select an intern
4. Choose test type (MCQ / Coding / Descriptive / Mixed)
5. Click "Create & Generate Questions"
6. ⏳ Wait 30-60 seconds (AI is generating questions)
7. Test page should load automatically

### 4.4 OpenAI API Check
If questions don't generate:
1. Check Hasura logs: `docker logs hasura_engine`
2. Check browser console (F12) for errors
3. Verify `OPENAI_API_KEY` is set correctly
4. Test API key at: https://platform.openai.com/account/api-keys (should show "Active")

---

## 🔐 STEP 5: Role-Based Permissions

### Admin ✅
- ✅ Create tests for ANY intern
- ✅ View ALL test results
- ✅ Delete ANY test
- ✅ Company-wide analytics
- ✅ Manage all users

### HR ✅
- ✅ Create tests for ANY intern (but cannot modify scores)
- ✅ View ALL test results (read-only)
- ✅ View analytics for ALL interns
- ❌ Cannot delete tests
- ❌ Cannot modify scores

### Mentor ✅
- ✅ Create tests ONLY for assigned interns
- ✅ View results ONLY for their interns
- ✅ View analytics ONLY for their interns
- ❌ Cannot delete tests
- ❌ Cannot modify scores
- ❌ Cannot create tests for other mentors' interns

### Intern ✅
- ✅ Take assigned tests (30-minute timer)
- ✅ View own test results
- ✅ View own performance analytics
- ❌ Cannot create tests
- ❌ Cannot view other interns' tests

---

## 🎯 STEP 6: Test Workflow

### For Admin/HR/Mentor to Conduct Test:
```
1. Navigate to "AI Tests"
2. Click "Conduct Test" button
3. Select intern from dropdown
4. Choose test type:
   - MCQ: 100% multiple choice
   - Coding: 100% coding questions
   - Descriptive: 100% descriptive/essay
   - Mixed: 50% MCQ, 30% Coding, 20% Descriptive
5. System generates 10 AI questions tailored to intern's profile
6. Click "Start Test" to begin
7. Timer starts (30 minutes)
8. Auto-saves every 30 seconds
9. Auto-submits when timer expires
10. Results available immediately after submission
```

### For Interns to Take Test:
```
1. Receive test link from mentor/HR/admin
2. Click link → Test interface loads
3. Review each question
4. Answer: MCQ (select option), Coding (write code), Descriptive (write answer)
5. Navigate using question numbers
6. All responses auto-save every 30 seconds
7. Click "Submit Test" or let timer expire
8. Auto-grading runs:
   - MCQ: Instant grading
   - Coding/Descriptive: AI grading (60-90 seconds)
9. Results shown with:
   - Final score & grade (A-F)
   - Per-question feedback
   - AI recommendations
```

---

## 📊 STEP 7: AI Grading System

### MCQ Questions (Auto-graded)
✅ Instant grading
✅ Checked against `correct_answer` field
✅ Full points if correct, 0 if incorrect

### Coding & Descriptive Questions (AI-graded)
🤖 Uses OpenAI GPT-3.5 Turbo
📋 Evaluates against rubric
⏱️ 60-90 seconds per response
✍️ Generates personalized feedback

### Grade Calculation
```
A: 90-100%
B: 80-89%
C: 70-79%
D: 60-69%
F: Below 60%
```

---

## 🛠️ TROUBLESHOOTING

### Issue: "OPENAI_API_KEY not configured"
**Solution:**
1. Verify `.env.local` exists in `frontend/` folder
2. Check key starts with `sk-proj-`
3. Restart frontend: `npm run dev` (in new terminal)
4. Clear browser cache (Ctrl+Shift+Delete)

### Issue: Questions don't generate
**Solution:**
1. Check OpenAI account has credits: https://platform.openai.com/account/billing/overview
2. Verify API key is active
3. Check account usage limits
4. Review browser console errors (F12)

### Issue: "Forbidden" or "Access Denied" errors
**Solution:**
1. For Mentor: Verify they're assigned to the intern
2. Check user role in database
3. Ensure table permissions are set correctly in Hasura

### Issue: Timer not working / auto-save failing
**Solution:**
1. Check browser console for errors
2. Verify API endpoints are returning 200 status
3. Clear localStorage and refresh
4. Ensure network connection is stable

### Issue: Grading never completes
**Solution:**
1. Check OpenAI API limits
2. Monitor network tab in browser (F12)
3. Check if API is slow (sometimes takes 2-3 minutes for complex answers)
4. Check `/api/tests/grade` endpoint is working

---

## 📈 API Reference

### Test Sessions
```
GET  /api/tests?conducted_by=UUID              Get all tests by admin/mentor
GET  /api/tests?intern_id=UUID                 Get tests for specific intern
POST /api/tests                                Create new test session
PATCH /api/tests                               Update test status
GET  /api/tests/[id]                          Get specific test
DELETE /api/tests/[id]                        Delete test (admin only)
```

### Questions & Responses
```
POST /api/tests/generate-questions             Generate AI questions
GET  /api/tests/responses?session_id=UUID      Get test with questions
POST /api/tests/responses                      Save intern responses
```

### Grading & Results
```
POST /api/tests/grade                          Auto-grade test
GET  /api/tests/results?session_id=UUID        Get test results
GET  /api/tests/results?intern_id=UUID         Get intern's all results
GET  /api/tests/results?analytics=true         Get analytics
```

---

## ✨ Features Summary

| Feature | Status | Role Access |
|---------|--------|-------------|
| AI Question Generation | ✅ | Admin, HR, Mentor |
| 10 Questions Per Test | ✅ | All |
| 30-Minute Timer | ✅ | Interns |
| Auto-Save Every 30s | ✅ | Interns |
| MCQ Auto-Grading | ✅ | System |
| AI Grading (Coding/Descriptive) | ✅ | OpenAI |
| Grade Calculation (A-F) | ✅ | System |
| Performance Analytics | ✅ | Admin, HR, Mentor |
| Role-Based Access Control | ✅ | All Roles |
| Test History | ✅ | All Users |

---

## 📞 Support & Debugging

**Check these logs if issues occur:**

1. **Frontend Console** (Press F12)
   - Look for red errors
   - Check Network tab for failed API calls

2. **Hasura Logs**
   ```bash
   docker logs hasura_engine
   ```

3. **PostgreSQL Logs**
   ```bash
   docker logs intern_postgres
   ```

4. **Network Requests**
   - Open DevTools → Network tab
   - Look for `/api/tests/*` endpoints
   - Check response status (should be 2xx)

---

## 🎉 Completion Checklist

- [ ] SQL schema executed successfully
- [ ] 4 tables tracked in Hasura
- [ ] `OPENAI_API_KEY` added to `.env.local`
- [ ] Frontend restarted (npm run dev)
- [ ] "AI Tests" menu visible in sidebar
- [ ] Can create test (Conduct Test button works)
- [ ] Can generate questions (no OpenAI errors)
- [ ] Can take test (30-minute timer works)
- [ ] Auto-save working (check localStorage)
- [ ] Test submission works
- [ ] Results display correctly
- [ ] Grading completes (A-F grades shown)

---

**🚀 Your AI Test Module is now ready!**

For any issues, check the Troubleshooting section or review browser console for specific error messages.
