# Neng-Nom 🐔

**Neng-Nom** is a full-stack AgriTech platform connecting Central African livestock farmers with veterinarians, mobile lab technicians, and a farming community — built for low-connectivity environments and rural users.

> Built for Cameroon. Designed for Africa.

---

## ✨ Features

| Role | Capabilities |
|------|-------------|
| **Farmer** | Dashboard with AI suggestions, live vet consultations, farm records, lab test orders, community forum, vaccination reminders |
| **Veterinarian** | Consultation management (accept/chat/close), incoming lab test orders, community, earnings tracking |
| **Lab Technician** | Receive and manage lab test requests, update status, upload results |

**Platform highlights:**
- 📱 Phone-number-only authentication (no email required)
- 🤖 AI-powered daily farm suggestions via Groq LLM (French, Cameroonian context)
- 💬 Live consultation chat with 4-second real-time polling
- 🧪 Lab request lifecycle tracking
- 🌍 Bilingual interface (French / English)
- 📶 Offline-aware UI with sync banner
- 🔔 Role-aware notification system

---

## 🏗️ Architecture

```
NengNom/
├── packages/
│   ├── api/          # REST API — Fastify 4 + Prisma 5 + PostgreSQL + Redis
│   ├── web/          # Frontend — Next.js 13 (App Router) + Tailwind CSS
│   ├── shared/       # Shared Zod schemas & TypeScript types
│   └── workers/      # Background workers (BullMQ) — AI, notifications, reminders
├── docker-compose.full.yml   # Full stack: postgres, redis, api, web
├── Dockerfile.api
└── Dockerfile.web
```

**Tech stack:**

| Layer | Technology |
|-------|-----------|
| API | Fastify 4.25, TypeScript, Prisma 5.22 |
| Database | PostgreSQL 16 |
| Cache / Sessions | Redis 7 |
| AI | Groq SDK — `qwen/qwen3-32b` model |
| Frontend | Next.js 13.5, React 18, Tailwind CSS, shadcn/ui |
| Auth | JWT (access 15min + refresh 7d), bcrypt, Redis token store |
| Monorepo | pnpm workspaces |
| Containers | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js 20 LTS](https://nodejs.org/)
- [pnpm 8+](https://pnpm.io/installation)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)

### 1. Clone & install

```bash
git clone https://github.com/LaurentJoel/NengNom.git
cd NengNom
pnpm install
```

### 2. Environment setup

```bash
cp .env.example .env
```

Edit `.env` with your values. Required variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/neng_nom
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<at-least-32-chars>
JWT_REFRESH_SECRET=<at-least-32-chars>
GROQ_API_KEY=<your-groq-api-key>
GROQ_MODEL=qwen/qwen3-32b
```

### 3. Run with Docker (recommended)

```bash
# Start all services (postgres, redis, api, web)
docker compose -f docker-compose.full.yml up -d

# API  → http://localhost:3001
# Web  → http://localhost:3002
# Docs → http://localhost:3001/docs
```

### 4. Run in development mode

```bash
# Start infrastructure only
docker compose up -d postgres redis

# Run API
cd packages/api
pnpm dev   # http://localhost:3001

# Run web (separate terminal)
cd packages/web
pnpm dev   # http://localhost:3000
```

---

## 🗄️ Database

### Seed data

After the API starts for the first time, the database is auto-migrated. Seed users:

| Phone | Password | Role | Name |
|-------|----------|------|------|
| +237691234567 | Password123! | Farmer | Jean Kamdem |
| +237677890123 | Password123! | Farmer | Pierre Tala |
| +237698765432 | Password123! | Vet | Dr. Aminata Diallo |
| +237699876543 | Password123! | Vet | Dr. Pierre Mbarga |

### Schema overview

```
User ─── FarmerProfile ─── FarmRecord
      │                └── HealthEvent
      │                └── AiSuggestion
      │                └── LabRequest
      │
      └── VetProfile ─── Consultation ─── ConsultationMessage
                      └── LabRequest (assigned)

CommunityPost ─── CommunityComment
DiseaseAlert
```

---

## 📡 API Reference

Base URL: `http://localhost:3001`

### Authentication

```
POST /auth/register   Register with phone number
POST /auth/login      Login → returns access + refresh tokens
POST /auth/refresh    Refresh access token
POST /auth/logout     Invalidate session
```

### Core Endpoints

```
GET    /users/me              Current user profile
GET    /users/vets            List available veterinarians

GET    /consultations         List consultations (role-filtered)
POST   /consultations         Create consultation (farmer)
GET    /consultations/:id     Get consultation + messages
PATCH  /consultations/:id     Update status
POST   /consultations/:id/messages   Send message

GET    /farm-records          List farm records
POST   /farm-records          Create farm record

GET    /health-events         List health events
GET    /health-events/reminders   Upcoming due dates
POST   /health-events         Create health event

GET    /lab-requests          List lab requests
POST   /lab-requests          Create lab request (farmer)
GET    /lab-requests/pending  Pending requests (vet/lab tech)

GET    /ai/suggestions        Daily AI suggestions
POST   /ai/suggestions/:id/feedback   Rate suggestion

GET    /community/posts       List community posts
POST   /community/posts       Create post
```

All responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { ... }
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": { "phone": ["Required"] }
  }
}
```

---

## 🔐 Security

- Passwords hashed with **bcrypt** (cost factor 12)
- Refresh tokens use **crypto.randomBytes(32)** — cryptographically secure
- Dual Redis key pattern for O(1) logout: `refresh_token:{token}` + `refresh_uid:{userId}`
- `isActive` check performed **before** bcrypt to prevent credential enumeration timing
- AI prompts sanitized (newline stripping, 100-char field truncation) against injection
- Role-based authorization on all protected routes (`FARMER` / `VET` guards)
- Secrets isolated in `.env.docker` (never committed)

---

## 🌐 Frontend

```
packages/web/
├── app/
│   ├── auth/           # Login & multi-step registration
│   └── (app)/          # Authenticated pages
│       ├── dashboard/
│       │   ├── farmer/ # Farmer dashboard
│       │   └── vet/    # Vet dashboard
│       ├── consultations/
│       ├── farm-records/
│       ├── lab/
│       ├── lab-requests/
│       ├── ai-suggestions/
│       ├── community/
│       └── profile/
├── components/
│   └── app/
│       └── AppLayout.tsx   # Sidebar + topbar (role-aware nav)
└── lib/
    ├── auth-context.tsx    # Auth state + JWT handling
    ├── i18n.tsx            # FR/EN translations
    └── *-service.ts        # API service modules
