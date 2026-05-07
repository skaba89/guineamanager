#!/bin/bash
cd /home/z/my-project/backend
npx ts-node-dev --respawn --transpile-only src/index.ts &
BACKEND_PID=$!

sleep 5

cd /home/z/my-project
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Garder le script actif
wait $BACKEND_PID $FRONTEND_PID
