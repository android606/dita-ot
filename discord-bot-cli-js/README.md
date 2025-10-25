# Discord Bot CLI

A Node.js command-line utility that acts as a Discord bot interface for shell scripts and other Linux applications.

## Features

- **stdin/stdout interface** - Pipe messages to/from Discord
- **File-based messaging** - Watch files for commands and output messages
- **Unix socket support** - IPC communication with other processes
- **Service mode** - Execute scripts and system commands remotely
- **Flexible configuration** - Environment variables, config files, and CLI options
- **Comprehensive logging** - Debug and monitor bot activity

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Discord bot credentials:
   ```bash
   export DISCORD_BOT_TOKEN="your_bot_token_here"
   export DISCORD_APPLICATION_ID="1430759150131875842"
   export DISCORD_PUBLIC_KEY="adc3a5c25adb9712cfd70b7e7550a47d20274f9ba80976b316cf26bcaa900206"
   export DISCORD_CHANNEL_ID="your_channel_id_here"
   ```

3. Run the bot:
   ```bash
   node src/index.js
   ```

## Usage Examples

### Basic stdin/stdout
```bash
echo "Hello from shell!" | node src/index.js --stdin
```

### File-based messaging
```bash
# Send messages by writing to a file
echo "System status check" > /tmp/discord_input
node src/index.js --file-input /tmp/discord_input --file-output /tmp/discord_output

# Read responses
cat /tmp/discord_output
```

### Unix socket communication
```bash
# Start bot with socket
node src/index.js --socket-path /tmp/discord.sock &

# Send message via socket
echo '{"command": "send", "content": "Hello via socket!"}' | socat - UNIX-CONNECT:/tmp/discord.sock
```

### Service mode
```bash
# Enable service mode with scripts
node src/index.js --service --script-dir ./scripts

# In Discord, use commands like:
# !ls -la
# !ps aux
# !./hello.sh arg1 arg2
```

## Configuration

The bot supports multiple configuration methods with the following precedence:

1. Command-line arguments (highest priority)
2. Environment variables
3. Configuration file (YAML)
4. Default values (lowest priority)

### Environment Variables

- `DISCORD_BOT_TOKEN` - Discord bot token (required)
- `DISCORD_APPLICATION_ID` - Discord application ID
- `DISCORD_PUBLIC_KEY` - Discord public key
- `DISCORD_CHANNEL_ID` - Target Discord channel ID
- `DISCORD_GUILD_ID` - Discord guild ID
- `DISCORD_PREFIX` - Command prefix (default: "!")
- `DISCORD_FILE_ENABLED` - Enable file-based messaging
- `DISCORD_INPUT_FILE` - Input file path
- `DISCORD_OUTPUT_FILE` - Output file path
- `DISCORD_SOCKET_ENABLED` - Enable Unix socket
- `DISCORD_SOCKET_PATH` - Socket file path
- `DISCORD_SERVICE_ENABLED` - Enable service mode
- `DISCORD_SCRIPT_DIR` - Script directory
- `DISCORD_LOG_LEVEL` - Logging level
- `DISCORD_LOG_FILE` - Log file path

### Configuration File

Create a `discord-bot.yaml` file:

```yaml
bot:
  token: "${DISCORD_BOT_TOKEN}"
  applicationId: "${DISCORD_APPLICATION_ID}"
  publicKey: "${DISCORD_PUBLIC_KEY}"
  channelId: 123456789012345678
  prefix: "!"

file:
  enabled: true
  inputFile: "/tmp/discord_input"
  outputFile: "/tmp/discord_output"
  watchInterval: 1000
  fileEncoding: "utf8"

socket:
  enabled: true
  socketPath: "/tmp/discord-bot.sock"
  socketMode: 438  # 0o666
  maxConnections: 10

service:
  enabled: true
  scriptDirectory: "./scripts"
  allowedCommands: ["ls", "ps", "df", "free", "uptime", "whoami", "pwd"]
  maxExecutionTime: 30000
  workingDirectory: "."

logging:
  level: "info"
  file: "/var/log/discord-bot.log"
  maxFileSize: 10485760
  backupCount: 5
```

