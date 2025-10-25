# Usage Examples

## Basic Examples

### 1. Simple stdin/stdout Communication

Send a message to Discord and receive responses:

```bash
# Send message to Discord
echo "Hello from shell!" | discord-bot-cli --stdin

# Interactive mode
discord-bot-cli --stdin
# Type messages and press Enter
# Press Ctrl+C to exit
```

### 2. File-based Messaging

Use files for communication:

```bash
# Start bot with file-based messaging
discord-bot-cli --file-input /tmp/discord_input --file-output /tmp/discord_output &

# Send message by writing to input file
echo "System status check" > /tmp/discord_input

# Read response from output file
cat /tmp/discord_output
```

### 3. Unix Socket Communication

Use Unix sockets for IPC:

```bash
# Start bot with socket
discord-bot-cli --socket-path /tmp/discord.sock &

# Send message via socket
echo '{"command": "send", "content": "Hello via socket!"}' | socat - UNIX-CONNECT:/tmp/discord.sock

# Check bot status
echo '{"command": "status"}' | socat - UNIX-CONNECT:/tmp/discord.sock

# Get recent messages
echo '{"command": "get_messages", "limit": 5}' | socat - UNIX-CONNECT:/tmp/discord.sock
```

## Service Mode Examples

### 1. Basic Service Mode

Enable service mode for remote command execution:

```bash
# Start service mode
discord-bot-cli --service --script-dir ./scripts

# In Discord, use commands:
# !help
# !status
# !ls -la
# !ps aux
# !df -h
```

### 2. Custom Scripts

Create custom scripts for service mode:

```bash
# Create script directory
mkdir -p scripts

# Create a system info script
cat > scripts/sysinfo.sh << 'EOF'
#!/bin/bash
echo "=== System Information ==="
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime)"
echo "Memory: $(free -h)"
echo "Disk: $(df -h /)"
echo "Date: $(date)"
EOF

chmod +x scripts/sysinfo.sh

# Start service mode
discord-bot-cli --service --script-dir ./scripts

# In Discord, use:
# !./sysinfo.sh
```

### 3. Advanced Script with Discord Context

Create a script that uses Discord context:

```bash
cat > scripts/respond.sh << 'EOF'
#!/bin/bash
echo "Hello $DISCORD_AUTHOR!"
echo "You sent: $DISCORD_MESSAGE_CONTENT"
echo "From channel: $DISCORD_CHANNEL_ID"
echo "Arguments: $DISCORD_ARGS"
EOF

chmod +x scripts/respond.sh

# In Discord, use:
# !./respond.sh hello world
```

## Integration Examples

### 1. System Monitoring

Monitor system resources and send alerts:

```bash
# Create monitoring script
cat > scripts/monitor.sh << 'EOF'
#!/bin/bash
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "⚠️ High memory usage: ${MEMORY_USAGE}%"
fi

if [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️ High disk usage: ${DISK_USAGE}%"
fi

echo "Memory: ${MEMORY_USAGE}%, Disk: ${DISK_USAGE}%"
EOF

chmod +x scripts/monitor.sh

# Set up cron job to run every 5 minutes
echo "*/5 * * * * /path/to/scripts/monitor.sh | discord-bot-cli --stdin" | crontab -
```

### 2. Log Monitoring

Monitor log files and send alerts:

```bash
# Create log monitoring script
cat > scripts/logmonitor.sh << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/syslog"
ERROR_COUNT=$(grep -c "ERROR" "$LOG_FILE" 2>/dev/null || echo "0")

if [ "$ERROR_COUNT" -gt 10 ]; then
    echo "🚨 High error count in logs: $ERROR_COUNT errors"
    echo "Recent errors:"
    grep "ERROR" "$LOG_FILE" | tail -5
fi
EOF

chmod +x scripts/logmonitor.sh
```

### 3. Backup Status

Check backup status and report:

```bash
# Create backup status script
cat > scripts/backup_status.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

if [ -n "$LATEST_BACKUP" ]; then
    BACKUP_DATE=$(stat -c %y "$LATEST_BACKUP" | cut -d' ' -f1)
    BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
    echo "✅ Latest backup: $BACKUP_DATE ($BACKUP_SIZE)"
else
    echo "❌ No backups found in $BACKUP_DIR"
fi
EOF

chmod +x scripts/backup_status.sh
```

## Advanced Examples

### 1. Multi-Channel Bot

Handle multiple channels:

