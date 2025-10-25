#!/bin/bash
# Quick deployment script for Discord Bot CLI

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Discord Bot CLI - Quick Deployment${NC}"
echo "========================================"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Make scripts executable
chmod +x scripts/*.sh
chmod +x bin/discord-bot

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Create environment file
echo -e "${BLUE}⚙️  Setting up configuration...${NC}"
if [[ ! -f .env ]]; then
    cat > .env << EOF
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_APPLICATION_ID=1430759150131875842
DISCORD_PUBLIC_KEY=adc3a5c25adb9712cfd70b7e7550a47d20274f9ba80976b316cf26bcaa900206
DISCORD_CHANNEL_ID=your_channel_id_here
DISCORD_GUILD_ID=your_guild_id_here
DISCORD_PREFIX=!
DISCORD_LOG_LEVEL=info
DISCORD_SERVICE_ENABLED=true
DISCORD_SOCKET_ENABLED=true
DISCORD_FILE_ENABLED=false
EOF
    echo -e "${YELLOW}⚠️  Created .env file. Please edit it with your Discord credentials.${NC}"
fi

# Test the application
echo -e "${BLUE}🧪 Testing application...${NC}"
node src/index.js --help > /dev/null
echo -e "${GREEN}✅ Application test passed${NC}"

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Edit .env file with your Discord credentials:"
echo "   nano .env"
echo ""
echo "2. Test the bot:"
echo "   node src/index.js --service --script-dir ./scripts"
echo ""
echo "3. For production, run the full installation:"
echo "   sudo ./install.sh"
echo ""
echo -e "${BLUE}💡 Quick test commands:${NC}"
echo "   echo 'Hello from shell!' | node src/index.js --stdin"
echo "   node src/index.js --socket-path /tmp/discord.sock &"
echo "   echo '{\"command\": \"status\"}' | socat - UNIX-CONNECT:/tmp/discord.sock"