# 🚀 Quick Start Guide

Get InternHub running in 5 minutes!

## ⚡ Prerequisites Check

```bash
# Verify installations
docker --version          # Should be 20.10+
docker-compose --version  # Should be 1.29+
node --version           # Should be 18+
python --version         # Should be 3.9+
```

---

## 🔥 5-Minute Setup

### Step 1: Clone & Navigate (1 min)

```bash
git clone <repository-url>
cd intern_management_sttl
```

### Step 2: Create Environment Files (1 min)

**Create `chatbot_service/.env`:**

```env
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.1-8b-instant
DB_HOST=localhost
DB_PORT=5433
DB_NAME=intern_management
DB_USER=postgres
DB_PASSWORD=vidhikasttl
CHROMA_PATH=./chroma_db
JWT_SECRET=change-me-to-random-string
ALLOWED_ORIGINS=http://localhost:3000
PORT=8001
```

**Create `frontend/.env.local`:**

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me-to-random-string
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:9090/v1/graphql
VANNA_API_BASE=http://localhost:8001
```

### Step 3: Install Dependencies (2 min)

```bash
# Backend
cd chatbot_service
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### Step 4: Start All Services (1 min)

**Terminal 1 - Docker:**

```bash
cd intern_management_sttl
docker-compose up -d
```

**Terminal 2 - Backend:**

```bash
cd chatbot_service
$env:PORT=8001; python app.py
# Linux/macOS: PORT=8001 python app.py
```

**Terminal 3 - Frontend:**

```bash
cd frontend
npm run dev
```

---

## ✅ Verify Everything Works

### Open in Browser

| Service            | URL                        | Notes                 |
| ------------------ | -------------------------- | --------------------- |
| **Application**    | http://localhost:3000      | Main app              |
| **Backend API**    | http://localhost:8001      | FastAPI server        |
| **API Docs**       | http://localhost:8001/docs | Swagger documentation |
| **Hasura Console** | http://localhost:9090      | GraphQL IDE           |

### Test Backend Health

```bash
# PowerShell
Invoke-WebRequest -Uri http://localhost:8001/health

# Bash/Terminal
curl http://localhost:8001/health
```

---

## 🎯 What's Next?

1. **Login**: Use credentials from the database
2. **Explore Dashboard**: Check the main application
3. **Try Chatbot**: Click the AI button (bottom right)
4. **Run a Query**: Ask "How many interns are active?"

---

## 🆘 Common Issues

### "Port already in use"

```bash
# Windows - Find and kill process
netstat -ano | findstr ":8001"
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :8001 | awk 'NR!=1 {print $2}' | xargs kill -9
```

### "Cannot connect to Docker"

```bash
# Windows: Open Docker Desktop
# Linux: sudo systemctl start docker
docker ps
```

### "ModuleNotFoundError: No module named..."

```bash
cd chatbot_service
pip install -r requirements.txt
```

### "Cannot find module 'react'"

```bash
cd frontend
npm install
npm run dev
```

---

## 🛑 Stopping Services

**Kill Everything:**

```bash
# Windows
Get-Process python, node | Stop-Process -Force
docker-compose down

# Linux/macOS
pkill -f "python|node"
docker-compose down
```

---

## 📚 Full Documentation

See **README.md** for:

- Complete setup instructions
- Environment configuration details
- API documentation
- Architecture overview
- Troubleshooting guide
- Database schema
- Security checklist

---

## 💡 Tips

- 🔄 **Restart Everything**: Stop all services and repeat Step 4
- 📋 **Check Logs**: Open Docker Desktop to view container logs
- 🔌 **API Testing**: Use `http://localhost:8001/docs` (Swagger UI)
- 💾 **Database Access**: `psql -U postgres -h localhost -p 5433 -d intern_management`
- 🚀 **Production Ready**: See README.md for production deployment

---

## 🎓 Learning Resources

- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Hasura**: https://hasura.io/docs/

---

**Ready to go! Happy coding! 🎉**
