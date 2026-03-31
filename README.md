# InternHub - Intern Management System with AI Chatbot

A full-stack intern management platform built with Next.js, FastAPI, PostgreSQL, and Hasura GraphQL Engine, featuring an AI-powered SQL chatbot using Vanna and Groq LLM.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Team & Contact](#team--contact)

---

## 🎯 Project Overview

InternHub is a comprehensive intern management system that helps organizations:

- Track intern attendance, tasks, and evaluations
- Manage departments and team assignments
- Analyze intern data with an intelligent AI chatbot
- Generate SQL queries using natural language

### Key Features

✅ Role-based access control (Admin, HR, Mentor, Intern)  
✅ Real-time attendance tracking  
✅ Task assignment and management  
✅ Performance evaluations  
✅ AI-powered natural language to SQL conversion  
✅ GraphQL API for all operations  
✅ Secure authentication with NextAuth

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15 (React)
- **Authentication**: NextAuth.js
- **GraphQL Client**: Apollo Client
- **Styling**: CSS Modules
- **Environment**: Node.js 18+

### Backend

- **Framework**: FastAPI (Python)
- **LLM Integration**: Groq API (Llama 3.1)
- **AI/ML**: Vanna (Text-to-SQL)
- **Vector Store**: ChromaDB

### Database & APIs

- **Database**: PostgreSQL 15
- **API Gateway**: Hasura GraphQL Engine v2.36.0
- **Containerization**: Docker & Docker Compose

---

## 📦 Prerequisites

Before you begin, ensure you have installed:

- **Docker & Docker Compose** (v20.10+)
  - [Install Docker](https://docs.docker.com/get-docker/)
  - [Install Docker Compose](https://docs.docker.com/compose/install/)

- **Node.js & npm** (v18 or higher)
  - [Download Node.js](https://nodejs.org/)

- **Python** (v3.9 or higher)
  - [Download Python](https://www.python.org/downloads/)

- **Git**
  - [Download Git](https://git-scm.com/)

### API Keys Required

- **GROQ_API_KEY**: Get from [groq.com](https://console.groq.com)
  - Required for AI chatbot functionality

---

## 📁 Project Structure

```
intern_management_sttl/
├── chatbot_service/          # Backend FastAPI application
│   ├── app.py               # Main FastAPI app
│   ├── vanna_setup.py       # Vanna LLM configuration
│   ├── requirements.txt      # Python dependencies
│   ├── .env                 # Environment variables (create this)
│   └── chroma_db/           # Vector store (auto-generated)
│
├── frontend/                # Next.js frontend application
│   ├── app/                # Next.js app directory
│   │   ├── api/            # API routes (NextAuth, chatbot)
│   │   └── (protected)/    # Protected routes (dashboard, etc.)
│   ├── components/         # React components
│   ├── lib/               # Utilities and helpers
│   ├── package.json       # npm dependencies
│   └── .env.local         # Environment variables (create this)
│
├── docker-compose.yml       # Docker services configuration
├── schema.sql              # Database schema
└── README.md              # This file
```

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
cd c:\vanna_chatbot
git clone <repository-url>
cd intern_management_sttl
```

### Step 2: Create Environment Files

#### Backend Environment (`.env`)

Create `chatbot_service/.env`:

```env
# Groq LLM API Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=intern_management
DB_USER=postgres
DB_PASSWORD=vidhikasttl

# ChromaDB Vector Store
CHROMA_PATH=./chroma_db

# JWT Authentication
JWT_SECRET=your-strong-random-secret-here
JWT_ALGORITHM=HS256

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Server
PORT=8001
```

#### Frontend Environment (`.env.local`)

Create `frontend/.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-strong-random-secret-here
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:9090/v1/graphql
VANNA_API_BASE=http://localhost:8001
```

### Step 3: Install Dependencies

#### Backend

```bash
cd chatbot_service
pip install -r requirements.txt
```

#### Frontend

```bash
cd ../frontend
npm install
```

### Step 4: Initialize Database

```bash
cd ..
# Start Docker services first
docker-compose up -d

# Wait for PostgreSQL to be ready (check docker logs)
# Then run schema
psql -U postgres -d intern_management -h localhost -p 5433 -f schema.sql
```

### Step 5: Track Tables in Hasura

```bash
# Run the table tracking script
python ../track_hasura_tables.py
```

Or use Hasura console at `http://localhost:9090` to track tables manually.

---

## 🔧 Environment Configuration

### 🔐 Generating Secure Secrets

```bash
# Generate JWT Secret
python -c "import secrets; print(secrets.token_hex(32))"

# Generate NextAuth Secret
openssl rand -base64 32
```

### 📝 Important Notes

- Never commit `.env` files to git
- Store secrets in a secure vault (e.g., GitHub Secrets, AWS Secrets Manager)
- Rotate API keys periodically
- Use strong passwords in production

---

## ▶️ Running the Application

### Option 1: Run Everything (Recommended for Development)

**Terminal 1 - Docker Services:**

```bash
cd intern_management_sttl
docker-compose up -d
```

**Terminal 2 - Backend:**

```bash
cd chatbot_service
$env:PORT=8001; python app.py
# Or on Linux/macOS:
# PORT=8001 python app.py
```

**Terminal 3 - Frontend:**

```bash
cd frontend
npm run dev
```

### Option 2: Run with Docker (Production)

```bash
# Build custom Docker images for backend and frontend (optional)
docker-compose -f docker-compose.yml up -d
```

### Verify Services are Running

```bash
# Check Docker containers
docker ps

# Check ports
# Frontend: http://localhost:3000
# Backend: http://localhost:8001
# Backend Docs: http://localhost:8001/docs
# Hasura Console: http://localhost:9090
# GraphQL Endpoint: http://localhost:9090/v1/graphql
```

---

## 📚 API Documentation

### Backend Health Check

```bash
GET http://localhost:8001/health
```

Response:

```json
{
  "status": "ok"
}
```

### AI Chatbot Endpoints

#### 1. Generate SQL from Natural Language

```bash
POST http://localhost:8001/api/v0/generate_sql
Content-Type: application/json

{
  "question": "How many interns are in the IT department?"
}
```

#### 2. Run SQL Query

```bash
POST http://localhost:8001/api/v0/run_sql
Content-Type: application/json

{
  "sql": "SELECT * FROM interns WHERE department_id = 'uuid-here';"
}
```

#### 3. Full Query Lifecycle

```bash
POST http://localhost:8001/api/v0/ask
Content-Type: application/json

{
  "question": "List all active interns and their mentors"
}
```

### Frontend API Routes

#### Authentication

```
POST /api/auth/callback/credentials
```

#### Chatbot

```
POST /api/chatbot/ask
```

#### GraphQL

```
POST http://localhost:9090/v1/graphql
Header: X-Hasura-Admin-Secret: sttl6
```

---

## 🗄️ Database Schema

### Tables

| Table             | Purpose                  |
| ----------------- | ------------------------ |
| `users`           | User accounts with roles |
| `departments`     | Department management    |
| `interns`         | Intern profiles          |
| `attendance`      | Attendance tracking      |
| `tasks`           | Task assignments         |
| `evaluations`     | Performance evaluations  |
| `announcements`   | Internal announcements   |
| `documents`       | Document storage         |
| `intern_feedback` | Feedback records         |

### Key Fields

**users**

- `id` (UUID)
- `email` (UNIQUE)
- `role` (admin, mentor, intern, hr)
- `password_hash`

**interns**

- `user_id` (FK → users)
- `department_id` (FK → departments)
- `mentor_id` (FK → users)
- `status` (active, completed, terminated)
- `start_date`, `end_date`

---

## 🏗️ Architecture

### System Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP/HTTPS
┌──────▼──────────────────┐
│     Next.js Frontend     │
│    (Port 3000)          │
│  - Authentication       │
│  - Dashboard            │
│  - Chatbot Widget       │
└──────┬──────────────────┘
       │ API Calls
┌──────▼──────────────────┐
│   NextAuth & Routes      │
│  - /api/auth/*          │
│  - /api/chatbot/*       │
└──────┬──────────────────┘
       │ REST API
┌──────▼──────────────────┐
│  FastAPI Backend         │
│  (Port 8001)            │
│  - SQL Generation       │
│  - Query Execution      │
│  - Vanna Integration    │
└──────┬──────────────────┘
       │ SQL
┌──────▼──────────────────┐
│  PostgreSQL Database     │
│  (Port 5433)            │
└─────────────────────────┘
       ▲
       │ GraphQL
┌──────┴──────────────────┐
│  Hasura GraphQL Engine   │
│  (Port 9090)            │
│  - GraphQL API          │
│  - Authentication Rules │
└─────────────────────────┘
```

### Data Flow for Chatbot

```
User Question
    ↓
Frontend Component (ChatbotWidget)
    ↓
/api/chatbot/ask (NextAuth protected)
    ↓
Backend /api/v0/ask (FastAPI)
    ↓
Vanna LLM (Groq API)
    ↓
Generate SQL
    ↓
Execute on PostgreSQL
    ↓
Format & Return Results
    ↓
Display in Frontend
```

---

## 🐛 Troubleshooting

### Docker Issues

**Problem**: "Cannot connect to Docker daemon"

```bash
# Solution: Start Docker service
# Windows: Start Docker Desktop
# Linux: sudo systemctl start docker
```

**Problem**: "Port already in use"

```bash
# Kill process using port
netstat -ano | findstr ":8001"
taskkill /PID <PID> /F
```

### Database Issues

**Problem**: "PSQL connection refused"

```bash
# Solution: Ensure PostgreSQL container is running
docker ps | grep postgres

# Restart containers
docker-compose restart
```

**Problem**: "Schema not found"

```bash
# Solution: Run schema file
docker exec intern_postgres psql -U postgres -d intern_management -f /path/to/schema.sql
```

### Backend Issues

**Problem**: "GROQ_API_KEY not set"

```bash
# Solution: Add to .env file in chatbot_service/
GROQ_API_KEY=your_valid_api_key
```

**Problem**: "Port 8001 already in use"

```bash
# Solution: Use different port or kill process
$env:PORT=8002; python app.py
```

### Frontend Issues

**Problem**: "Cannot find modules"

```bash
# Solution: Reinstall dependencies
cd frontend
npm install
npm run dev
```

**Problem**: "NEXTAUTH error"

```bash
# Solution: Ensure .env.local has NEXTAUTH_SECRET
# Regenerate with: openssl rand -base64 32
```

### Hasura Issues

**Problem**: "Tables not visible in GraphQL"

```bash
# Solution: Track tables manually
python track_hasura_tables.py
# Or visit: http://localhost:9090 → Data → Track Tables
```

---

## 🔄 Restart All Services (Quick Command)

### PowerShell (Windows)

```powershell
# Kill processes
$procs = Get-Process python, node -ErrorAction SilentlyContinue
$procs | ForEach-Object { $_.Kill() }

# Restart Docker
cd c:\vanna_chatbot\intern_management_sttl
docker-compose down
docker-compose up -d

# Start backend
cd chatbot_service
$env:PORT=8001; python app.py

# Start frontend (in new terminal)
cd ../frontend
npm run dev
```

### Bash (Linux/macOS)

```bash
# Kill processes
pkill -f "python app.py"
pkill -f "npm run dev"

# Restart Docker
cd ~/intern_management_sttl
docker-compose down
docker-compose up -d

# Start backend
cd chatbot_service
PORT=8001 python app.py

# Start frontend (in new terminal)
cd ../frontend
npm run dev
```

---

## 📊 Database Credentials

**Default Credentials** (Change in production):

| Service      | Username | Password    | Database          | Port |
| ------------ | -------- | ----------- | ----------------- | ---- |
| PostgreSQL   | postgres | vidhikasttl | intern_management | 5433 |
| Hasura Admin | -        | sttl6       | -                 | 9090 |

---

## 🔐 Security Checklist

- [ ] Change PostgreSQL password
- [ ] Change Hasura admin secret
- [ ] Generate new JWT_SECRET
- [ ] Generate new NEXTAUTH_SECRET
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Use secrets management service

---

## 📖 Useful Commands

### View Logs

```bash
# Docker logs
docker-compose logs -f postgres
docker-compose logs -f hasura

# Python backend
python app.py  # Logs appear in terminal

# Next.js frontend
npm run dev    # Logs appear in terminal
```

### Database Operations

```bash
# Connect to PostgreSQL
psql -U postgres -d intern_management -h localhost -p 5433

# Run SQL file
psql -U postgres -d intern_management -h localhost -p 5433 -f schema.sql

# Backup database
pg_dump -U postgres -h localhost -p 5433 intern_management > backup.sql

# Restore database
psql -U postgres -h localhost -p 5433 intern_management < backup.sql
```

### Test Endpoints

```bash
# Health check
curl http://localhost:8001/health

# GraphQL query
curl -X POST http://localhost:9090/v1/graphql \
  -H "Content-Type: application/json" \
  -H "X-Hasura-Admin-Secret: sttl6" \
  -d '{"query":"{ users { id email role } }"}'
```

---

## 📞 Team & Contact

For questions or issues, contact:

- **Project Owner**: [Your Name/Team]
- **Backend**: Python/FastAPI team
- **Frontend**: Next.js/React team
- **DevOps**: Docker/Infrastructure team

---

## 📝 License

[Add your license here]

---

## 🙏 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a Pull Request

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Hasura Docs](https://hasura.io/docs/)
- [Vanna AI Documentation](https://github.com/Vanna-AI/vanna)
- [Groq API](https://console.groq.com/)

---

**Last Updated**: March 30, 2026
**Version**: 1.0.0
