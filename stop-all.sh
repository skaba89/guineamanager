#!/bin/bash

# ==============================================================================
# GuinéaManager - Stop All Services
# ==============================================================================

echo "🛑 Arrêt de GuinéaManager..."

# Kill backend
pkill -f "ts-node.*src/index.ts" 2>/dev/null && echo "   ✓ Backend arrêté"
pkill -f "ts-node-dev" 2>/dev/null

# Kill frontend
pkill -f "next dev" 2>/dev/null && echo "   ✓ Frontend arrêté"

# Clean PID files
rm -f /tmp/guineamanager-backend.pid
rm -f /tmp/guineamanager-frontend.pid

# Check ports
if lsof -i :3000 > /dev/null 2>&1; then
    echo "   Libération du port 3000..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null
fi

if lsof -i :3001 > /dev/null 2>&1; then
    echo "   Libération du port 3001..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null
fi

echo "✅ Tous les services sont arrêtés"
