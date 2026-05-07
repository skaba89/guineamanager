#!/bin/bash

# ==============================================================================
# GuinéaManager - Start All Services
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   GuinéaManager ERP - Démarrage Complet${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

PROJECT_DIR="/home/z/my-project"
BACKEND_PID_FILE="/tmp/guineamanager-backend.pid"
FRONTEND_PID_FILE="/tmp/guineamanager-frontend.pid"

# ============================================================================
# 1. Start Backend
# ============================================================================
echo -e "${YELLOW}[1/2] Démarrage du Backend...${NC}"
cd $PROJECT_DIR/backend

# Kill existing
pkill -f "ts-node.*src/index.ts" 2>/dev/null || true
sleep 2

# Start backend
nohup node node_modules/.bin/ts-node --transpile-only src/index.ts > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > $BACKEND_PID_FILE

# Wait for backend
echo -n "    Attente du backend"
for i in {1..15}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Final check
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${RED}    ✗ Backend non démarré${NC}"
    tail -20 /tmp/backend.log
    exit 1
fi

echo -e "${GREEN}    ✓ Backend opérationnel (PID: $BACKEND_PID)${NC}"

# ============================================================================
# 2. Start Frontend
# ============================================================================
echo -e "${YELLOW}[2/2] Démarrage du Frontend...${NC}"
cd $PROJECT_DIR

# Kill existing
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Start frontend
nohup npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > $FRONTEND_PID_FILE

# Wait for frontend
echo -n "    Attente du frontend"
for i in {1..20}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Final check
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}    ✗ Frontend non démarré${NC}"
    tail -20 /tmp/frontend.log
    exit 1
fi

echo -e "${GREEN}    ✓ Frontend opérationnel (PID: $FRONTEND_PID)${NC}"

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ GuinéaManager ERP est opérationnel !${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}🌐 Application:${NC}  http://localhost:3000"
echo -e "  ${BLUE}🔧 API:${NC}        http://localhost:3001"
echo -e "  ${BLUE}📚 Docs:${NC}       http://localhost:3001/api/docs"
echo ""
echo -e "  ${YELLOW}Identifiants de test:${NC}"
echo -e "     Email: demo@guineamanager.com"
echo -e "     Mot de passe: demo123"
echo ""
echo -e "  ${YELLOW}Commandes utiles:${NC}"
echo -e "     Arrêter:     ${BLUE}./stop-all.sh${NC}"
echo -e "     Logs back:   ${BLUE}tail -f /tmp/backend.log${NC}"
echo -e "     Logs front:  ${BLUE}tail -f /tmp/frontend.log${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
