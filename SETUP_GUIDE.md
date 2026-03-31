# 📖 Detailed Setup Guide

Complete step-by-step guide to set up InternHub for the first time.

---

## 📋 Checklist

- [ ] Install Docker
- [ ] Install Node.js
- [ ] Install Python
- [ ] Clone repository
- [ ] Create .env files
- [ ] Install dependencies
- [ ] Start Docker services
- [ ] Initialize database
- [ ] Track tables in Hasura
- [ ] Start backend
- [ ] Start frontend
- [ ] Verify everything works

---

## 🔧 Step 1: Install Prerequisites

### Windows Users

#### 1.1 Install Docker Desktop

- Download: https://www.docker.com/products/docker-desktop
- Run installer and follow prompts
- Restart your computer
- Verify: Open PowerShell and run:
  ```powershell
  docker --version
  docker-compose --version
  ```

#### 1.2 Install Node.js

- Download: https://nodejs.org/ (LTS version recommended)
- Run installer and follow prompts
- Verify: Open PowerShell and run:
  ```powershell
  node --version
  npm --version
  ```

#### 1.3 Install Python

- Download: https://www.python.org/downloads/
- **IMPORTANT**: Check "Add Python to PATH" during installation
- Verify: Open PowerShell and run:
  ```powershell
  python --version
  pip --version
  ```

#### 1.4 Install Git (Optional but Recommended)

- Download: https://git-scm.com/download/win
- Run installer and follow prompts

### macOS Users

```bash
# Using Homebrew (recommended)
brew install docker docker-compose node python@3.11 git

# Verify installations
docker --version
docker-compose --version
node --version
python3 --version
git --version
```

### Linux Users (Ubuntu/Debian)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER
newgrp docker

# Install Node.js
sudo apt install nodejs npm -y

# Install Python
sudo apt install python3 python3-pip -y

# Install Git
sudo apt install git -y

# Verify installations
docker --version
docker-compose --version
node --version
python3 --version
git --version
```

---

## 📥 Step 2: Clone the Repository

### Using Git (Recommended)

```bash
# Navigate to your workspace
cd c:\work\     # Windows
cd ~/work/      # macOS/Linux

# Clone the repository
git clone https://github.com/your-org/intern_management_sttl.git

# Navigate to project
cd intern_management_sttl
```

### Without Git

- Download ZIP from GitHub
- Extract to your workspace
- Open terminal in extracted folder

---

## 🔐 Step 3: Create Environment Files

### 3.1 Backend .env File

1. Navigate to: `chatbot_service/`
2. Copy `.env.example` to `.env`
3. Open `.env` in your text editor
4. Fill in the values:

```env
# Get from: https://console.groq.com
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# Keep these as-is for local development
GROQ_MODEL=llama-3.1-8b-instant
DB_HOST=localhost
DB_PORT=5433
DB_NAME=intern_management
DB_USER=postgres
DB_PASSWORD=vidhikasttl
CHROMA_PATH=./chroma_db

# Generate a random string
JWT_SECRET=<generate-random-string>

ALLOWED_ORIGINS=http://localhost:3000
PORT=8001
```

**To generate JWT_SECRET:**

```bash
# Windows PowerShell
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))

# macOS/Linux
openssl rand -hex 32
```

### 3.2 Frontend .env.local File

1. Navigate to: `frontend/`
2. Copy `.env.example` to `.env.local`
3. Open `.env.local` in your text editor

```env
NEXTAUTH_URL=http://localhost:3000

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=<generate-random-string>

NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:9090/v1/graphql
VANNA_API_BASE=http://localhost:8001
```

⚠️ **Important**: Never commit `.env` files to Git!

---

## 📦 Step 4: Install Dependencies

### Backend Dependencies

```bash
# Navigate to backend
cd chatbot_service

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt

# Verify installation
pip list | grep -i vanna
```

### Frontend Dependencies

```bash
# Navigate to frontend
cd ../frontend

# Install npm packages
npm install

# Verify installation
npm list react nextauth

# Check that everything is OK
npm run build --dry-run
```

---

## 🐳 Step 5: Start Docker Services

### Start Docker

```bash
# Navigate to project root
cd intern_management_sttl

# Start services in background
docker-compose up -d

# Wait 15 seconds for services to start
# (especially PostgreSQL to be ready)
```

### Verify Docker Services

```bash
# List running containers
docker ps

# You should see:
# - intern_postgres (PostgreSQL)
# - hasura_engine (GraphQL)

# Check logs
docker logs intern_postgres
docker logs hasura_engine
```

**Troubleshooting Docker:**

```bash
# View container logs
docker-compose logs -f postgres

# Restart containers
docker-compose restart

# Stop containers
docker-compose down

# Start containers again
docker-compose up -d
```

---

## 🗄️ Step 6: Initialize Database

### Load Database Schema

```bash
# Option 1: Using psql directly
psql -U postgres -h localhost -p 5433 -d intern_management -f schema.sql

# Option 2: Using docker exec
docker exec intern_postgres psql -U postgres -d intern_management < schema.sql

# Option 3: Inside Docker container
docker exec -it intern_postgres bash
psql -U postgres -d intern_management
\i /path/to/schema.sql
```

### Verify Database Schema

```bash
# Connect to database
psql -U postgres -h localhost -p 5433 -d intern_management

# List tables
\dt public.*

# You should see:
# - users
# - departments
# - interns
# - attendance
# - tasks
# - evaluations
# - announcements
# - documents
# - intern_feedback

# Exit
\q
```

---

## 📍 Step 7: Track Tables in Hasura

### Option A: Automatic (Python Script)

```bash
# From project root
python track_hasura_tables.py

