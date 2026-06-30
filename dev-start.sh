#!/bin/bash
# Development startup script - Frontend + Backend
# Usage: bash dev-start.sh

set -e

echo "🚀 Neng-Nom Full Stack Development"
echo "===================================="
echo ""
echo "Starting Frontend + Backend + Workers..."
echo ""

# Use pnpm workspaces to run everything
cd c:\Users\laure\Desktop\ProjetEmma

# Option 1: Run all in parallel (requires concurrently)
echo "Install concurrently if not present..."
npm install -g concurrently 2>/dev/null || pnpm add -g concurrently

echo ""
echo "Starting all services in parallel:"
echo "  • Backend API: http://localhost:3001"
echo "  • Frontend: http://localhost:3000"
echo "  • Workers: background jobs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

concurrently \
  "pnpm api:dev" \
  "pnpm web:dev" \
  "pnpm workers:start" \
  --names "API,WEB,WORKERS" \
  --prefix "[{name}]" \
  --kill-others-on-exit

# Option 2: Manual startup (uncomment to use instead)
# echo "Run these commands in separate terminals:"
# echo ""
# echo "Terminal 1:"
# echo "  cd c:\Users\laure\Desktop\ProjetEmma && pnpm api:dev"
# echo ""
# echo "Terminal 2:"
# echo "  cd c:\Users\laure\Desktop\ProjetEmma && pnpm web:dev"
# echo ""
# echo "Terminal 3 (optional):"
# echo "  cd c:\Users\laure\Desktop\ProjetEmma && pnpm workers:start"
