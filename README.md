# 🎬 Movie Booking System

A full-stack, production-ready **Movie Ticket Booking System** built with modern web technologies. Users can browse movies, select seats in real-time, make payments, and receive instant digital tickets — all through a beautiful cinema-themed UI.

![Tech Stack](https://img.shields.io/badge/Node.js-v20-green?style=flat-square&logo=node.js)
![Tech Stack](https://img.shields.io/badge/React-v18-blue?style=flat-square&logo=react)
![Tech Stack](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)
![Tech Stack](https://img.shields.io/badge/Prisma-ORM-purple?style=flat-square&logo=prisma)
![Tech Stack](https://img.shields.io/badge/Redis-7-red?style=flat-square&logo=redis)
![Tech Stack](https://img.shields.io/badge/Docker-Compose-blue?style=flat-square&logo=docker)
![Tests](https://img.shields.io/badge/Coverage-90.36%25-brightgreen?style=flat-square)

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 🔐 **JWT Authentication** | Dual-token system (Access + Refresh) with secure HttpOnly cookies |
| 📧 **OTP Verification** | Email-based OTP via Gmail SMTP for registration and password reset |
| 🎥 **Movie Discovery** | Live data from TMDB API with search, genre, and language filters |
| 💺 **Real-Time Seat Locking** | Redis-backed 5-minute seat locks to prevent double booking |
| 💳 **Payment Flow** | Mock payment gateway with full booking transaction logic |
| 🎫 **Digital Tickets** | Unique booking reference (MB-XXXXXX) generated on confirmation |
| 🏷️ **Coupon Engine** | FLAT/PERCENTAGE discount codes with expiry and usage limits |
| 📊 **Admin Dashboard** | Manage movies, shows, theatres, bookings, and coupons |
| 🐳 **Dockerized** | One-command startup via Docker Compose |
| 🧪 **Test Coverage** | ~90.36% coverage using Jest & Supertest |

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js v20 + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL 16 (via Prisma ORM)
- **Cache / Seat Locks:** Redis 7
- **Authentication:** JWT (jsonwebtoken) + bcryptjs (Salt Rounds: 12)
- **Email:** Nodemailer (Gmail SMTP)
- **Testing:** Jest + Supertest

### Frontend
- **Framework:** React 18 + TypeScript (Vite)
- **Styling:** Vanilla CSS with Glassmorphism design
- **Charts:** Recharts (Admin Dashboard)
- **HTTP Client:** Axios

### Infrastructure
- **Containerisation:** Docker + Docker Compose
- **ORM/Migrations:** Prisma

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
# 1. Clone the repository
git clone https://github.com/your-username/movie-booking-system.git
cd movie-booking-system

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# 3. Start all services
docker-compose up --build

# 4. Seed the database (first time only)
docker exec -it movie-booking-backend npx prisma migrate deploy
docker exec -it movie-booking-backend npm run prisma:seed
```

### Option 2: Manual Setup
Requires **PostgreSQL 16** and **Redis 7** installed locally.

```bash
# Backend
cd backend
npm install
cp .env.example .env       # Edit with your local DB credentials
npx prisma migrate dev
npm run prisma:seed
npm run dev                # Runs on http://localhost:5000

# Frontend (New Terminal)
cd frontend
npm install
npm run dev                # Runs on http://localhost:5173
```

---

## 🌐 Application URLs

| Service | URL |
| :--- | :--- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Prisma Studio | `npx prisma studio` (inside backend) |

---

## 🔑 Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `TMDB_API_KEY` | Free API key from themoviedb.org |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Gmail App Password (not your real password) |
| `SEAT_LOCK_TTL_SECONDS` | Duration of seat lock in seconds (default: 300) |

---

## 🧪 Running Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run a specific module
npm test auth.routes.test.ts
```

---

## 📁 Project Structure

```
movie-booking-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Sample data seeder
│   ├── src/
│   │   ├── modules/            # Feature modules (auth, movies, seats, bookings...)
│   │   ├── middleware/         # Auth guard, error handler, validator
│   │   └── utils/              # JWT, bcrypt, response helpers
│   └── .env.example            # Environment template
├── frontend/
│   └── src/
│       ├── pages/              # React pages (Home, SeatSelection, Admin...)
│       ├── components/         # Reusable UI components
│       └── services/           # Axios API service layer
├── docker-compose.yml
└── README.md
```

---

## 🔒 Security Highlights

- Passwords hashed with **bcryptjs** (12 salt rounds) — never stored in plaintext
- Refresh Tokens stored in **HttpOnly cookies** (XSS-resistant)
- All protected routes validate **Bearer JWT** on every request
- `.env` excluded from version control via `.gitignore`
- Rate limiting on all API endpoints

---

## 🗺️ API Overview

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login and receive tokens |
| GET | `/api/movies` | ❌ | List all movies |
| POST | `/api/seats/lock` | ✅ | Lock seats for 5 minutes |
| POST | `/api/bookings` | ✅ | Create confirmed booking |
| PATCH | `/api/bookings/:ref/cancel` | ✅ | Cancel booking (>2hrs before show) |
| POST | `/api/coupons/apply` | ✅ | Apply discount coupon |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.
