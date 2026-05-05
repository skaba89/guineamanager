#!/bin/bash

# Démarrer le backend
cd /home/z/my-project/backend
npx ts-node-dev --respawn --transpile-only src/index.ts &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Attendre le backend
sleep 5

# Démarrer le frontend
cd /home/z/my-project
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Garder le script en vie
wait
