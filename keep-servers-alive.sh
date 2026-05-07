#!/bin/bash

# Fonction pour démarrer le backend
start_backend() {
    cd /home/z/my-project/backend
    npx ts-node-dev --respawn --transpile-only src/index.ts > /tmp/backend.log 2>&1 &
    echo $!
}

# Fonction pour démarrer le frontend
start_frontend() {
    cd /home/z/my-project
    npm run dev > /tmp/frontend.log 2>&1 &
    echo $!
}

# Démarrer les serveurs
BACKEND_PID=$(start_backend)
FRONTEND_PID=$(start_frontend)

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Boucle de surveillance
while true; do
    sleep 60
done
