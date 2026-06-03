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

Supabase Auth accounts must be created manually in your Supabase dashboard (Authentication → Users) — the seed script does not create them. Use the credentials below.

---

### 1 — Super Admin

**Login URL:** `http://localhost:3000/admin/login`
**Auth method:** Email + Password

| Field | Value |
|---|---|
| Email | `admin@foodvillage.com` |
| Password | `admin123` |
| Role | `super_admin` |

Access: full admin dashboard — orders, vendors, finance, analytics, promotions, audit log.

---

### 2 — Vendor Manager (Booth 1 · Burger Barn)

**Login URL:** `http://localhost:3000/vendor/login`
**Auth method:** Email + Password

| Field | Value |
|---|---|
| Email | `booth1@foodvillage.com` |
| Password | `vendor123` |
| Role | `vendor_admin` |
| Vendor | Burger Barn (Booth 1) |

Access: vendor portal — menu management, order board, settings for Burger Barn.

> Additional vendor accounts follow the same pattern: `booth2@foodvillage.com`, `booth3@foodvillage.com`, ... `booth10@foodvillage.com` — all with password `vendor123`. Create each in Supabase and assign the matching vendor in the `users` table.

---

### 3 — Kitchen Staff · Burger Barn (PIN login)

**Login URL:** `http://localhost:3000/vendor/kitchen`
**Auth method:** Vendor ID + 4-digit PIN

| Field | Value |
|---|---|
| Vendor ID | `d230c843-1517-46bf-9970-673bb9c81efb` |
| PIN | `1234` |
| Label | Kitchen Station 1 |
| Role | `vendor_kitchen` |

This PIN is seeded automatically by `npm run seed`. To log in, select **Burger Barn** on the kitchen login screen and enter PIN `1234`.

**All vendor IDs (for PIN login):**

| Booth | Vendor | Vendor ID |
|---|---|---|
| 1 | Burger Barn | `d230c843-1517-46bf-9970-673bb9c81efb` |
| 2 | Pizza Palace | `0af39d20-c78d-432b-b916-f590fd0798d5` |
| 3 | Taco Fiesta | `dde5452f-0789-4f46-92a4-213d96ed5c81` |
| 4 | Wok & Roll | `bae52c21-3d64-4ca6-bb8d-b3af086daf57` |
| 5 | Juice Junction | `5f0e976d-fd9e-4958-a813-aa1e47098874` |
| 6 | Spice Garden | `e27e3850-092d-4943-bde3-bc3c3019040b` |
| 7 | Sushi Stop | `92dde171-5e16-4120-9e56-87f5758c1d81` |
| 8 | Falafel House | `27aca20c-cb63-4a5d-a871-ff19c5c92eb3` |
| 9 | Dessert Den | `9c04dd38-6674-42da-9b1a-d044d9acec2d` |
| 10 | BBQ Boss | `35f3efa5-8a77-4067-916c-f6884285c843` |

---

> **Warning:** Change all passwords and PINs before any real deployment.

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
