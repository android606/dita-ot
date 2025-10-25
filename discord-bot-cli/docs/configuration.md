# Configuration Guide

## Overview

Discord Bot CLI supports multiple configuration methods with the following precedence (highest to lowest):

1. Command-line arguments
2. Environment variables
3. Configuration file (YAML)
4. Default values

## Configuration File

Create a `discord-bot.yaml` file in one of these locations:
- `./discord-bot.yaml` (current directory)
- `~/.config/discord-bot/config.yaml`
- `/etc/discord-bot/config.yaml`

### Example Configuration

```yaml
bot:
  token: "your_discord_bot_token_here"
  channel_id: 123456789012345678
  guild_id: 987654321098765432
  prefix: "!"
  auto_reconnect: true
  max_reconnect_attempts: 5
  reconnect_delay: 5.0

file:
  enabled: true
  input_file: "/tmp/discord_input"
  output_file: "/tmp/discord_output"
  watch_interval: 1.0
  file_encoding: "utf-8"

socket:
  enabled: true
  socket_path: "/tmp/discord-bot.sock"
  socket_mode: "0o600"
  max_connections: 10

service:
  enabled: true
  script_directory: "./scripts"
  allowed_commands: ["ls", "ps", "df", "free", "uptime", "whoami", "pwd"]
  max_execution_time: 30
  working_directory: "."

logging:
  level: "INFO"
  file: "/var/log/discord-bot.log"
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  max_file_size: 10485760  # 10MB
  backup_count: 5
```

## Environment Variables

### Bot Configuration
- `DISCORD_BOT_TOKEN` - Discord bot token (required)
- `DISCORD_CHANNEL_ID` - Target Discord channel ID
- `DISCORD_GUILD_ID` - Discord guild ID
- `DISCORD_PREFIX` - Command prefix (default: "!")

### File Configuration
- `DISCORD_FILE_ENABLED` - Enable file-based messaging (true/false)
- `DISCORD_INPUT_FILE` - Input file path
- `DISCORD_OUTPUT_FILE` - Output file path

### Socket Configuration
- `DISCORD_SOCKET_ENABLED` - Enable Unix socket (true/false)
- `DISCORD_SOCKET_PATH` - Socket file path

### Service Configuration
- `DISCORD_SERVICE_ENABLED` - Enable service mode (true/false)
- `DISCORD_SCRIPT_DIR` - Script directory path

### Logging Configuration
- `DISCORD_LOG_LEVEL` - Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `DISCORD_LOG_FILE` - Log file path

## Command-Line Options

```bash
discord-bot-cli [OPTIONS]

Options:
  -c, --config PATH          Configuration file path
  -t, --token TEXT           Discord bot token
  --channel-id INTEGER       Discord channel ID
  --guild-id INTEGER         Discord guild ID
  --prefix TEXT              Command prefix (default: !)
  --stdin                    Enable stdin/stdout mode
  --file-input PATH          Input file path
  --file-output PATH         Output file path
  --socket-path PATH         Unix socket path
  --service                  Enable service mode
  --script-dir PATH          Script directory
  --log-level TEXT           Logging level
  --log-file PATH            Log file path
  --daemon                   Run as daemon
  --help                     Show help message
```

## Bot Configuration

### Required Settings
- `token`: Discord bot token from Discord Developer Portal

### Optional Settings
- `channel_id`: Specific channel to monitor (if not set, monitors all channels)
- `guild_id`: Specific guild to monitor
- `prefix`: Command prefix for service mode (default: "!")
- `auto_reconnect`: Automatically reconnect on disconnect (default: true)
- `max_reconnect_attempts`: Maximum reconnection attempts (default: 5)
- `reconnect_delay`: Delay between reconnection attempts in seconds (default: 5.0)

## File Configuration

### Settings
- `enabled`: Enable file-based messaging (default: false)
- `input_file`: File to watch for incoming messages
- `output_file`: File to write outgoing messages
- `watch_interval`: File check interval in seconds (default: 1.0)
- `file_encoding`: File encoding (default: "utf-8")

### Usage
```bash
# Enable file-based messaging
discord-bot-cli --file-input /tmp/discord_input --file-output /tmp/discord_output

# Send message by writing to input file
echo "Hello from file!" > /tmp/discord_input

# Read responses from output file
cat /tmp/discord_output
```

## Socket Configuration

### Settings
- `enabled`: Enable Unix socket (default: false)
- `socket_path`: Path to Unix socket file (default: "/tmp/discord-bot.sock")
- `socket_mode`: Socket file permissions (default: 0o600)
- `max_connections`: Maximum concurrent connections (default: 10)

### Usage
```bash
# Start bot with socket
discord-bot-cli --socket-path /tmp/discord.sock &

# Send message via socket
echo '{"command": "send", "content": "Hello via socket!"}' | socat - UNIX-CONNECT:/tmp/discord.sock

# Check status
echo '{"command": "status"}' | socat - UNIX-CONNECT:/tmp/discord.sock
```

## Service Configuration

### Settings
- `enabled`: Enable service mode (default: false)
- `script_directory`: Directory containing executable scripts
- `allowed_commands`: List of allowed system commands
- `max_execution_time`: Maximum script execution time in seconds (default: 30)
- `working_directory`: Working directory for script execution

### Usage
```bash
# Enable service mode
discord-bot-cli --service --script-dir ./scripts

# In Discord, use commands:
# !ls -la
# !ps aux
# !./my_script.sh arg1 arg2
# !help
```

## Logging Configuration

### Settings
- `level`: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `file`: Log file path (if not set, logs to stderr)
- `format`: Log message format
- `max_file_size`: Maximum log file size in bytes (default: 10MB)
- `backup_count`: Number of backup log files (default: 5)

### Log Levels
- `DEBUG`: Detailed information for debugging
- `INFO`: General information about program execution
- `WARNING`: Warning messages for potential issues
- `ERROR`: Error messages for failed operations
- `CRITICAL`: Critical errors that may cause program termination

## Security Considerations

### File Permissions
- Socket files are created with restricted permissions (600)
- Log files should be readable only by the bot user
- Script directories should have appropriate execute permissions

### Script Execution
- Only scripts in the configured directory are executable
- System commands are restricted to the allowed_commands list
- Script execution has configurable timeouts
- Scripts run with the bot's user permissions

### Environment Variables
- Bot token should be kept secure and not logged
- Use environment variables for sensitive configuration
- Consider using a secrets management system for production

## Troubleshooting

### Common Issues

1. **Bot token invalid**: Check that the token is correct and the bot is properly configured in Discord Developer Portal

2. **Channel not found**: Verify the channel ID is correct and the bot has access to the channel

3. **Permission denied**: Check file permissions for socket files, log files, and script directories

4. **Script execution failed**: Verify scripts are executable and in the correct directory

5. **Socket connection refused**: Ensure the socket file exists and has correct permissions

### Debug Mode
Enable debug logging to troubleshoot issues:
```bash
discord-bot-cli --log-level DEBUG
```

### Configuration Validation
The application validates configuration on startup and will report any issues with specific error messages.