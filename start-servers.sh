#!/bin/bash

# Kill existing processes
pkill -f "ts-node-dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start backend
echo "Starting backend..."
cd /home/z/my-project/backend
node /home/z/my-project/backend/node_modules/.bin/ts-node-dev --respawn --transpile-only src/index.ts &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Start frontend
echo "Starting frontend..."
cd /home/z/my-project
node /home/z/my-project/node_modules/.bin/next dev -p 3000 --turbopack &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for servers to be ready
echo "Waiting for servers..."
sleep 10

# Verify servers are running
echo "Verifying servers..."
curl -s http://localhost:3001/health && echo " - Backend OK"
curl -s -o /dev/null -w "Frontend HTTP: %{http_code}\n" http://localhost:3000

# Keep script running to maintain processes
echo "Servers running. Press Ctrl+C to stop."
wait
