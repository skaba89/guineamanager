#!/bin/bash

# ==============================================================================
# GuinéaManager Backend - Robust Startup Script
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PORT=3001
PID_FILE="/tmp/guineamanager-backend.pid"
LOG_FILE="/tmp/guineamanager-backend.log"
BACKEND_DIR="/home/z/my-project/backend"

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   GuinéaManager Backend - Démarrage Robuste${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Kill existing processes
echo -e "${YELLOW}[1/5] Nettoyage des processus existants...${NC}"
pkill -f "ts-node.*src/index.ts" 2>/dev/null || true
pkill -f "node.*guineamanager" 2>/dev/null || true
sleep 2

# Check if port is free
if lsof -i :$PORT > /dev/null 2>&1; then
    echo -e "${YELLOW}    Port $PORT occupé, libération...${NC}"
    lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Clear old logs
> $LOG_FILE

# Start backend
echo -e "${YELLOW}[2/5] Démarrage du serveur backend...${NC}"
cd $BACKEND_DIR

# Start with nohup and capture PID
nohup node node_modules/.bin/ts-node --transpile-only src/index.ts > $LOG_FILE 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > $PID_FILE

echo -e "${GREEN}    Backend PID: $BACKEND_PID${NC}"

# Wait for startup
echo -e "${YELLOW}[3/5] Attente du démarrage...${NC}"
MAX_WAIT=30
WAIT_COUNT=0

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
        echo -e "${GREEN}    ✓ Backend démarré avec succès !${NC}"
        break
    fi
    
    # Check if process is still running
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${RED}    ✗ Le processus backend s'est arrêté !${NC}"
        echo -e "${RED}    Vérifiez les logs: tail -50 $LOG_FILE${NC}"
        exit 1
    fi
    
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    printf "\r    Attente... %ds/%ds" $WAIT_COUNT $MAX_WAIT
done

if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    echo -e "${RED}    ✗ Timeout: Le backend n'a pas démarré dans les temps${NC}"
    echo -e "${RED}    Logs: tail -50 $LOG_FILE${NC}"
    exit 1
fi

# Verify API
echo -e "${YELLOW}[4/5] Vérification de l'API...${NC}"
HEALTH=$(curl -s http://localhost:$PORT/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}    ✓ API opérationnelle${NC}"
    echo -e "${BLUE}    Health: $HEALTH${NC}"
else
    echo -e "${RED}    ✗ API non répondante${NC}"
    exit 1
fi

# Summary
echo -e "${YELLOW}[5/5] Résumé${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Backend GuinéaManager opérationnel !${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  📍 URL:     ${BLUE}http://localhost:$PORT${NC}"
echo -e "  📍 API:     ${BLUE}http://localhost:$PORT/api${NC}"
echo -e "  📍 Docs:    ${BLUE}http://localhost:$PORT/api/docs${NC}"
echo -e "  📍 Health:  ${BLUE}http://localhost:$PORT/health${NC}"
echo ""
echo -e "  📋 PID:     ${BACKEND_PID}"
echo -e "  📋 Logs:    ${LOG_FILE}"
echo ""
echo -e "  Pour arrêter: ${YELLOW}kill \$(cat $PID_FILE)${NC}"
echo -e "  Pour voir les logs: ${YELLOW}tail -f $LOG_FILE${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
