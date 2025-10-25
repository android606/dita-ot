# Discord Bot CLI - Server Deployment Guide

This guide covers multiple ways to deploy the Discord Bot CLI to your server.

## 🚀 Quick Installation (Recommended)

### 1. Automated Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd discord-bot-cli-js

# Run the installation script
sudo ./install.sh
```

### 2. Configure Your Bot

```bash
# Copy the environment template
sudo cp /etc/discord-bot/.env.template /etc/discord-bot/.env

# Edit with your Discord credentials
sudo nano /etc/discord-bot/.env
```

Add your Discord bot token and channel ID:
```bash
DISCORD_BOT_TOKEN=your_actual_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here
DISCORD_GUILD_ID=your_guild_id_here
```

### 3. Start the Service

```bash
# Start the service
sudo systemctl start discord-bot

# Check status
sudo systemctl status discord-bot

# View logs
sudo journalctl -u discord-bot -f
```

## 🔧 Manual Installation

### 1. Install Dependencies

**Ubuntu/Debian:**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install additional tools
sudo apt-get install -y socat curl
```

**CentOS/RHEL/Fedora:**
```bash
# Install Node.js 18+
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install additional tools
sudo yum install -y socat curl
```

### 2. Install Application

```bash
# Create directories
sudo mkdir -p /opt/discord-bot
sudo mkdir -p /etc/discord-bot
sudo mkdir -p /var/log/discord-bot
sudo mkdir -p /var/run/discord-bot

# Copy files
sudo cp -r src/ /opt/discord-bot/
sudo cp -r config/ /opt/discord-bot/
sudo cp -r scripts/ /opt/discord-bot/
sudo cp package.json /opt/discord-bot/

# Install dependencies
cd /opt/discord-bot
sudo npm install --production

# Set permissions
sudo chown -R discord-bot:discord-bot /opt/discord-bot
sudo chmod +x /opt/discord-bot/scripts/*.sh
```

### 3. Create System Service

```bash
# Create service file
sudo nano /etc/systemd/system/discord-bot.service
```

Add the following content:
```ini
[Unit]
Description=Discord Bot CLI
After=network.target
Wants=network.target

[Service]
Type=simple
User=discord-bot
Group=discord-bot
WorkingDirectory=/opt/discord-bot
ExecStart=/usr/bin/node /opt/discord-bot/src/index.js --config /etc/discord-bot/config.yaml
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=discord-bot

Environment=NODE_ENV=production
Environment=DISCORD_LOG_FILE=/var/log/discord-bot/discord-bot.log

[Install]
WantedBy=multi-user.target
```

### 4. Enable and Start

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable discord-bot

# Start service
sudo systemctl start discord-bot
```

## 🐳 Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache socat curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY src/ ./src/
COPY config/ ./config/
COPY scripts/ ./scripts/

# Create user
RUN addgroup -g 1001 -S discord-bot && \
    adduser -S discord-bot -u 1001

# Set permissions
RUN chown -R discord-bot:discord-bot /app
RUN chmod +x scripts/*.sh

USER discord-bot

EXPOSE 3000

CMD ["node", "src/index.js"]
```

### 2. Build and Run

```bash
# Build image
docker build -t discord-bot-cli .

# Run container
docker run -d \
  --name discord-bot \
  --restart unless-stopped \
  -e DISCORD_BOT_TOKEN=your_token \
  -e DISCORD_CHANNEL_ID=your_channel_id \
  -v /var/run/discord-bot:/var/run/discord-bot \
  -v /var/log/discord-bot:/var/log/discord-bot \
  discord-bot-cli
```

## 🔧 Configuration Options

### Environment Variables

```bash
# Required
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CHANNEL_ID=your_channel_id

# Optional
DISCORD_GUILD_ID=your_guild_id
DISCORD_PREFIX=!
DISCORD_LOG_LEVEL=info
DISCORD_SERVICE_ENABLED=true
DISCORD_SOCKET_ENABLED=true
DISCORD_FILE_ENABLED=false
```

### Configuration File

Edit `/etc/discord-bot/config.yaml`:

```yaml
bot:
  token: "${DISCORD_BOT_TOKEN}"
  channelId: 123456789012345678
  prefix: "!"

service:
  enabled: true
  scriptDirectory: "/opt/discord-bot/scripts"
  allowedCommands: ["ls", "ps", "df", "free", "uptime", "whoami", "pwd"]

socket:
  enabled: true
  socketPath: "/var/run/discord-bot/discord-bot.sock"
  socketMode: 438

logging:
  level: "info"
  file: "/var/log/discord-bot/discord-bot.log"
```

