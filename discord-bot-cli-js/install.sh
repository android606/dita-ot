#!/bin/bash
# Discord Bot CLI Installation Script
# This script installs the Discord Bot CLI as a system service

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

echo -e "${BLUE}🚀 Discord Bot CLI Installation Script${NC}"
echo "================================================"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Installing Node.js 18...${NC}"
    
    # Detect OS and install Node.js
    if [[ -f /etc/debian_version ]]; then
        # Debian/Ubuntu
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    elif [[ -f /etc/redhat-release ]]; then
        # RHEL/CentOS/Fedora
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
    else
        echo -e "${RED}❌ Unsupported OS. Please install Node.js 18+ manually.${NC}"
        exit 1
    fi
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [[ $NODE_VERSION -lt 16 ]]; then
    echo -e "${RED}❌ Node.js version 16+ required. Found: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"

# Create service user
if ! id "$SERVICE_USER" &>/dev/null; then
    echo -e "${BLUE}👤 Creating service user: $SERVICE_USER${NC}"
    useradd --system --shell /bin/false --home-dir $INSTALL_DIR --create-home $SERVICE_USER
else
    echo -e "${GREEN}✅ Service user $SERVICE_USER already exists${NC}"
fi

# Create directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p $INSTALL_DIR
mkdir -p $CONFIG_DIR
mkdir -p $LOG_DIR
mkdir -p $SCRIPT_DIR
mkdir -p $SOCKET_DIR

# Copy application files
echo -e "${BLUE}📦 Installing application files...${NC}"
cp -r src/ $INSTALL_DIR/
cp -r config/ $INSTALL_DIR/
cp -r scripts/ $INSTALL_DIR/
cp package.json $INSTALL_DIR/
cp package-lock.json $INSTALL_DIR/ 2>/dev/null || true

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
cd $INSTALL_DIR
npm install --production

# Set permissions
echo -e "${BLUE}🔐 Setting permissions...${NC}"
chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR
chown -R $SERVICE_USER:$SERVICE_USER $CONFIG_DIR
chown -R $SERVICE_USER:$SERVICE_USER $LOG_DIR
chown -R $SERVICE_USER:$SERVICE_USER $SOCKET_DIR

# Make scripts executable
chmod +x $INSTALL_DIR/scripts/*.sh
chmod +x $INSTALL_DIR/bin/discord-bot

# Create systemd service file
echo -e "${BLUE}⚙️  Creating systemd service...${NC}"
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=Discord Bot CLI
After=network.target
Wants=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/src/index.js --config $CONFIG_DIR/config.yaml
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=discord-bot

# Environment variables
Environment=NODE_ENV=production
Environment=DISCORD_LOG_FILE=$LOG_DIR/discord-bot.log

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_DIR $CONFIG_DIR $LOG_DIR $SOCKET_DIR

[Install]
WantedBy=multi-user.target
EOF

# Create default configuration
echo -e "${BLUE}⚙️  Creating default configuration...${NC}"
cat > $CONFIG_DIR/config.yaml << EOF
bot:
  token: "\${DISCORD_BOT_TOKEN}"
  applicationId: "1430759150131875842"
  publicKey: "adc3a5c25adb9712cfd70b7e7550a47d20274f9ba80976b316cf26bcaa900206"
  channelId: null
  guildId: null
  prefix: "!"
  autoReconnect: true
  maxReconnectAttempts: 5
  reconnectDelay: 5000

file:
  enabled: false
  inputFile: "/tmp/discord_input"
  outputFile: "/tmp/discord_output"
  watchInterval: 1000
  fileEncoding: "utf8"

socket:
  enabled: true
  socketPath: "$SOCKET_DIR/discord-bot.sock"
  socketMode: 438
  maxConnections: 10

service:
  enabled: true
  scriptDirectory: "$SCRIPT_DIR"
  allowedCommands: ["ls", "ps", "df", "free", "uptime", "whoami", "pwd", "systemctl", "journalctl"]
  maxExecutionTime: 30000
  workingDirectory: "$INSTALL_DIR"

logging:
  level: "info"
  file: "$LOG_DIR/discord-bot.log"
  maxFileSize: 10485760
  backupCount: 5
EOF

# Create environment file template
cat > $CONFIG_DIR/.env.template << EOF
# Discord Bot Configuration
# Copy this file to .env and fill in your values

# Required: Your Discord bot token
DISCORD_BOT_TOKEN=your_bot_token_here

# Required: Your Discord channel ID
DISCORD_CHANNEL_ID=your_channel_id_here

# Optional: Your Discord guild ID
DISCORD_GUILD_ID=your_guild_id_here

# Optional: Command prefix (default: !)
DISCORD_PREFIX=!

# Optional: Logging level (debug, info, warn, error)
DISCORD_LOG_LEVEL=info
EOF

# Create wrapper script
echo -e "${BLUE}🔧 Creating wrapper script...${NC}"
cat > /usr/local/bin/discord-bot << EOF
#!/bin/bash
# Discord Bot CLI Wrapper Script

# Load environment variables if .env file exists
if [[ -f $CONFIG_DIR/.env ]]; then
    export \$(cat $CONFIG_DIR/.env | grep -v '^#' | xargs)
fi

# Run the bot with all arguments
exec /usr/bin/node $INSTALL_DIR/src/index.js "\$@"
EOF

chmod +x /usr/local/bin/discord-bot

# Reload systemd and enable service
echo -e "${BLUE}🔄 Reloading systemd...${NC}"
systemctl daemon-reload
systemctl enable $SERVICE_NAME

# Create logrotate configuration
echo -e "${BLUE}📋 Creating logrotate configuration...${NC}"
cat > /etc/logrotate.d/discord-bot << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
    postrotate
        systemctl reload $SERVICE_NAME > /dev/null 2>&1 || true
    endscript
}
EOF

echo -e "${GREEN}✅ Installation completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Copy your Discord bot token:"
echo "   sudo cp $CONFIG_DIR/.env.template $CONFIG_DIR/.env"
echo "   sudo nano $CONFIG_DIR/.env"
echo ""
echo "2. Set your Discord channel ID in the config:"
echo "   sudo nano $CONFIG_DIR/config.yaml"
echo ""
echo "3. Start the service:"
echo "   sudo systemctl start $SERVICE_NAME"
echo "   sudo systemctl status $SERVICE_NAME"
echo ""
echo "4. View logs:"
echo "   sudo journalctl -u $SERVICE_NAME -f"
echo "   sudo tail -f $LOG_DIR/discord-bot.log"
echo ""
echo -e "${GREEN}🎉 Discord Bot CLI is ready to use!${NC}"