```bash
# Create channel-specific scripts
mkdir -p scripts/channels

# General channel script
cat > scripts/channels/general.sh << 'EOF'
#!/bin/bash
case "$DISCORD_ARGS" in
    "status")
        echo "Bot is running on $(hostname)"
        ;;
    "uptime")
        uptime
        ;;
    *)
        echo "Available commands: status, uptime"
        ;;
esac
EOF

# Admin channel script
cat > scripts/channels/admin.sh << 'EOF'
#!/bin/bash
case "$DISCORD_ARGS" in
    "restart")
        echo "Restarting services..."
        sudo systemctl restart nginx
        echo "Services restarted"
        ;;
    "logs")
        echo "Recent logs:"
        journalctl -n 20 --no-pager
        ;;
    *)
        echo "Admin commands: restart, logs"
        ;;
esac
EOF

chmod +x scripts/channels/*.sh
```

### 2. Database Integration

Query databases and send results:

```bash
# Create database query script
cat > scripts/db_query.sh << 'EOF'
#!/bin/bash
QUERY="$DISCORD_ARGS"

if [ -z "$QUERY" ]; then
    echo "Usage: !db_query 'SELECT * FROM users LIMIT 5'"
    exit 1
fi

# Execute query (adjust connection details)
mysql -u user -p'password' -h localhost database_name -e "$QUERY" 2>/dev/null || echo "Query failed"
EOF

chmod +x scripts/db_query.sh
```

### 3. API Integration

Integrate with external APIs:

```bash
# Create weather script
cat > scripts/weather.sh << 'EOF'
#!/bin/bash
CITY="${DISCORD_ARGS:-London}"
API_KEY="your_api_key_here"

WEATHER=$(curl -s "http://api.openweathermap.org/data/2.5/weather?q=$CITY&appid=$API_KEY&units=metric" 2>/dev/null)

if [ $? -eq 0 ]; then
    TEMP=$(echo "$WEATHER" | jq -r '.main.temp')
    DESC=$(echo "$WEATHER" | jq -r '.weather[0].description')
    echo "Weather in $CITY: $TEMP°C, $DESC"
else
    echo "Failed to get weather for $CITY"
fi
EOF

chmod +x scripts/weather.sh
```

## Configuration Examples

### 1. Production Configuration

```yaml
# discord-bot.yaml
bot:
  token: "${DISCORD_BOT_TOKEN}"
  channel_id: 123456789012345678
  prefix: "!"
  auto_reconnect: true
  max_reconnect_attempts: 10
  reconnect_delay: 5.0

file:
  enabled: true
  input_file: "/var/lib/discord-bot/input"
  output_file: "/var/lib/discord-bot/output"
  watch_interval: 0.5
  file_encoding: "utf-8"

socket:
  enabled: true
  socket_path: "/var/run/discord-bot.sock"
  socket_mode: "0o600"
  max_connections: 20

service:
  enabled: true
  script_directory: "/opt/discord-bot/scripts"
  allowed_commands: ["ls", "ps", "df", "free", "uptime", "whoami", "pwd", "date"]
  max_execution_time: 60
  working_directory: "/opt/discord-bot"

logging:
  level: "INFO"
  file: "/var/log/discord-bot.log"
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  max_file_size: 10485760
  backup_count: 10
```

### 2. Development Configuration

```yaml
# discord-bot-dev.yaml
bot:
  token: "${DISCORD_BOT_TOKEN}"
  channel_id: 987654321098765432
  prefix: "dev!"

file:
  enabled: true
  input_file: "/tmp/discord_dev_input"
  output_file: "/tmp/discord_dev_output"

service:
  enabled: true
  script_directory: "./scripts"
  allowed_commands: ["ls", "ps", "pwd"]
  max_execution_time: 10

logging:
  level: "DEBUG"
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
```

## Troubleshooting Examples

### 1. Debug Mode

```bash
# Run with debug logging
discord-bot-cli --log-level DEBUG --stdin

# Check configuration
discord-bot-cli --config discord-bot.yaml --log-level DEBUG --dry-run
```

### 2. Test Scripts

```bash
# Test script execution
./scripts/test.sh

# Test with Discord context
DISCORD_AUTHOR="TestUser" DISCORD_MESSAGE_CONTENT="test message" ./scripts/test.sh
```

### 3. Monitor Bot Status

```bash
# Check if bot is running
ps aux | grep discord-bot-cli

# Check socket connection
echo '{"command": "status"}' | socat - UNIX-CONNECT:/tmp/discord.sock

# Check logs
tail -f /var/log/discord-bot.log
```

## Best Practices

### 1. Script Security

- Always validate input in scripts
- Use absolute paths for commands
- Set appropriate execution timeouts
- Log script execution

### 2. Error Handling

- Check command exit codes
- Provide meaningful error messages
- Log errors for debugging
- Handle network failures gracefully

### 3. Performance

- Use efficient commands in scripts
- Avoid long-running operations
- Set appropriate timeouts
- Monitor resource usage

### 4. Monitoring

- Set up log rotation
- Monitor bot health
- Track command usage
- Alert on failures