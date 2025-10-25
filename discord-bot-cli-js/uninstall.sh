#!/bin/bash
# Discord Bot CLI Uninstallation Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_USER="discord-bot"
SERVICE_NAME="discord-bot"
INSTALL_DIR="/opt/discord-bot"
CONFIG_DIR="/etc/discord-bot"
LOG_DIR="/var/log/discord-bot"
SCRIPT_DIR="/opt/discord-bot/scripts"
SOCKET_DIR="/var/run/discord-bot"

echo -e "${BLUE}🗑️  Discord Bot CLI Uninstallation Script${NC}"
echo "================================================"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Stop and disable service
echo -e "${BLUE}🛑 Stopping service...${NC}"
systemctl stop $SERVICE_NAME 2>/dev/null || true
systemctl disable $SERVICE_NAME 2>/dev/null || true

# Remove systemd service file
echo -e "${BLUE}🗑️  Removing systemd service...${NC}"
rm -f /etc/systemd/system/$SERVICE_NAME.service
systemctl daemon-reload

# Remove wrapper script
echo -e "${BLUE}🗑️  Removing wrapper script...${NC}"
rm -f /usr/local/bin/discord-bot

# Remove logrotate configuration
echo -e "${BLUE}🗑️  Removing logrotate configuration...${NC}"
rm -f /etc/logrotate.d/discord-bot

# Ask for confirmation before removing files
echo -e "${YELLOW}⚠️  This will remove all Discord Bot CLI files and data.${NC}"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Uninstallation cancelled.${NC}"
    exit 1
fi

# Remove application files
echo -e "${BLUE}🗑️  Removing application files...${NC}"
rm -rf $INSTALL_DIR

# Remove configuration files
echo -e "${BLUE}🗑️  Removing configuration files...${NC}"
rm -rf $CONFIG_DIR

# Remove log files
echo -e "${BLUE}🗑️  Removing log files...${NC}"
rm -rf $LOG_DIR

# Remove socket files
echo -e "${BLUE}🗑️  Removing socket files...${NC}"
rm -rf $SOCKET_DIR

# Remove service user
echo -e "${BLUE}🗑️  Removing service user...${NC}"
if id "$SERVICE_USER" &>/dev/null; then
    userdel $SERVICE_USER
    echo -e "${GREEN}✅ Service user $SERVICE_USER removed${NC}"
else
    echo -e "${YELLOW}⚠️  Service user $SERVICE_USER not found${NC}"
fi

# Remove home directory
rm -rf /home/$SERVICE_USER 2>/dev/null || true

echo -e "${GREEN}✅ Uninstallation completed successfully!${NC}"
echo -e "${YELLOW}ℹ️  Note: Node.js and npm were not removed.${NC}"