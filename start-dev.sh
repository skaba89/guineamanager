#!/bin/bash

# GuinéaManager ERP - Local Development Start Script
# This script starts both frontend and backend for local development

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         GuinéaManager ERP - Local Development              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Set environment variables
export NODE_ENV=development
export DATABASE_URL="file:./db/dev.db"
export JWT_SECRET="dev-secret-key-change-in-production"
export BACKEND_URL="http://localhost:3001"
export NEXT_PUBLIC_API_URL="/api"
export PORT=3000

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    npm install --legacy-peer-deps
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd backend && npm install --legacy-peer-deps && cd ..
fi

# Setup backend database
echo -e "${BLUE}🗄️  Setting up backend database...${NC}"
cd backend
if [ ! -f "prisma/dev.db" ] && [ ! -f "../db/dev.db" ]; then
    echo -e "${YELLOW}   Creating database...${NC}"
    npx prisma db push --skip-generate
fi
cd ..

# Start backend
echo -e "${GREEN}🚀 Starting backend on port 3001...${NC}"
cd backend
npx ts-node-dev --respawn --transpile-only src/index.ts &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}   ⚠️  Backend health check timeout, continuing anyway...${NC}"
    else
        sleep 1
    fi
done

# Start frontend
echo -e "${GREEN}🌐 Starting frontend on port 3000...${NC}"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🎉 GuinéaManager ERP is running!                          ║"
echo "║                                                            ║"
echo "║  Frontend:  http://localhost:3000                          ║"
echo "║  Backend:   http://localhost:3001                          ║"
echo "║  API Docs:  http://localhost:3001/api/docs                 ║"
echo "║                                                            ║"
echo "║  Demo Login:                                               ║"
echo "║  Email:    demo@guineamanager.com                          ║"
echo "║  Password: demo123                                         ║"
echo "║                                                            ║"
echo "║  Press Ctrl+C to stop                                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Wait for processes
wait
