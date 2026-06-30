#!/bin/sh
set -e

echo "Building shared package..."
cd /app/packages/shared
pnpm exec tsc

echo "Generating Prisma Client..."
cd /app/packages/api
pnpm exec prisma generate

echo "Running database migrations..."
pnpm exec prisma db push --accept-data-loss

echo "Compiling TypeScript..."
pnpm exec tsc

echo "Starting API server..."
cd /app
exec node --enable-source-maps packages/api/dist/server.js
