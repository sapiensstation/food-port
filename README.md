# Food Village POS

Multi-vendor food court ordering system. Customers order from any of 10 vendor booths via a self-service kiosk web app, kitchen staff manage orders through a vendor portal, and admins oversee the entire operation from a back-office dashboard.

**Cash-only business** — no payment processing. Order confirmation shows a token number with animation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Zustand |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password) + PIN-based for kitchen staff |
| Storage | Supabase Storage (menu item images) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
Food_Port/
├── backend/          # NestJS API (port 3001)
│   ├── prisma/       # Schema + migrations + seed
│   └── src/
│       └── modules/
│           ├── auth/
│           ├── menu/
│           ├── orders/
│           ├── kds/      # Kitchen Display System
│           ├── vendor/
│           └── admin/
├── frontend/         # Next.js app (port 3000)
│   └── app/
│       ├── order/        # Customer ordering flow
│       ├── vendor/       # Vendor / kitchen portal
│       ├── admin/        # Admin back-office
│       └── display/      # TV order board
└── docs/             # API contracts + component specs
```

---

## Portals

| URL | Who uses it |
|---|---|
| `/order` | Customers — browse vendors, build cart, place order |
| `/vendor/login` | Vendor staff — manage menu, view orders |
| `/vendor/kitchen` | Kitchen staff — PIN login, KDS board |
| `/admin/login` | Admins — full back-office dashboard |
| `/display` | TV screen — live order status board |

---

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (free tier works)

---

## Setup from GitHub

### 1. Clone

```bash
git clone <repo-url>
cd Food_Port
```

### 2. Backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend environment

```bash
cp frontend/.env.local.example frontend/.env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Supabase Storage bucket

In Supabase dashboard → Storage → New bucket:
- Name: `menu-images`
- Public: **yes**
- Add policy: allow anonymous reads (`SELECT`) and authenticated uploads (`INSERT`)

### 5. Database — install, migrate, seed

```bash
# Install backend deps
cd backend
npm install

# Run migrations
npx prisma migrate dev --name init

# Seed with 10 vendor booths + sample menus
npm run seed

cd ..
```

### 6. Frontend — install

```bash
cd frontend
npm install
cd ..
```

---

## Running Locally

Open two terminals:

**Terminal 1 — backend**
```bash
cd backend
npm run start:dev
# API available at http://localhost:3001/api
```

**Terminal 2 — frontend**
```bash
cd frontend
npm run dev
# App available at http://localhost:3000
```

### Prisma Studio (optional — browse DB)
```bash
cd backend
npm run prisma:studio
# Opens at http://localhost:5555
```

---

## Default Credentials (after seed)

| Role | Email | Password / PIN |
|---|---|---|
| Super Admin | `admin@foodvillage.com` | `admin123` |
| Vendor (Booth 1) | `booth1@foodvillage.com` | `vendor123` |
| Kitchen PIN | — | `1234` |

> Change all credentials before any real deployment.

---

## Building for Production

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm run start
```

---

## Deployment

### Backend (Railway / Render / Fly.io)

1. Set all env vars from `backend/.env.example` in your platform's dashboard
2. Build command: `npm run build`
3. Start command: `node dist/main`
4. Run migrations on first deploy:
   ```bash
   npx prisma migrate deploy
   ```

### Frontend (Vercel — recommended)

1. Import the `frontend/` folder as the Vercel project root
2. Set env vars:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url/api
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Vercel auto-detects Next.js — no extra config needed

### Environment variables checklist

| Variable | Backend | Frontend |
|---|---|---|
| `DATABASE_URL` | ✅ | — |
| `DIRECT_URL` | ✅ | — |
| `SUPABASE_URL` | ✅ | — |
| `SUPABASE_ANON_KEY` | ✅ | — |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — |
| `SUPABASE_JWT_SECRET` | ✅ | — |
| `NEXT_PUBLIC_API_URL` | — | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | — | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | ✅ |

---

## CI/CD

GitHub Actions runs on push to `main` / `develop` and all pull requests:

- **Backend job** — lint + build (with `prisma generate`)
- **Frontend job** — TypeScript check + build

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## API Documentation

Swagger UI available at `http://localhost:3001/api/docs` when running in development.

Full endpoint tables in:
- [`docs/api-contract.md`](docs/api-contract.md) — Phase 1 & 2 (ordering, vendor, KDS)
- [`docs/phase3-4-api-contract.md`](docs/phase3-4-api-contract.md) — Phase 3 & 4 (admin, analytics, promotions)

---

## Tax

Oklahoma rate: **8.25%** — applied automatically at checkout.
