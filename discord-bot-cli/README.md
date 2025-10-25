# Discord Bot CLI

A Linux command-line utility that acts as a Discord bot interface for shell scripts and other Linux applications.

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
   pip install -r requirements.txt
   ```

2. Set up Discord bot token:
   ```bash
   export DISCORD_BOT_TOKEN="your_bot_token_here"
   export DISCORD_CHANNEL_ID="your_channel_id_here"
   ```

3. Run the bot:
   ```bash
   python -m discord_bot_cli.main
   ```

## Usage Examples

### Basic stdin/stdout
```bash
echo "Hello from shell!" | discord-bot-cli --stdin
```

### File-based messaging
```bash
# Send messages by writing to a file
echo "System status check" > /tmp/discord_input
discord-bot-cli --file-input /tmp/discord_input --file-output /tmp/discord_output

# Read responses
cat /tmp/discord_output
```

### Unix socket communication
```bash
# Start bot with socket
discord-bot-cli --socket-path /tmp/discord.sock &

# Send message via socket
echo '{"command": "send", "content": "Hello via socket!"}' | socat - UNIX-CONNECT:/tmp/discord.sock
```

### Service mode
```bash
# Enable service mode with scripts
discord-bot-cli --service --script-dir ./scripts

# In Discord, use commands like:
# !ls -la
# !ps aux
# !./my_script.sh arg1 arg2
```

## Configuration

See `docs/configuration.md` for detailed configuration options.

## Installation

See `docs/installation.md` for installation instructions.

## Documentation

- [Configuration Guide](docs/configuration.md)
- [Installation Guide](docs/installation.md)
- [API Reference](docs/api.md)
- [Examples](docs/examples.md)
- [Troubleshooting](docs/troubleshooting.md)