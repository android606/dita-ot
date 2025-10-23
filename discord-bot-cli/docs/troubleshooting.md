# Troubleshooting Guide

## Common Issues

### 1. Bot Token Issues

#### Problem: "Invalid Discord bot token"
**Symptoms:**
- Bot fails to start
- Error message about invalid token
- Bot doesn't appear online in Discord

**Solutions:**
1. Verify token is correct:
   ```bash
   echo $DISCORD_BOT_TOKEN
   ```

2. Check token format (should be a long string of characters and numbers)

3. Regenerate token in Discord Developer Portal:
   - Go to Discord Developer Portal
   - Select your application
   - Go to "Bot" section
   - Click "Reset Token"
   - Copy the new token

4. Ensure "Message Content Intent" is enabled:
   - In Discord Developer Portal
   - Go to "Bot" section
   - Enable "Message Content Intent"

#### Problem: "Bot is not appearing online"
**Solutions:**
1. Check bot permissions in Discord server
2. Verify bot is added to the server
3. Check if bot has proper intents enabled

### 2. Channel Access Issues

#### Problem: "Channel not found" or "No channel ID configured"
**Symptoms:**
- Bot starts but doesn't respond to messages
- Error messages about channel access

**Solutions:**
1. Get correct channel ID:
   - Enable Developer Mode in Discord
   - Right-click on channel
   - Select "Copy ID"

2. Verify bot has access to channel:
   - Check channel permissions
   - Ensure bot role has "View Channel" permission

3. Set channel ID:
   ```bash
   export DISCORD_CHANNEL_ID="your_channel_id_here"
   ```

### 3. Permission Issues

#### Problem: "Permission denied" errors
**Symptoms:**
- Socket file creation fails
- Script execution fails
- File access denied

**Solutions:**
1. Check file permissions:
   ```bash
   ls -la /tmp/discord-bot.sock
   chmod 600 /tmp/discord-bot.sock
   ```

2. Check script permissions:
   ```bash
   chmod +x ./scripts/*
   ```

3. Run with appropriate user:
   ```bash
   sudo -u discord-bot discord-bot-cli
   ```

### 4. Script Execution Issues

#### Problem: Scripts not executing
**Symptoms:**
- Service mode enabled but commands don't work
- "Script not found" errors

**Solutions:**
1. Check script directory:
   ```bash
   ls -la ./scripts/
   ```

2. Verify script permissions:
   ```bash
   chmod +x ./scripts/script_name.sh
   ```

3. Test script manually:
   ```bash
   ./scripts/script_name.sh
   ```

4. Check script syntax:
   ```bash
   bash -n ./scripts/script_name.sh
   ```

#### Problem: Script execution timeout
**Symptoms:**
- Scripts start but don't complete
- "Script timed out" messages

**Solutions:**
1. Increase timeout in configuration:
   ```yaml
   service:
     max_execution_time: 60  # seconds
   ```

2. Optimize script performance
3. Check for infinite loops in scripts

### 5. Socket Communication Issues

#### Problem: "Connection refused" when using socket
**Symptoms:**
- Socket client can't connect
- "No such file or directory" errors

**Solutions:**
1. Check if socket file exists:
   ```bash
   ls -la /tmp/discord-bot.sock
   ```

2. Verify bot is running with socket enabled:
   ```bash
   ps aux | grep discord-bot-cli
   ```

3. Check socket permissions:
   ```bash
   chmod 600 /tmp/discord-bot.sock
   ```

4. Test socket connection:
   ```bash
   echo '{"command": "status"}' | socat - UNIX-CONNECT:/tmp/discord-bot.sock
   ```

### 6. File-based Messaging Issues

#### Problem: File messages not being processed
**Symptoms:**
- Messages written to input file but not sent to Discord
- No output in output file

**Solutions:**
1. Check file permissions:
   ```bash
   ls -la /tmp/discord_input /tmp/discord_output
   ```

2. Verify file-based messaging is enabled:
   ```bash
   discord-bot-cli --file-input /tmp/discord_input --file-output /tmp/discord_output
   ```

3. Check file encoding:
   ```yaml
   file:
     file_encoding: "utf-8"
   ```

4. Test file writing:
   ```bash
   echo "test message" > /tmp/discord_input
   ```

## Debug Mode

### Enable Debug Logging

```bash
# Command line
discord-bot-cli --log-level DEBUG

# Environment variable
export DISCORD_LOG_LEVEL=DEBUG
discord-bot-cli

# Configuration file
logging:
  level: "DEBUG"
```

### Debug Information

Debug mode provides detailed information about:
- Bot connection status
- Message processing
- File operations
- Socket communications
- Script execution
- Configuration loading

### Example Debug Output

```
2023-01-01 12:00:00,000 - discord_bot_cli.bot - DEBUG - Starting Discord bot
2023-01-01 12:00:00,100 - discord_bot_cli.bot - DEBUG - Bot token loaded
2023-01-01 12:00:00,200 - discord_bot_cli.bot - DEBUG - Connecting to Discord
2023-01-01 12:00:00,500 - discord_bot_cli.bot - INFO - Bot logged in as MyBot#1234
2023-01-01 12:00:00,600 - discord_bot_cli.io_handlers - DEBUG - Starting stdin handler
2023-01-01 12:00:00,700 - discord_bot_cli.io_handlers - DEBUG - Starting file handler
2023-01-01 12:00:00,800 - discord_bot_cli.io_handlers - DEBUG - Starting socket handler
```

