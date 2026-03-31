# ⚡ AI Test Module - Quick Start (5 Minutes)

## 🚀 What You Just Got
A complete AI-powered test system with:
- ✅ 10 AI-generated questions per test (customized to intern profile)
- ✅ 30-minute timer with auto-save
- ✅ 3 question types: MCQ, Coding, Descriptive  
- ✅ Auto-grading (MCQ instant, Coding/Descriptive via AI)
- ✅ Full role-based access control
- ✅ Analytics dashboard

---

## 🔴 CRITICAL - DO THIS FIRST

### 1. Add OpenAI Key (5 min)
File: `frontend/.env.local`
```env
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```
Get key: https://platform.openai.com/account/api-keys

### 2. Execute SQL (2 min)
File: `ai_test_schema.sql` (in project root)
1. Copy entire file content
2. Open Hasura: http://localhost:9090/console
3. Go to SQL section
4. Paste & Execute
5. ✅ Done

### 3. Track Tables in Hasura (2 min)
1. Go to Data → Schema
2. Click "Track" for each under "Untracked tables":
   - `ai_test_sessions`
   - `test_questions`
   - `test_responses`
   - `test_results`

### 4. Restart Frontend (1 min)
```bash
cd frontend
npm run dev
```

---

## ✅ Test It Works (2 min)

1. Login to http://localhost:3000
2. Sidebar → Click "AI Tests" ✅
3. Admin/HR/Mentor → Click "Conduct Test" ✅
4. Select intern → Choose test type → Click "Create & Generate Questions"
5. ⏳ Wait 30-60 seconds for AI to generate questions
6. Test interface loads → Click "Start Test" ✅

---

## 📁 File Checklist

**Created Files (all ready!):**
- ✅ SQL: `ai_test_schema.sql`
- ✅ Docs: `AI_TEST_MODULE_SETUP.md`
- ✅ Docs: `AI_TEST_MODULE_FILES.md`
- ✅ APIs: 6 endpoint files in `frontend/app/api/tests/`
- ✅ Pages: 4 page files in `frontend/app/(protected)/tests/`

**Modified Files:**
- ⚠️ `frontend/components/Sidebar.js` (minimal change - just added menu item)

---

## 🆘 IF SOMETHING DOESN'T WORK

| Problem | Solution |
|---------|----------|
| No "AI Tests" in sidebar | Restart: `npm run dev` in new terminal |
| OpenAI errors | Check `.env.local` has key, restart frontend |
| Questions don't generate | Verify OpenAI account has credits |
| Timer doesn't work | Clear browser storage (Ctrl+Shift+Delete) |
| Can't create test | Check Hasura tables are tracked |
| Access denied | Verify mentor is assigned to intern |

---

## 📚 Full Setup Guide
See: `AI_TEST_MODULE_SETUP.md`

## 📂 File Details  
See: `AI_TEST_MODULE_FILES.md`

---

## 🎯 Next Steps

**For Admin/HR/Mentor:**
1. Navigate to "AI Tests"
2. Click "Conduct Test"
3. Select intern
4. Choose test type (Mixed = 50% MCQ, 30% Coding, 20% Descriptive)
5. System generates 10 tailored questions
6. Done! Test ready to take

**For Interns:**
1. Receive test link
2. Take 30-min test
3. Auto-grading runs
4. Results shown with AI feedback

---

## 💡 Pro Tips

- Test types: `mcq` (fast), `coding` (realistic), `descriptive` (essay), `mixed` (balanced)
- Auto-saves every 30 seconds
- Timer auto-submits when it expires
- Admin can delete any test
- HR cannot delete tests
- Mentor can only test their assigned interns

---

**🎉 Ready!** You now have a production-grade AI test system.

Questions? Check browser console (F12) for errors or review the full setup guide.
