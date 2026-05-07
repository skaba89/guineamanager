#!/bin/sh
set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         GuinéaManager ERP - Starting Production            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Create necessary directories
mkdir -p /app/data /app/uploads 2>/dev/null || true

# Set environment variables
export DATABASE_URL="file:/app/data/prod.db"
export JWT_SECRET="${JWT_SECRET:-guineamanager-production-jwt-secret-$(date +%s)}"
export NODE_ENV="${NODE_ENV:-production}"

# =====================================================
# START BACKEND ON PORT 3001
# =====================================================
echo "🔧 [1/4] Starting Backend API on port 3001..."
cd /app/backend
export PORT=3001

# Initialize database schema
echo "📦 [2/4] Initializing database..."
npx prisma db push --skip-generate 2>&1 || {
    echo "⚠️  Database push had issues, trying to continue..."
}

# Start backend server in background
echo "🚀 [3/4] Launching backend server..."
node dist/index.js &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to be ready (with timeout)
echo "⏳ [4/4] Waiting for backend to be ready..."
BACKEND_READY=false
for i in $(seq 1 30); do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "   ✅ Backend is ready! (attempt $i)"
        BACKEND_READY=true
        break
    fi
    sleep 1
done

if [ "$BACKEND_READY" = false ]; then
    echo "   ⚠️  Backend health check timeout after 30s, continuing anyway..."
fi

# =====================================================
# START FRONTEND ON PORT 3000
# =====================================================
echo ""
echo "🌐 Starting Frontend on port 3000..."
cd /app
export PORT=3000
export BACKEND_URL="http://localhost:3001"

# Start Next.js server
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
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

node server.js

# Wait for background processes
wait