## System Service Issues

### systemd Service Problems

#### Problem: Service won't start
**Solutions:**
1. Check service status:
   ```bash
   sudo systemctl status discord-bot
   ```

2. Check service logs:
   ```bash
   sudo journalctl -u discord-bot -n 50
   ```

3. Check service file:
   ```bash
   sudo systemctl cat discord-bot
   ```

4. Reload systemd:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart discord-bot
   ```

#### Problem: Service keeps restarting
**Solutions:**
1. Check restart policy:
   ```ini
   [Service]
   Restart=on-failure
   RestartSec=10
   ```

2. Check for configuration errors
3. Verify all dependencies are available
4. Check file permissions

### Process Management

#### Problem: Multiple bot instances running
**Solutions:**
1. Check running processes:
   ```bash
   ps aux | grep discord-bot-cli
   ```

2. Kill duplicate processes:
   ```bash
   pkill -f discord-bot-cli
   ```

3. Use process manager (systemd, supervisor, etc.)

## Network Issues

### Discord Connection Problems

#### Problem: Bot can't connect to Discord
**Symptoms:**
- Bot fails to start
- Connection timeout errors
- Network unreachable errors

**Solutions:**
1. Check internet connectivity:
   ```bash
   ping discord.com
   ```

2. Check firewall settings:
   ```bash
   sudo ufw status
   ```

3. Check proxy settings if applicable
4. Verify Discord service status

### Socket Communication Problems

#### Problem: Socket communication fails
**Solutions:**
1. Check socket file:
   ```bash
   ls -la /tmp/discord-bot.sock
   ```

2. Test with netcat:
   ```bash
   echo '{"command": "status"}' | nc -U /tmp/discord-bot.sock
   ```

3. Check socket permissions
4. Verify bot is running with socket enabled

## Performance Issues

### High Memory Usage

#### Problem: Bot uses too much memory
**Solutions:**
1. Check memory usage:
   ```bash
   ps aux | grep discord-bot-cli
   ```

2. Monitor with htop:
   ```bash
   htop -p $(pgrep discord-bot-cli)
   ```

3. Check for memory leaks in scripts
4. Restart bot periodically if needed

### Slow Response Times

#### Problem: Bot responds slowly
**Solutions:**
1. Check system load:
   ```bash
   uptime
   top
   ```

2. Check disk I/O:
   ```bash
   iostat -x 1
   ```

3. Optimize scripts
4. Increase timeouts if appropriate

## Configuration Issues

### Invalid Configuration

#### Problem: "Error loading configuration"
**Solutions:**
1. Validate YAML syntax:
   ```bash
   python -c "import yaml; yaml.safe_load(open('discord-bot.yaml'))"
   ```

2. Check configuration file permissions
3. Verify all required fields are present
4. Check environment variable values

### Missing Dependencies

#### Problem: "Module not found" errors
**Solutions:**
1. Install missing dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Check Python path:
   ```bash
   python -c "import sys; print(sys.path)"
   ```

3. Use virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

## Log Analysis

### Log File Locations

- Default: stderr
- Configurable: `--log-file` option
- systemd: `journalctl -u discord-bot`

### Common Log Messages

#### INFO Messages
- `Bot logged in as MyBot#1234` - Bot successfully connected
- `Starting [handler] handler` - Handler started
- `Client connected: [address]` - Socket client connected

#### WARNING Messages
- `No channel ID configured` - Bot will listen to all channels
- `Script execution timeout` - Script took too long to execute
- `File not found: [path]` - Input/output file missing

#### ERROR Messages
- `Invalid Discord bot token` - Authentication failed
- `Channel [id] not found` - Channel access denied
- `Permission denied: [file]` - File access denied
- `Script failed (exit code [code])` - Script execution failed

#### DEBUG Messages
- `Received message: [content]` - Message received from Discord
- `Sending message: [content]` - Message being sent to Discord
- `Executing script: [script]` - Script execution started
- `Socket message: [message]` - Socket communication

## Recovery Procedures

### Bot Won't Start

1. Check configuration:
   ```bash
   discord-bot-cli --config discord-bot.yaml --log-level DEBUG
   ```

2. Verify dependencies:
   ```bash
   pip list | grep discord
   ```

3. Check permissions:
   ```bash
   ls -la /tmp/discord-bot.sock
   ```

4. Test with minimal configuration:
   ```bash
   DISCORD_BOT_TOKEN="your_token" discord-bot-cli --stdin
   ```

### Service Won't Start

1. Check service configuration:
   ```bash
   sudo systemctl cat discord-bot
   ```

2. Check logs:
   ```bash
   sudo journalctl -u discord-bot -n 100
   ```

3. Test manual start:
   ```bash
   sudo -u discord-bot /opt/discord-bot-cli/venv/bin/discord-bot-cli
   ```

4. Check file permissions and ownership

### Data Recovery

1. Check log files for recent activity
2. Verify configuration backups
3. Check script backups
4. Restore from version control if available

## Getting Help

### Log Collection

When reporting issues, include:
1. Full error messages
2. Debug log output
3. Configuration file (remove sensitive data)
4. System information:
   ```bash
   uname -a
   python --version
   pip list | grep discord
   ```

### Support Channels

1. Check documentation first
2. Search existing issues
3. Create detailed issue report
4. Include reproduction steps
5. Provide system information