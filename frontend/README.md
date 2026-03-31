## Chatbot Verification

### Environment
- `VANNA_API_BASE` points to the FastAPI service (e.g., `http://localhost:8000`).
- `HASURA_URL` and `HASURA_ADMIN_SECRET` are configured for server-side API routes.

### Manual Checks
1. Admin: ask "How many students have a CGPA above 6?" and confirm cross-department results.
2. Mentor/HR: ask "How many interns are skilled in Python and Next.js?" and confirm SQL includes department filter.
3. Mentor/HR: ask a cross-department question; expect 403 with "Department scope not enforced in SQL" if missing filter.
4. Intern: verify chatbot button is not visible and `/api/chatbot/ask` returns 401.

