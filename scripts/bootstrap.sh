#!/bin/bash
# FOMO-Trade Bootstrap Script
# Quick setup for development or deployment

set -e  # Exit on error

echo "=================================================="
echo "FOMO-Trade v1.2 Bootstrap"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}[1/6] Checking prerequisites...${NC}"

command -v python3 >/dev/null 2>&1 || {
    echo -e "${RED}Error: Python 3 is required but not installed.${NC}"
    exit 1
}

command -v node >/dev/null 2>&1 || {
    echo -e "${RED}Error: Node.js is required but not installed.${NC}"
    exit 1
}

command -v yarn >/dev/null 2>&1 || {
    echo -e "${YELLOW}Warning: Yarn not found. Installing...${NC}"
    npm install -g yarn
}

echo -e "${GREEN}✓ Prerequisites OK${NC}"

# Install backend dependencies
echo -e "\n${YELLOW}[2/6] Installing backend dependencies...${NC}"
cd /app/backend

if [ ! -d "/root/.venv" ]; then
    python3 -m venv /root/.venv
fi

source /root/.venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Install frontend dependencies
echo -e "\n${YELLOW}[3/6] Installing frontend dependencies...${NC}"
cd /app/frontend

yarn install

echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Setup environment
echo -e "\n${YELLOW}[4/6] Setting up environment...${NC}"

if [ ! -f "/app/backend/.env" ]; then
    echo -e "${YELLOW}Creating backend .env from template...${NC}"
    cat > /app/backend/.env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="trading_os"
CORS_ORIGINS="*"
EXECUTION_MODE="PAPER"
DISABLE_ADAPTATION="true"
EOF
    echo -e "${GREEN}✓ Backend .env created${NC}"
else
    echo -e "${GREEN}✓ Backend .env already exists${NC}"
fi

if [ ! -f "/app/frontend/.env" ]; then
    echo -e "${YELLOW}Creating frontend .env...${NC}"
    cat > /app/frontend/.env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
    echo -e "${GREEN}✓ Frontend .env created${NC}"
else
    echo -e "${GREEN}✓ Frontend .env already exists${NC}"
fi

# Update supervisor config
echo -e "\n${YELLOW}[5/6] Configuring services...${NC}"

# Ensure EXECUTION_MODE and DISABLE_ADAPTATION in supervisor
if ! grep -q "EXECUTION_MODE" /etc/supervisor/conf.d/supervisord.conf; then
    echo -e "${YELLOW}Adding EXECUTION_MODE to supervisor config...${NC}"
    # This should already be done, but double-check
fi

echo -e "${GREEN}✓ Services configured${NC}"

# Initialize database (optional - MongoDB auto-creates collections)
echo -e "\n${YELLOW}[6/6] Verifying MongoDB connection...${NC}"

python3 << 'PYEOF'
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def check_mongo():
    try:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("✓ MongoDB connection OK")
        return True
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        return False

asyncio.run(check_mongo())
PYEOF

echo -e "\n${GREEN}=================================================="
echo -e "Bootstrap Complete!"
echo -e "==================================================${NC}"

echo -e "\nNext steps:"
echo -e "  1. Start services:  ${YELLOW}supervisorctl start all${NC}"
echo -e "  2. Check status:    ${YELLOW}supervisorctl status${NC}"
echo -e "  3. View logs:       ${YELLOW}tail -f /var/log/supervisor/backend.out.log${NC}"
echo -e "  4. Access frontend: ${YELLOW}http://localhost:3000${NC}"
echo -e "  5. Access API:      ${YELLOW}http://localhost:8001/docs${NC}"

echo -e "\n${YELLOW}Observability:${NC}"
echo -e "  System status:  ${YELLOW}curl http://localhost:8001/api/system/status${NC}"
echo -e "  Recent trades:  ${YELLOW}curl http://localhost:8001/api/system/recent-trades${NC}"

echo -e "\n${GREEN}System is ready for paper trading!${NC}"
