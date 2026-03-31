import json
import requests

URL = "http://localhost:8000/api/v0/ask"

questions = [
    "How many interns are active?",
    "List all departments.",
    "How many students have a CGPA above 6?",
    "How many students are skilled in Python and Next.js?",
    "Show interns in the Engineering department.",
    "List interns with CGPA above 8.",
    "Which mentors have more than 1 intern assigned?",
    "Show attendance count by status for July 2025.",
    "List all tasks with status todo.",
    "How many tasks are pending?",
    "Show the five most recent interns.",
    "List interns and their mentors.",
    "How many evaluations exist?",
    "Show average overall_score from evaluations.",
    "List interns with skills containing React.",
    "List interns from Ahmedabad.",
    "How many interns are completed?",
    "Show announcements for interns_only audience.",
    "List interns with experience_level beginner.",
    "Show total interns per department."
]

results = []
for idx, q in enumerate(questions, start=1):
    try:
        response = requests.post(URL, json={"question": q}, timeout=60)
        ok = response.ok
        payload = response.json() if response.content else {}
        sql = payload.get("sql") if isinstance(payload, dict) else None
        results.append({
            "id": idx,
            "question": q,
            "status": response.status_code,
            "ok": ok,
            "has_sql": bool(sql),
        })
    except Exception as exc:
        results.append({
            "id": idx,
            "question": q,
            "status": "error",
            "ok": False,
            "has_sql": False,
            "error": str(exc),
        })

print(json.dumps(results, indent=2))
