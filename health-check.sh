#!/bin/bash

# ==============================================================================
# GuinéaManager - Health Check
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   GuinéaManager - Vérification de Santé${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

ERRORS=0

# Check Backend
echo -e "${YELLOW}[1/4] Backend (port 3001)${NC}"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:3001/health)
    echo -e "   ${GREEN}✓ Backend opérationnel${NC}"
    echo -e "   Status: $HEALTH"
else
    echo -e "   ${RED}✗ Backend non répondant${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Frontend
echo ""
echo -e "${YELLOW}[2/4] Frontend (port 3000)${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓ Frontend opérationnel${NC}"
else
    echo -e "   ${RED}✗ Frontend non répondant${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Database
echo ""
echo -e "${YELLOW}[3/4] Base de données${NC}"
DB_FILE="/home/z/my-project/db/custom.db"
if [ -f "$DB_FILE" ]; then
    SIZE=$(du -h "$DB_FILE" | cut -f1)
    echo -e "   ${GREEN}✓ Base de données présente (${SIZE})${NC}"
else
    echo -e "   ${RED}✗ Base de données introuvable${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test Login API
echo ""
echo -e "${YELLOW}[4/4] Test API Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@guineamanager.com","password":"demo123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "   ${GREEN}✓ Authentification fonctionnelle${NC}"
else
    echo -e "   ${RED}✗ Échec de l'authentification${NC}"
    echo "   Response: $LOGIN_RESPONSE"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}  ✅ Tous les services sont opérationnels !${NC}"
else
    echo -e "${RED}  ⚠️  $ERRORS problème(s) détecté(s)${NC}"
    echo ""
    echo -e "  Pour redémarrer: ${YELLOW}./start-all.sh${NC}"
fi
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
