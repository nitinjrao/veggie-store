# Veggie Store

## Project Structure
- `client/` — React 19 + Vite + TypeScript frontend (port 5173)
- `server/` — Express.js + Prisma + PostgreSQL backend (port 3000)
- Auth: Firebase Authentication (Phone OTP, Google OAuth, Email/Password)

## Prerequisites
- Node.js
- PostgreSQL running locally (database: `veggie_store`, user: `veggie`, password: `veggie123`)
- Firebase project configured (service account key in `server/.env`)

## How to Run

### 1. Install dependencies (only needed once or after package changes)
```bash
cd server && npm install
cd client && npm install
```

### 2. Run database migrations (only needed after schema changes)
```bash
cd server && npx prisma migrate deploy && npx prisma generate
```

### 3. Seed database (only needed once or to reset data)
```bash
cd server && npx prisma db seed
```

### 4. Start the app (both must run simultaneously)
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

- Server: http://localhost:3000
- Client: http://localhost:5173

## Environment Files
- `server/.env` — DATABASE_URL, PORT, CLIENT_URL, FIREBASE_SERVICE_ACCOUNT_JSON
- `client/.env` — VITE_API_URL, VITE_FIREBASE_* config values

## Key Commands
- `cd server && npm run dev` — Start backend in dev mode (tsx watch)
- `cd client && npm run dev` — Start frontend in dev mode (vite)
- `cd server && npx prisma migrate deploy` — Apply pending migrations
- `cd server && npx prisma db seed` — Seed database
- `cd server && npx prisma studio` — Open Prisma database GUI

## Login URLs
- Customer: http://localhost:5173/login
- Admin: http://localhost:5173/admin/login (email: admin@sampadagreen.com)