## 📋 Management Commands

### Using Make

```bash
# Install
make install

# Start/Stop/Restart
make start
make stop
make restart

# View logs
make logs
make logs-file

# Test functionality
make test
make socket-test
make file-send

# Monitor
make status
make monitor
```

### Using Systemctl

```bash
# Service management
sudo systemctl start discord-bot
sudo systemctl stop discord-bot
sudo systemctl restart discord-bot
sudo systemctl status discord-bot

# View logs
sudo journalctl -u discord-bot -f
sudo tail -f /var/log/discord-bot/discord-bot.log
```

## 🔌 Usage Examples

### 1. Basic Discord Commands

Once running, use these commands in your Discord channel:

```
!help          # Show available commands
!status        # Show bot status
!ls -la        # List files
!ps aux        # Show processes
!df -h         # Show disk usage
!./hello.sh    # Run custom script
```

### 2. File-based Messaging

```bash
# Send message via file
echo "System check complete" > /tmp/discord_input

# Read responses
cat /tmp/discord_output
```

### 3. Socket Communication

```bash
# Send message via socket
echo '{"command": "send", "content": "Hello via socket!"}' | \
  socat - UNIX-CONNECT:/var/run/discord-bot/discord-bot.sock

# Get status
echo '{"command": "status"}' | \
  socat - UNIX-CONNECT:/var/run/discord-bot/discord-bot.sock
```

### 4. Shell Integration

```bash
# Pipe output to Discord
uptime | discord-bot --stdin

# Monitor logs and send to Discord
tail -f /var/log/syslog | discord-bot --stdin
```

## 🔒 Security Considerations

### 1. File Permissions

```bash
# Set proper permissions
sudo chown -R discord-bot:discord-bot /opt/discord-bot
sudo chmod 600 /etc/discord-bot/.env
sudo chmod 644 /etc/discord-bot/config.yaml
```

### 2. Firewall Rules

```bash
# Allow only local connections
sudo ufw deny from any to any port 3000
sudo ufw allow from 127.0.0.1 to any port 3000
```

### 3. Service User

The bot runs as a dedicated `discord-bot` user with minimal privileges:

- No shell access
- No home directory
- Limited file system access
- No sudo privileges

## 🐛 Troubleshooting

### Common Issues

1. **Service won't start:**
   ```bash
   sudo journalctl -u discord-bot -n 50
   sudo systemctl status discord-bot
   ```

2. **Permission denied:**
   ```bash
   sudo chown -R discord-bot:discord-bot /opt/discord-bot
   sudo chmod +x /opt/discord-bot/scripts/*.sh
   ```

3. **Discord connection failed:**
   - Check bot token
   - Verify channel ID
   - Check network connectivity

4. **Scripts not executing:**
   ```bash
   sudo chmod +x /opt/discord-bot/scripts/*.sh
   sudo systemctl restart discord-bot
   ```

### Debug Mode

```bash
# Run with debug logging
sudo -u discord-bot node /opt/discord-bot/src/index.js --log-level debug
```

## 📊 Monitoring

### 1. Service Health

```bash
# Check service status
make status

# Monitor logs
make logs

# Check system resources
make monitor
```

### 2. Log Analysis

```bash
# View recent errors
sudo journalctl -u discord-bot --since "1 hour ago" | grep ERROR

# Monitor real-time
sudo tail -f /var/log/discord-bot/discord-bot.log
```

### 3. Performance Monitoring

```bash
# Check memory usage
ps aux | grep discord-bot

# Check socket connections
ss -l | grep discord-bot

# Monitor file system
df -h /var/log/discord-bot
```

## 🔄 Updates

### 1. Update Application

```bash
# Pull latest changes
git pull origin main

# Reinstall
sudo make install

# Restart service
sudo make restart
```

### 2. Backup Configuration

```bash
# Create backup
sudo make backup

# Restore from backup
sudo tar -xzf discord-bot-backup-*.tar.gz -C /
```

## 🆘 Support

If you encounter issues:

1. Check the logs: `sudo journalctl -u discord-bot -f`
2. Verify configuration: `sudo nano /etc/discord-bot/config.yaml`
3. Test manually: `sudo -u discord-bot node /opt/discord-bot/src/index.js --help`
4. Check permissions: `ls -la /opt/discord-bot/scripts/`

For additional help, check the main README.md file or create an issue in the repository.