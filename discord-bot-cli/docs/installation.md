# Installation Guide

## Prerequisites

- Python 3.8 or higher
- Linux operating system
- Discord bot token (from Discord Developer Portal)

## Quick Installation

### 1. Clone or Download
```bash
git clone <repository-url>
cd discord-bot-cli
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Set Up Discord Bot
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token
5. Enable "Message Content Intent" in Bot settings

### 4. Configure and Run
```bash
export DISCORD_BOT_TOKEN="your_bot_token_here"
export DISCORD_CHANNEL_ID="your_channel_id_here"
python -m discord_bot_cli.main
```

## Detailed Installation

### System Requirements

- **Operating System**: Linux (tested on Ubuntu 20.04+, CentOS 8+, Debian 11+)
- **Python**: 3.8 or higher
- **Memory**: 64MB minimum, 256MB recommended
- **Disk Space**: 50MB for installation

### Installation Methods

#### Method 1: Direct Installation
```bash
# Clone repository
git clone <repository-url>
cd discord-bot-cli

# Install dependencies
pip install -r requirements.txt

# Install the package
pip install -e .
```

#### Method 2: Virtual Environment (Recommended)
```bash
# Create virtual environment
python3 -m venv discord-bot-env
source discord-bot-env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install the package
pip install -e .
```

#### Method 3: System Package Installation
```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install python3-pip python3-venv

# Install Python dependencies
pip3 install --user -r requirements.txt
```

### Discord Bot Setup

#### 1. Create Discord Application
1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Enter application name (e.g., "My Bot CLI")
4. Click "Create"

#### 2. Create Bot
1. Go to "Bot" section in the left sidebar
2. Click "Add Bot"
3. Customize bot name and avatar if desired
4. Copy the bot token (keep this secure!)

#### 3. Configure Bot Permissions
1. Go to "OAuth2" > "URL Generator"
2. Select "bot" scope
3. Select required permissions:
   - Send Messages
   - Read Message History
   - Use Slash Commands (optional)
   - Read Messages/View Channels
4. Copy the generated URL and open it in browser
5. Select your server and authorize the bot

#### 4. Get Channel ID
1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click on the target channel
3. Select "Copy ID"
4. This is your `DISCORD_CHANNEL_ID`

### Configuration

#### Environment Variables
Create a `.env` file or set environment variables:
```bash
# Required
export DISCORD_BOT_TOKEN="your_bot_token_here"
export DISCORD_CHANNEL_ID="your_channel_id_here"

# Optional
export DISCORD_GUILD_ID="your_guild_id_here"
export DISCORD_PREFIX="!"
export DISCORD_LOG_LEVEL="INFO"
```

#### Configuration File
Create `discord-bot.yaml`:
```yaml
bot:
  token: "your_bot_token_here"
  channel_id: 123456789012345678
  prefix: "!"

file:
  enabled: true
  input_file: "/tmp/discord_input"
  output_file: "/tmp/discord_output"

service:
  enabled: true
  script_directory: "./scripts"
```

### Running the Bot

#### Basic Usage
```bash
# Using environment variables
discord-bot-cli

# Using configuration file
discord-bot-cli --config discord-bot.yaml

# Using command-line options
discord-bot-cli --token "your_token" --channel-id 123456789
```

#### Service Mode
```bash
# Enable service mode
discord-bot-cli --service --script-dir ./scripts

# In Discord, use commands:
# !ls -la
# !ps aux
# !help
```

#### File-based Messaging
```bash
# Enable file-based messaging
discord-bot-cli --file-input /tmp/discord_input --file-output /tmp/discord_output

# Send message
echo "Hello from file!" > /tmp/discord_input

# Read response
cat /tmp/discord_output
```

#### Unix Socket Communication
```bash
# Start with socket
discord-bot-cli --socket-path /tmp/discord.sock &

# Send message via socket
echo '{"command": "send", "content": "Hello!"}' | socat - UNIX-CONNECT:/tmp/discord.sock
```

## System Service Installation

### systemd Service (Recommended)

#### 1. Create Service File
```bash
sudo nano /etc/systemd/system/discord-bot.service
```

#### 2. Service Configuration
```ini
[Unit]
Description=Discord Bot CLI
After=network.target

