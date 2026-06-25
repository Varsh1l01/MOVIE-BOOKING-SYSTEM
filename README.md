<div align="center">

# 🎬 CineMaa

**A Full-Stack Movie Ticket Booking Platform**

*Browse. Pick seats. Pay. Enjoy — all from one seamless platform.*

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-F7DF1E?logoColor=black)](LICENSE)

</div>

---

## 📖 Overview

**CineMaa** is a feature-rich web application that replicates the core experience of platforms like BookMyShow. Users can browse now-playing and upcoming movies (synced live from TMDB), select shows and showtimes, pick seats interactively, apply discount coupons, and complete a simulated payment flow — all in one seamless experience.

Admins get a dedicated dashboard to manage movies, theatres, screens, shows, coupons, and bookings — with real-time analytics via charts.

The backend is built on **Node.js + Express + TypeScript**, persists data in **PostgreSQL** via **Prisma ORM**, uses **Redis** for temporary seat-locking during checkout, and sends transactional emails through **Nodemailer (Gmail SMTP)**. The frontend is a **React + Vite + TypeScript** SPA styled with **Tailwind CSS**.

---

## ✨ Features

### 👤 User-Facing
- **Authentication** — Register / Login with JWT access + refresh token rotation; OTP-based email verification and password reset
- **Movie Discovery** — Browse Now Playing & Upcoming movies synced from [TMDB API](https://www.themoviedb.org/)
- **Show & Showtime Selection** — Filter shows by date, language, and format (2D / 3D / IMAX / 4DX)
- **Interactive Seat Map** — Visual seat picker with per-type pricing (Regular / Premium / Recliner / Couple / Accessible)
- **Real-Time Seat Locking** — Redis-backed 5-minute lock prevents double-booking during checkout
- **Coupon System** — Apply percentage or flat-discount coupons with per-user and global usage limits
- **Mock Payment Gateway** — Simulated UPI / Card / Net Banking / Wallet payment flow
- **Booking Management** — View booking history, download confirmation, and cancel with automatic refund tracking
- **User Profile** — Update personal details including avatar, city, and phone

### 🛠️ Admin Dashboard
- **Analytics** — Revenue, booking trends, seat utilisation charts (Recharts)
- **Movie Management** — Add / edit / delete movies; sync metadata from TMDB
- **Theatre & Screen Management** — Create multi-screen theatres with seat layout configuration
- **Show Scheduling** — Schedule shows with per-seat-type pricing
- **Coupon Management** — Create, activate/deactivate, and monitor coupon campaigns
- **Booking Oversight** — View all bookings, statuses, and cancel on behalf of users

### 🔒 Security & Reliability
- Rate limiting (express-rate-limit) on all API endpoints
- Helmet.js HTTP security headers
- Bcrypt password hashing
- Input validation via express-validator
- Structured logging with Winston
- Graceful shutdown with SIGTERM/SIGINT handling
- Full Jest test suite with Supertest integration tests

---

## 🧰 Tech Stack

### Backend
| Category | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express.js 4 |
| Language | TypeScript 5 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Cache / Lock | Redis 7 (ioredis) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| OTP | otplib |
| External API | TMDB API |
| Logging | Winston + Morgan |
| Testing | Jest + Supertest |
| Containerisation | Docker + Docker Compose |

### Frontend
| Category | Technology |
|---|---|
| Framework | React 18 |
| Bundler | Vite 5 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM 6 |
| State Management | Zustand 4 |
| Data Fetching | TanStack Query (React Query) v5 |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  React + Vite SPA  ←→  Zustand (global state)               │
│  TanStack Query (server state + caching)                     │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP / REST (Axios)
┌──────────────────────▼───────────────────────────────────────┐
│                   EXPRESS API SERVER                         │
│  ┌────────────┐  ┌──────────────────┐  ┌────────────────┐   │
│  │  Helmet /  │  │  JWT Auth        │  │  Rate Limiter  │   │
│  │  CORS      │  │  Middleware      │  │  (per-IP)      │   │
│  └────────────┘  └──────────────────┘  └────────────────┘   │
│                                                              │
│  Modular Routes: auth | movies | theatres | shows | seats   │
│                  bookings | payments | coupons | admin       │
└───────┬─────────────────────────────────────┬───────────────┘
        │ Prisma ORM                          │ ioredis
┌───────▼────────────┐             ┌──────────▼──────────┐
│   PostgreSQL 16    │             │      Redis 7         │
│  (persistent data) │             │  (seat lock / TTL)   │
└────────────────────┘             └─────────────────────┘
        │
┌───────▼──────────────┐
│    TMDB API (ext.)   │  ← movie metadata sync
└──────────────────────┘
```

**Key Design Decisions:**
- **Module-based folder structure** — each domain (auth, movies, bookings …) owns its controller, service, routes, and tests
- **Redis seat lock** — a 5-minute TTL key (`seat_lock:<showId>:<seatId>`) prevents race conditions during concurrent checkouts; released immediately on payment success / cancellation
- **Prisma migrations** — schema-first, version-controlled database migrations under `backend/prisma/migrations/`
- **Refresh token rotation** — short-lived access tokens (15 min) + long-lived refresh tokens (7 days) stored in `RefreshToken` table; old token invalidated on each refresh

---

## ⚙️ Core Commands

### Backend

```bash
# Development server (with hot-reload via nodemon)
npm run dev

# Build TypeScript → JavaScript
npm run build

# Run compiled production build
npm start

# Prisma — generate client after schema changes
npm run prisma:generate

# Prisma — run migrations (dev)
npm run prisma:migrate

# Prisma — seed the database with sample data
npm run prisma:seed

# Prisma — open visual database browser
npm run prisma:studio

# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage
```

### Frontend

```bash
# Development server (Vite HMR on port 5173)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Lint check
npm run lint
```

### Docker

```bash
# Start all services (Postgres, Redis, Backend, Frontend)
docker-compose up -d

# Tear down and remove volumes
docker-compose down -v

# View logs for a specific service
docker-compose logs -f backend
```

---

## 📁 Project Structure

```
CINEMAA/
├── docker-compose.yml          # Multi-service orchestration
├── .gitignore
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.ts
│   ├── .env.example            # Environment variable template
│   │
│   ├── prisma/
│   │   ├── schema.prisma       # Full data model (Users, Movies, Theatres, Shows, Seats, Bookings, Payments, Coupons)
│   │   ├── seed.ts             # Sample data seeder
│   │   └── migrations/         # Auto-generated Prisma migration history
│   │
│   └── src/
│       ├── index.ts            # App entry — middleware, routes, server bootstrap
│       ├── config/
│       │   ├── database.ts     # Prisma client singleton
│       │   ├── redis.ts        # ioredis client
│       │   └── mailer.ts       # Nodemailer transporter
│       ├── middleware/
│       │   ├── authenticate.ts # JWT verification middleware
│       │   ├── errorHandler.ts # Global error handler
│       │   ├── notFound.ts     # 404 fallback
│       │   └── validate.ts     # express-validator result handler
│       ├── utils/
│       │   └── logger.ts       # Winston logger
│       ├── services/
│       │   ├── tmdb.service.ts      # TMDB API client
│       │   └── movieSync.service.ts # TMDB → DB sync logic
│       └── modules/            # Feature modules (each contains routes, controller, service)
│           ├── auth/
│           ├── movies/
│           ├── theatres/
│           ├── screens/
│           ├── shows/
│           ├── seats/
│           ├── bookings/
│           ├── payments/
│           ├── coupons/
│           └── admin/
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    │
    └── src/
        ├── main.tsx            # React root, QueryClient, Router setup
        ├── App.tsx             # Route definitions
        ├── index.css           # Global Tailwind styles
        ├── types/              # Shared TypeScript interfaces
        ├── store/              # Zustand stores (auth, booking state)
        ├── services/           # Axios API client wrappers
        ├── components/
        │   ├── Navbar.tsx
        │   ├── Footer.tsx
        │   ├── common/         # Reusable UI components
        │   ├── admin/          # Admin-specific components
        │   └── layout/         # Page layout wrappers
        └── pages/
            ├── HomePage.tsx
            ├── MovieDetailPage.tsx
            ├── ShowtimesPage.tsx
            ├── SeatSelectionPage.tsx
            ├── CheckoutPage.tsx
            ├── BookingSuccessPage.tsx
            ├── ProfilePage.tsx
            ├── auth/           # Login / Register pages
            └── admin/          # Admin dashboard pages
                ├── AdminDashboardPage.tsx
                ├── AdminMoviesPage.tsx
                ├── AdminTheatresPage.tsx
                ├── AdminShowsPage.tsx
                ├── AdminBookingsPage.tsx
                └── AdminCouponsPage.tsx
```

---

## 🚀 Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [PostgreSQL](https://www.postgresql.org/) 16+
- [Redis](https://redis.io/) 7+
- [Docker](https://www.docker.com/) (optional, recommended)
- A [TMDB API Key](https://www.themoviedb.org/settings/api) (free)
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) (for OTP emails)

---

### Option A — Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/Varsh1l01/MOVIE-BOOKING-SYSTEM.git
cd MOVIE-BOOKING-SYSTEM

# 2. Copy the backend environment template and fill in your values
cp backend/.env.example backend/.env

# 3. Start all services
docker-compose up -d

# 4. Run database migrations and seed sample data (first run only)
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run prisma:seed
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |
| Prisma Studio | `npm run prisma:studio` (inside backend/) |

---

### Option B — Local Development

#### 1. Clone & Install

```bash
git clone https://github.com/Varsh1l01/MOVIE-BOOKING-SYSTEM.git
cd MOVIE-BOOKING-SYSTEM

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

#### 2. Configure the Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/movie_booking?schema=public"
REDIS_URL=redis://localhost:6379
TMDB_API_KEY=your_tmdb_api_key
JWT_ACCESS_SECRET=a_long_random_secret
JWT_REFRESH_SECRET=another_long_random_secret
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
```

#### 3. Set Up the Database

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed with sample movies, theatres, shows, and an admin account
npm run prisma:seed
```

#### 4. Start the Servers

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

#### 5. Default Seeded Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cinemaa.in` | `Admin@1234` |
| User | `user@cinemaa.in` | `User@1234` |

---

## 🔮 Future Enhancements

- [ ] **Real Payment Gateway** — Integrate Razorpay or Stripe for live transactions
- [ ] **Mobile App** — React Native companion app for iOS & Android
- [ ] **WebSocket Seat Updates** — Push real-time seat availability to all connected clients via Socket.io
- [ ] **Recommendation Engine** — Personalised movie suggestions based on booking history
- [ ] **Multi-Language Support (i18n)** — Hindi, Tamil, Telugu language UI options
- [ ] **Advanced Search & Filters** — Elasticsearch-powered full-text movie and theatre search
- [ ] **Theatre Owner Role** — Self-service portal for theatre owners to manage their own properties
- [ ] **Loyalty & Rewards Program** — Points system redeemable on future bookings
- [ ] **Food & Beverage Pre-Ordering** — Combo add-ons selectable during checkout
- [ ] **CI/CD Pipeline** — GitHub Actions for automated testing and deployment to AWS / GCP

---

## 👤 Author

**Varshil Rathod**

- GitHub: [@Varsh1l01](https://github.com/Varsh1l01)
- Email: rathodvarshil9@gmail.com

---

<p align="center">
  Made with ❤️ and lots of ☕ &nbsp;|&nbsp; Star ⭐ the repo if you found it helpful!
</p>