## Command-Line Options

```bash
node src/index.js [options]

Options:
  -V, --version          output the version number
  -c, --config <path>    Configuration file path
  -t, --token <token>    Discord bot token
  --application-id <id>  Discord application ID
  --public-key <key>     Discord public key
  --channel-id <id>      Discord channel ID
  --guild-id <id>        Discord guild ID
  --prefix <prefix>      Command prefix (default: "!")
  --stdin                Enable stdin/stdout mode
  --file-input <path>    Input file path for file-based messaging
  --file-output <path>   Output file path for file-based messaging
  --socket-path <path>   Unix socket path for IPC
  --service              Enable service mode
  --script-dir <path>    Script directory for service mode
  --log-level <level>    Logging level (default: "info")
  --log-file <path>      Log file path
  --daemon               Run as daemon
  -h, --help             display help for command
```

## Service Mode

Service mode enables remote execution of scripts and system commands:

### Built-in Commands
- `help` - Show available commands
- `list` - List available scripts
- `status` - Show bot status
- `reload` - Reload scripts
- System commands: `ls`, `ps`, `df`, `free`, `uptime`, `whoami`, `pwd`

### Script Execution
- Scripts in configured directory are automatically loaded
- Scripts receive Discord context via environment variables
- Configurable execution timeout and working directory
- Support for command-line arguments

### Environment Variables for Scripts
- `DISCORD_MESSAGE_ID` - Discord message ID
- `DISCORD_AUTHOR` - Message author
- `DISCORD_CHANNEL_ID` - Channel ID
- `DISCORD_GUILD_ID` - Guild ID
- `DISCORD_MESSAGE_CONTENT` - Full message content
- `DISCORD_ARGS` - Command arguments

## Socket Protocol

All socket messages are JSON with the following structure:

### Send Message
```json
{"command": "send", "content": "Hello via socket!"}
```

### Get Status
```json
{"command": "status"}
```

### Get Messages
```json
{"command": "get_messages", "limit": 10}
```

## Installation

### Development
```bash
git clone <repository-url>
cd discord-bot-cli-js
npm install
```

### Production
```bash
# Install globally
npm install -g .

# Or use directly
node src/index.js --help
```

## Testing

Run the test suite:
```bash
# Test individual components
node test-service.js
node test-file.js
node test-socket.js
node test-stdin.js

# Test complete functionality
node test-complete.js
```

## Project Structure

```
discord-bot-cli-js/
├── src/
│   ├── index.js          # Main CLI entry point
│   ├── bot.js            # Discord bot implementation
│   ├── config.js         # Configuration management
│   ├── logger.js         # Logging system
│   ├── ioHandlers.js     # I/O interface handlers
│   └── service.js        # Service mode implementation
├── scripts/              # Example scripts
├── config/               # Configuration files
├── bin/                  # Executable scripts
├── test-*.js            # Test files
└── package.json         # Dependencies and scripts
```

## Dependencies

- **discord.js** - Discord API client
- **commander** - CLI framework
- **chalk** - Terminal colors
- **yaml** - YAML configuration parsing
- **dotenv** - Environment variable loading
- **chokidar** - File system watching
- **winston** - Logging
- **execa** - Process execution
- **fs-extra** - Enhanced file system operations

## Security Considerations

- Unix socket permissions (default: 0o600)
- Script execution restrictions via allowed commands
- Execution timeouts to prevent hanging
- Input validation and sanitization

## Troubleshooting

### Common Issues

1. **Bot token invalid**: Check that the token is correct and the bot is properly configured in Discord Developer Portal

2. **Channel not found**: Verify the channel ID is correct and the bot has access to the channel

3. **Permission denied**: Check file permissions for socket files, log files, and script directories

4. **Script execution failed**: Verify scripts are executable and in the correct directory

### Debug Mode
Enable debug logging to troubleshoot issues:
```bash
node src/index.js --log-level debug
```

## License

MIT License - see LICENSE file for details.