[Service]
Type=simple
User=discord-bot
Group=discord-bot
WorkingDirectory=/opt/discord-bot-cli
Environment=DISCORD_BOT_TOKEN=your_bot_token_here
Environment=DISCORD_CHANNEL_ID=your_channel_id_here
ExecStart=/opt/discord-bot-cli/venv/bin/discord-bot-cli --config /etc/discord-bot/config.yaml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 3. Create User and Directory
```bash
sudo useradd -r -s /bin/false discord-bot
sudo mkdir -p /opt/discord-bot-cli
sudo mkdir -p /etc/discord-bot
sudo chown -R discord-bot:discord-bot /opt/discord-bot-cli
sudo chown -R discord-bot:discord-bot /etc/discord-bot
```

#### 4. Install and Start Service
```bash
# Copy application files
sudo cp -r discord-bot-cli/* /opt/discord-bot-cli/
sudo cp discord-bot.yaml /etc/discord-bot/config.yaml

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable discord-bot
sudo systemctl start discord-bot

# Check status
sudo systemctl status discord-bot
```

### Docker Installation

#### 1. Create Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN pip install -e .

USER 1000
CMD ["discord-bot-cli"]
```

#### 2. Build and Run
```bash
# Build image
docker build -t discord-bot-cli .

# Run container
docker run -d \
  --name discord-bot \
  -e DISCORD_BOT_TOKEN="your_token" \
  -e DISCORD_CHANNEL_ID="your_channel_id" \
  -v /tmp:/tmp \
  discord-bot-cli
```

## Verification

### Test Basic Functionality
```bash
# Test stdin/stdout
echo "Test message" | discord-bot-cli --stdin

# Test file-based messaging
discord-bot-cli --file-input /tmp/test_input --file-output /tmp/test_output &
echo "File test" > /tmp/test_input
sleep 2
cat /tmp/test_output
```

### Test Service Mode
```bash
# Start service mode
discord-bot-cli --service --script-dir ./scripts &

# In Discord, try:
# !help
# !status
# !ls -la
```

### Check Logs
```bash
# View logs
tail -f /var/log/discord-bot.log

# Or with journalctl (systemd)
journalctl -u discord-bot -f
```

## Troubleshooting

### Common Issues

#### 1. Permission Denied
```bash
# Fix socket permissions
chmod 600 /tmp/discord-bot.sock

# Fix script permissions
chmod +x ./scripts/*
```

#### 2. Bot Token Invalid
- Verify token is correct
- Check bot is properly configured in Discord Developer Portal
- Ensure "Message Content Intent" is enabled

#### 3. Channel Not Found
- Verify channel ID is correct
- Check bot has access to the channel
- Ensure bot is in the correct server

#### 4. Dependencies Missing
```bash
# Install missing dependencies
pip install -r requirements.txt

# Or reinstall
pip install --force-reinstall -r requirements.txt
```

#### 5. Service Won't Start
```bash
# Check service status
sudo systemctl status discord-bot

# Check logs
sudo journalctl -u discord-bot -n 50

# Restart service
sudo systemctl restart discord-bot
```

### Debug Mode
```bash
# Run with debug logging
discord-bot-cli --log-level DEBUG

# Check configuration
discord-bot-cli --config discord-bot.yaml --log-level DEBUG
```

## Uninstallation

### Remove Service
```bash
sudo systemctl stop discord-bot
sudo systemctl disable discord-bot
sudo rm /etc/systemd/system/discord-bot.service
sudo systemctl daemon-reload
```

### Remove Files
```bash
sudo rm -rf /opt/discord-bot-cli
sudo rm -rf /etc/discord-bot
sudo userdel discord-bot
```

### Remove Python Package
```bash
pip uninstall discord-bot-cli
```

## Security Considerations

### File Permissions
- Bot token should be readable only by the bot user
- Socket files should have restricted permissions (600)
- Log files should be readable only by the bot user

### Network Security
- Bot only connects to Discord servers
- No incoming network connections (except Unix socket)
- Socket files should be in secure directories

### Script Execution
- Only execute trusted scripts
- Use restricted user account
- Set appropriate execution timeouts
- Monitor script execution logs