# Sampada Green - Veggie Store

A full-stack vegetable store application for ordering fresh vegetables with admin management, built with React + Express + PostgreSQL.

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Recharts, react-hot-toast

**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT Auth, Zod, Multer

## Features

- Customer catalog with search, category filter, and sort by price
- Shopping cart with Kg/Piece/Packet unit selection and localStorage persistence
- Phone + OTP authentication for customers, email/password for admins
- Order placement with stock validation and inventory deduction
- Order history with reorder functionality
- Favorites system
- Admin dashboard with stats, low stock alerts, recent orders
- Full vegetable CRUD with image upload, emoji, multi-language names
- Category management
- Order management with status workflow (Pending > Confirmed > Out for Delivery > Delivered)
- Price history tracking
- Sales analytics with charts and CSV export
- WhatsApp sharing with QR code
- Customer management
- Bulk stock updates
- Code splitting with React.lazy
- Security: Helmet, rate limiting, CORS, input validation

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL

### Setup

```bash
# Clone
git clone https://github.com/nitinjrao/veggie-store.git
cd veggie-store

# Server
cd server
cp .env.example .env   # Edit DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev
npm run seed
npm run dev

# Client (new terminal)
cd client
npm install
npm run dev
```

Open http://localhost:5173

### Default Accounts

- **Admin:** admin@sampadagreen.com / admin123
- **Customer:** Register with any phone number, OTP is logged in server console (dev mode)

## Project Structure

```
client/                 # React frontend
  src/
    components/         # Reusable UI components
    pages/              # Page components (customer + admin)
    services/           # API service layer
    stores/             # Zustand state management
    types/              # TypeScript interfaces
server/                 # Express backend
  src/
    controllers/        # Route handlers
    middleware/          # Auth, upload, error handling
    routes/             # Express routes
    utils/              # Helpers (JWT, async handler)
  prisma/               # Schema + migrations + seed
  uploads/              # Uploaded images
```

## Deployment

- **Frontend:** Deploy `client/` to Vercel (vercel.json included)
- **Backend:** Use `server/Dockerfile` for containerized deployment
- See `.env.example` for required environment variables
