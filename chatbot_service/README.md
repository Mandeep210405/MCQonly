# InternHub Chatbot Service

FastAPI service that powers the InternHub AI chatbot using Vanna + Groq. This service generates SQL from natural-language questions and executes the SQL against the InternHub PostgreSQL database.

## Prerequisites
- Python 3.10+
- PostgreSQL running (see root docker-compose.yml)
- Groq API key

## Setup
1. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Copy the environment template and fill in values:
   ```bash
   copy .env.example .env
   ```

3. Update `.env` with:
   - `GROQ_API_KEY`
   - DB connection details (defaults align with `intern_management_sttl` Docker)

## Train the Agent
Run once after the database schema is ready:
```bash
python train_agent.py
```

## Run the Service
```bash
python app.py
```

Default base URL: `http://localhost:8000`

## Integration with Frontend
The Next.js API route calls this service:
- Set `VANNA_API_BASE=http://localhost:8000` in the Next.js environment.
- Endpoint used: `POST /api/v0/ask`.

## Notes
- Do not commit `.env` or `chroma_db/`.
- For RBAC, the Next.js API route enforces roles and department scoping before returning results.
