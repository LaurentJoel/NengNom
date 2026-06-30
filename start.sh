#!/bin/bash
# Complete Neng-Nom Backend Setup & Start Script
# Usage: bash start.sh (from project root)

set -e

echo "🚀 Neng-Nom Backend API - Complete Setup & Start"
echo "=================================================="

# Check prerequisites
echo "\n✓ Checking prerequisites..."
if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm not found. Install from https://pnpm.io"
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo "❌ Docker not found. Install from https://docker.com"
  exit 1
fi

# Step 1: Install dependencies
echo "\n📦 Installing dependencies..."
pnpm install

# Step 2: Start Docker services
echo "\n🐳 Starting Docker containers..."
docker-compose up -d

# Wait for containers to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Step 3: Run migrations
echo "\n🔄 Running database migrations..."
pnpm db:migrate

# Step 4: Seed database
echo "\n🌱 Seeding database with test data..."
pnpm db:seed

# Step 5: Build TypeScript
echo "\n🔨 Building TypeScript..."
pnpm build

echo "\n✅ Setup complete!"
echo ""
echo "🎯 Ready to start development:"
echo "   Terminal 1: pnpm dev          (Start API server)"
echo "   Terminal 2: pnpm workers:start (Start background workers)"
echo "   Terminal 3: pnpm test:watch   (Run tests in watch mode)"
echo ""
echo "📚 Documentation:"
echo "   API Docs:      http://localhost:3001/docs"
echo "   Health:        http://localhost:3001/health"
echo "   Readiness:     http://localhost:3001/health/ready"
echo ""
echo "💡 First steps:"
echo "   1. Register user via Swagger at /docs"
echo "   2. Test consultations, farm records, etc."
echo "   3. View AI suggestions after 8 AM"
echo ""
echo "🛑 To stop services: docker-compose down"
echo ""
