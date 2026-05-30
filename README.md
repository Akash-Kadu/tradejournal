# TradeJournal
A full-stack trade journal — Spring Boot REST API + React.js frontend + MySQL.

---

## Running Locally

### Backend
```bash
cd backend
mvn spring-boot:run
# OR open in IntelliJ → Run TradeJournalApplication
```
API available at: `http://localhost:8080`

### Frontend
```bash
cd frontend
npm install
npm start
```
App available at: `http://localhost:3000`

Update `backend/src/main/resources/application.properties`:
```
spring.datasource.username=YOUR_MYSQL_USER
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

---

## Deploying Online (Free) — No PC Setup Needed

### Step 1 — Push to GitHub
Upload this project to a GitHub repo.

### Step 2 — Deploy Backend + MySQL on Railway (railway.app)
1. New Project → Deploy from GitHub → select repo → set Root Directory = `backend`
2. Add MySQL plugin: New → Database → MySQL
3. In backend service → Variables tab, add:
```
SPRING_DATASOURCE_URL      = (from Railway MySQL plugin)
SPRING_DATASOURCE_USERNAME = (from Railway MySQL plugin)
SPRING_DATASOURCE_PASSWORD = (from Railway MySQL plugin)
CORS_ALLOWED_ORIGIN        = https://your-app.vercel.app   ← add AFTER step 3
```

### Step 3 — Deploy Frontend on Vercel (vercel.com)
1. New Project → Import GitHub repo → set Root Directory = `frontend`
2. Add Environment Variable:
```
REACT_APP_API_URL = https://your-backend.up.railway.app/api
```
3. Deploy → copy your Vercel URL → paste it into Railway's `CORS_ALLOWED_ORIGIN` variable.

---

## Bug Fixes Applied (v2)
- ✅ Removed broken `sessionStorage` line in StrategyPage.jsx
- ✅ Session cookie configured for cross-domain (SameSite=None; Secure)
- ✅ CORS origin now reads from `CORS_ALLOWED_ORIGIN` env variable
- ✅ Frontend API URL reads from `REACT_APP_API_URL` env variable
- ✅ Added 401 interceptor → auto-redirects to /login on session expiry
- ✅ Maven wrapper added for `./mvnw` support
- ✅ Railway Procfile + system.properties added

---

## Environment Variables Reference

### Backend (Railway)
| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_URL` | MySQL JDBC URL from Railway |
| `SPRING_DATASOURCE_USERNAME` | MySQL username |
| `SPRING_DATASOURCE_PASSWORD` | MySQL password |
| `CORS_ALLOWED_ORIGIN` | Your Vercel frontend URL |
| `PORT` | Auto-set by Railway |

### Frontend (Vercel)
| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Your Railway backend URL + /api |

---

## 4 Tables
- `users` — auth, session management
- `accounts` — prop firm accounts
- `strategies` — trading strategies
- `trades` — individual trade records

## Calculations (all server-side)
- `result_percent` = `(result_dollar / account_size) * 100`
- `change_dollar`  = `current_balance - account_size`
- `change_percent` = `(change_dollar * 100) / account_size`
- `day`            = auto-derived from `date`
