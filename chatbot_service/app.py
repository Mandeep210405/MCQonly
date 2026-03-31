"""
app.py
======
FastAPI application server for the InternHub Text-to-SQL chatbot.

AUTHENTICATION REMOVED: In testing mode as requested.
This allows any user to access the chatbot and run SQL queries.
"""

import os
import logging
import pandas as pd
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from vanna_setup import vn, connect_to_postgres, train_relationships

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)

# ── Config ─────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
]

# ── Models ─────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str

def normalize_sql(sql: str) -> str:
    if not sql:
        return ""
    cleaned = sql.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("sql\n", "", 1).strip()
    return cleaned

def is_select_sql(sql: str) -> bool:
    lowered = sql.strip().lower()
    return lowered.startswith("select") or lowered.startswith("with")

def enforce_sql_prompt(question: str) -> str:
    return (
        "Return ONLY a PostgreSQL SELECT query. "
        "Do not include explanations or extra text. "
        f"Question: {question}"
    )

# ── Lifespan ───────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up InternHub AI Server (TESTING MODE - AUTH DISABLED)")
    try:
        connect_to_postgres()
        train_relationships()
    except Exception as e:
        logger.error(f"Initialization failed: {e}")
    yield
    logger.info("Shutting down InternHub AI Server.")

# ── App Init ───────────────────────────────────────────────────────────
app = FastAPI(lifespan=lifespan, title="InternHub Vanna 2.0 API (Testing)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Endpoints ──────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "InternHub AI Server is running",
        "version": "1.0.0",
        "endpoints": ["/health", "/docs", "/api/v0/config", "/api/v0/generate_sql", "/api/v0/run_sql", "/api/v0/ask"]
    }

@app.get("/api/v0/config")
async def get_config():
    """Vanna-chat compatible discovery endpoint."""
    return {
        "api_base":    "/api/v0",
        "product":     "InternHub AI SQL",
        "llm_model":   os.getenv("GROQ_MODEL", "llama3-70b-8192"),
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/v0/generate_sql")
async def generate_sql(payload: ChatRequest):
    """Generate SQL from natural language (Auth Disabled)."""
    try:
        sql = normalize_sql(vn.generate_sql(question=payload.question))
        if not is_select_sql(sql):
            sql = normalize_sql(vn.generate_sql(question=enforce_sql_prompt(payload.question)))
        if not is_select_sql(sql):
            raise HTTPException(422, "Model did not return SQL. Please rephrase the question.")
        return {"sql": sql}
    except Exception as e:
        logger.error(f"SQL generation failed: {e}")
        raise HTTPException(500, f"Error generating SQL: {str(e)}")

@app.post("/api/v0/run_sql")
async def run_sql(payload: Dict[str, str]):
    """Execute raw SQL result (Auth Disabled)."""
    sql = payload.get("sql")
    if not sql:
        raise HTTPException(400, "SQL missing")

    sql = normalize_sql(sql)
    if not is_select_sql(sql):
        raise HTTPException(422, "Only SELECT queries are allowed.")
    
    try:
        df = vn.run_sql(sql)
        if df is None or df.empty:
            return {"results": [], "columns": []}
        
        return {
            "results": df.to_dict(orient="records"),
            "columns": list(df.columns)
        }
    except Exception as e:
        logger.error(f"SQL execution failed: {e}")
        raise HTTPException(500, f"Database error: {str(e)}")

@app.post("/api/v0/ask")
async def ask(payload: ChatRequest):
    """Full natural language query lifecycle (Auth Disabled)."""
    try:
        sql = normalize_sql(vn.generate_sql(question=payload.question))
        if not is_select_sql(sql):
            sql = normalize_sql(vn.generate_sql(question=enforce_sql_prompt(payload.question)))
        if not is_select_sql(sql):
            raise HTTPException(422, "Model did not return SQL. Please rephrase the question.")
        df = vn.run_sql(sql)
        
        results = []
        columns = []
        if df is not None and not df.empty:
            results = df.to_dict(orient="records")
            columns = list(df.columns)
        
        return {
            "question": payload.question,
            "sql": sql,
            "results": results,
            "columns": columns
        }
    except Exception as e:
        logger.error(f"Ask query failed: {e}")
        raise HTTPException(500, f"Error processing query: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
