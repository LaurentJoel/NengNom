# 🚀 Next Steps - Quick Start

Your Neng-Nom Backend API is fully scaffolded! Follow these steps to get it running locally.

## Step 1: Install Dependencies (2-3 minutes)

```bash
cd c:\Users\laure\Desktop\ProjetEmma
pnpm install
```

This will install all dependencies across the monorepo (api, shared, workers packages).

---

## Step 2: Start Local Services (1 minute)

```bash
# Start PostgreSQL 16, Redis 7, and Jaeger (for tracing)
docker-compose up -d

# Verify containers are running
docker ps
```

✅ When healthy, you should see 3 containers running.

---

## Step 3: Setup Database (1-2 minutes)

```bash
# Run Prisma migrations to create tables
pnpm db:migrate

# Seed with realistic test data (Cameroon/Congo farmers, vets, lab techs)
pnpm db:seed

# (Optional) Open Prisma Studio to browse data
pnpm db:studio
```

✅ Check that data was seeded: 3 farmers, 2 vets, 1 lab tech, 5+ consultations created.

---

## Step 4: Start Development Server (30 seconds)

```bash
# Terminal 1: Start the API (auto-reloads on file changes)
pnpm dev

# Should see:
# ✅ Fastify app initialized successfully
# 🚀 Server running at http://localhost:3001
# 📚 API Docs available at http://localhost:3001/docs
```

---

## Step 5: Test the API

### Option A: Swagger UI (Most User-Friendly)
1. Open http://localhost:3001/docs in your browser
2. Click "Auth" section → expand `/auth/register`
3. Click "Try it out" → enter test user data → execute
4. You'll get back an `accessToken` and `refreshToken`

### Option B: cURL

```bash
# Register a new user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@neng-nom.local",
    "phone": "+237691234567",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "fullName": "Jean Kamdem",
    "role": "FARMER",
    "country": "CM",
    "region": "Littoral"
  }'

# Login (need to mark user as verified first)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@neng-nom.local",
    "password": "Password123!"
  }'
```

### Option C: Run Tests

```bash
# Terminal 2 (keep API running in Terminal 1)
pnpm test

# Should see auth tests passing:
# ✓ Register creates user with hashed password
# ✓ Register throws ConflictError on duplicate email
# ✓ Login returns token pair on valid credentials
# ... (12 tests total)
```

---

## Step 6: Health Check

```bash
# API is ready
curl http://localhost:3001/health

# Database & Redis are connected
curl http://localhost:3001/health/ready

# API is alive
curl http://localhost:3001/health/live
```

All should return 200 status.

---

## 📊 What You Have

✅ **Production-grade foundation** with:
- Spec-Driven Development workflow
- Full TypeScript with strict mode
- Zod validation everywhere
- Winston + Pino logging
- Circuit breakers for external services
- Testcontainers integration tests
- Auth (JWT + refresh tokens)
- Database schema (17 models)
- Error handling (custom AppError hierarchy)
- Fastify plugins (cors, rate-limit, compression, etc.)

✅ **Ready to implement next module**: 
- Users/Profiles module
- Consultations (with Socket.io)
- Farm Records
- And more...

---

## 🐛 Troubleshooting

### "Cannot find module @neng-nom/shared"
- Run `pnpm install` from workspace root
- Check pnpm-workspace.yaml exists

### "Database connection failed"
- Check Docker containers: `docker ps`
- Verify DATABASE_URL in .env matches container
- Try: `docker-compose restart postgres`

### "Port 3001 already in use"
- Change PORT in .env to 3002, or kill process: `lsof -i :3001`

### "Testcontainers timing out"
- Docker might be slow. Increase timeout in tests/setup.ts
- Check Docker daemon is running: `docker ps`

---

## 📚 Documentation

- **API Docs**: http://localhost:3001/docs (Swagger UI)
- **OpenAPI Spec**: http://localhost:3001/openapi.json
- **Project README**: See [README.md](README.md)
- **Code Comments**: Extensive inline documentation throughout

---

## 🎯 Recommended Next

1. **Verify auth flow** in Swagger (register → login → refresh)
2. **Explore database** with Prisma Studio (`pnpm db:studio`)
3. **Implement Users module** following the same TDD pattern as Auth
4. **Add Consultations module** with real-time Socket.io

---

## 💡 Key Commands Reference

```bash
# Development
pnpm dev                 # Start API with hot-reload
pnpm test               # Run all tests
pnpm test:watch        # Tests in watch mode
pnpm lint               # Check for errors
pnpm format             # Auto-format code
pnpm build              # Compile TypeScript

# Database
pnpm db:migrate         # Run migrations
pnpm db:seed            # Insert test data
pnpm db:reset           # Reset DB (dev/test only)
pnpm db:studio          # Open Prisma Studio

# Docker
docker-compose up -d    # Start services
docker-compose down     # Stop services
docker-compose logs -f  # Stream logs
```

---

**You're ready to go! 🎉 Start with `pnpm install && docker-compose up -d && pnpm db:migrate && pnpm dev`**