```

The sidebar navigation adapts per role:

- **Farmers** see: Home, Consultations, Laboratory, Farm Records, Community, AI Suggestions, Profile
- **Vets** see: Home, Consultations, Lab Requests, Community, Profile

---

## 🛠️ Development

### Useful commands

```bash
# Monorepo
pnpm install              # Install all workspace dependencies
pnpm build                # Build all packages

# API
cd packages/api
pnpm dev                  # Development server (ts-node-dev)
pnpm build                # Compile TypeScript
pnpm db:migrate           # Run Prisma migrations
pnpm db:seed              # Seed database
pnpm db:studio            # Open Prisma Studio
pnpm lint                 # ESLint
pnpm test                 # Run tests

# Shared schemas (must recompile after changes)
cd packages/shared
pnpm build                # tsc → dist/

# Web
cd packages/web
pnpm dev                  # Next.js dev server
pnpm build                # Production build
pnpm start                # Start production server
```

### Docker commands

```bash
# Full rebuild
docker compose -f docker-compose.full.yml build

# View logs
docker compose -f docker-compose.full.yml logs -f api
docker compose -f docker-compose.full.yml logs -f web

# Restart a service
docker compose -f docker-compose.full.yml restart api
```

---

## 🗺️ Roadmap

- [ ] React Native mobile app (iOS + Android)
- [ ] Voice & video consultation (WebRTC)
- [ ] SMS notifications via Africa's Talking
- [ ] Offline-first mobile data sync
- [ ] Multi-language support (Fulfulde, Ewondo)
- [ ] Disease surveillance map by region
- [ ] Payment integration (MTN Mobile Money, Orange Money)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

**Built with ❤️ for African farmers**