# Output should show:
# ✅ Tracked: users
# ✅ Tracked: departments
# ... etc
```

### Option B: Manual via Hasura Console

1. Open browser: http://localhost:9090
2. Click "Data" in top menu
3. Click "Create" button
4. For each table in "public" schema:
   - Click table name
   - Click "Track"
5. Refresh page

### Verify Tables are Tracked

```bash
# Open http://localhost:9090/graphiql
# Try this query:
query {
  users {
    id
    email
    role
  }
}

# Should return successfully (even if empty)
```

---

## ▶️ Step 8: Start Backend Service

### Using Python Directly

```bash
# Navigate to backend
cd chatbot_service

# Set port environment variable and run
# Windows PowerShell:
$env:PORT=8001; python app.py

# Windows Command Prompt:
set PORT=8001 && python app.py

# macOS/Linux:
PORT=8001 python app.py
```

### Expected Output

```
2026-03-30 12:54:11,520 [INFO] vanna_setup — InternHubVanna initialised | model=llama-3.1-8b-instant
INFO:     Started server process [7936]
INFO:     Waiting for application startup.
2026-03-30 12:54:11,705 [INFO] __main__ — Starting up InternHub AI Server (TESTING MODE - AUTH DISABLED)
2026-03-30 12:54:11,705 [INFO] vanna_setup — Connecting to Postgres db: intern_management at localhost:5433
2026-03-30 12:54:15,809 [INFO] vanna_setup — Successfully connected to PostgreSQL
INFO:     Application startup complete.
Uvicorn running on http://0.0.0.0:8001
```

### Test Backend

Open in browser or terminal:

- http://localhost:8001/health
- http://localhost:8001/docs (API Documentation)

---

## 🌐 Step 9: Start Frontend Service

### In a New Terminal

```bash
# Navigate to frontend
cd frontend

# Start development server
npm run dev

# Expected output:
# ▲ Next.js 15.0.0
# - Local:        http://localhost:3000
# - Environments: .env.local

# Ready in XXXms by next.js
```

### Test Frontend

Open in browser:

- http://localhost:3000

You should see the login page!

---

## ✅ Step 10: Verify Everything Works

### Checklist

- [ ] **Docker containers running**

  ```bash
  docker ps | grep -E "intern_postgres|hasura"
  ```

- [ ] **Backend responding**
  - Visit: http://localhost:8001/health
  - Should return: `{"status":"ok"}`

- [ ] **Frontend running**
  - Visit: http://localhost:3000
  - Should show login page

- [ ] **Hasura available**
  - Visit: http://localhost:9090
  - Should show Hasura console

- [ ] **Database connected**
  ```bash
  psql -U postgres -h localhost -p 5433 -d intern_management -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
  ```
  Should return: `9`

### If Everything Works!

🎉 **Congratulations!** Your setup is complete.

```bash
# You can now:
# 1. Login at http://localhost:3000
# 2. Use test credentials from database
# 3. Try the AI chatbot
# 4. Navigate the dashboard
```

---

## 🆘 Troubleshooting Step-by-Step

### Backend won't start

**Error**: "Port 8001 already in use"

```bash
# Find process using port
netstat -ano | findstr ":8001"

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
set PORT=8002 && python app.py
```

**Error**: "ModuleNotFoundError: No module named 'fastapi'"

```bash
# Reinstall dependencies
pip install -r requirements.txt
```

**Error**: "Cannot connect to PostgreSQL"

```bash
# Check Docker containers
docker ps

# If postgres not running
docker-compose up -d postgres

# Wait 10 seconds and retry
```

### Frontend won't start

**Error**: "Cannot find module 'react'"

```bash
# Clear and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Error**: "Port 3000 already in use"

```bash
# Use different port
npm run dev -- -p 3001
```

### Database issues

**Error**: "Database intern_management does not exist"

```bash
# Create database
docker exec intern_postgres createdb -U postgres intern_management

# Load schema
docker exec intern_postgres psql -U postgres -d intern_management < schema.sql
```

**Error**: "Tables not found in Hasura"

```bash
# Re-track tables
python track_hasura_tables.py

# Or manually visit http://localhost:9090 → Data → Track Tables
```

---

## 🔄 Common Operations

### Restart All Services

```bash
# Windows
Get-Process python, node | Stop-Process -Force
docker-compose restart

# Linux/macOS
pkill -f "python|node"
docker-compose restart
```

### View Logs

```bash
# Backend logs (already in terminal)
# (Just see the running terminal output)

# Docker logs
docker logs -f intern_postgres
docker logs -f hasura_engine

# Frontend logs (already in terminal)
# (Just see the running terminal output)
```

### Connect to Database

```bash
# Using psql
psql -U postgres -h localhost -p 5433 -d intern_management

# Or inside Docker
docker exec -it intern_postgres psql -U postgres -d intern_management
```

### Reset Everything

```bash
# ⚠️ This will delete all data!

# Stop services
docker-compose down -v

# Remove Python virtual environment
rm -rf chatbot_service/venv

# Remove node modules
rm -rf frontend/node_modules

# Remove .env files if you want to start fresh
# rm chatbot_service/.env frontend/.env.local

# Restart from Step 5
```

---

## 📞 Getting Help

1. **Check README.md** for comprehensive documentation
2. **Check QUICKSTART.md** for quick reference
3. **Check logs** - most errors are in terminal output
4. **Search error** - Google the error message
5. **Ask team** - Post in #dev-help or similar channel

---

## ✨ You're All Set!

Your InternHub development environment is ready. Start building! 🚀
