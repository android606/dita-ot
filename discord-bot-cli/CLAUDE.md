# Discord Bot CLI - Development Documentation

## Project Overview

This is a comprehensive Linux command-line utility that provides Discord bot functionality with multiple interfaces for shell integration. The tool is designed to fit seamlessly into the Linux command ecosystem.

## Architecture

### Core Components

1. **DiscordBot** (`bot.py`) - Main Discord bot implementation using discord.py
2. **ConfigManager** (`config.py`) - Configuration management with environment variable support
3. **IO Handlers** (`io_handlers.py`) - Multiple input/output interfaces:
   - StdinHandler - stdin/stdout communication
   - FileHandler - File-based messaging with file watching
   - SocketHandler - Unix socket IPC communication
4. **ServiceHandler** (`service.py`) - Service mode with script execution capabilities
5. **Main CLI** (`main.py`) - Command-line interface and application orchestration

### Key Features Implemented

- **Multiple I/O Interfaces**: stdin/stdout, files, Unix sockets
- **Service Mode**: Execute scripts and system commands remotely
- **Configuration Management**: YAML config files + environment variables
- **Comprehensive Logging**: Multiple log levels and file rotation
- **Signal Handling**: Graceful shutdown on SIGINT/SIGTERM
- **Error Handling**: Robust error handling throughout

## File Structure

```
discord-bot-cli/
├── discord_bot_cli/
│   ├── __init__.py          # Package initialization
│   ├── main.py              # CLI entry point and orchestration
│   ├── bot.py               # Discord bot implementation
│   ├── config.py            # Configuration management
│   ├── io_handlers.py       # I/O interface handlers
│   └── service.py           # Service mode implementation
├── requirements.txt         # Python dependencies
├── setup.py                 # Package setup and installation
├── README.md               # User documentation
└── docs/                   # Detailed documentation
    ├── configuration.md
    ├── installation.md
    ├── api.md
    ├── examples.md
    └── troubleshooting.md
```

## Configuration System

The configuration system supports multiple sources with precedence:
1. Command-line arguments (highest priority)
2. Environment variables
3. Configuration file (YAML)
4. Default values (lowest priority)

### Environment Variables

- `DISCORD_BOT_TOKEN` - Discord bot token (required)
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

## I/O Interfaces

### 1. Stdin/Stdout Handler
- Reads messages from stdin and sends to Discord
- Outputs Discord messages to stdout
- Perfect for shell piping: `echo "message" | discord-bot-cli --stdin`

### 2. File Handler
- Watches input file for new messages
- Writes Discord messages to output file
- Uses file system events for real-time updates
- Supports custom encoding and watch intervals

### 3. Socket Handler
- Unix domain socket for IPC
- JSON-based message protocol
- Supports multiple concurrent connections
- Commands: send, status, get_messages

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

## Error Handling

- Comprehensive exception handling throughout
- Graceful degradation when services fail
- Detailed logging for debugging
- Signal handling for clean shutdown

## Security Considerations

- Unix socket permissions (default: 600)
- Script execution restrictions via allowed commands
- Execution timeouts to prevent hanging
- Input validation and sanitization

## Dependencies

- `discord.py` - Discord API client
- `asyncio-mqtt` - MQTT support (future feature)
- `watchdog` - File system event monitoring
- `pyyaml` - YAML configuration parsing
- `click` - CLI framework
- `python-dotenv` - Environment variable loading
- `psutil` - System process utilities
- `aiofiles` - Async file operations

## Future Enhancements

1. **MQTT Support** - Already included in dependencies
2. **Webhook Support** - HTTP endpoints for external integration
3. **Plugin System** - Extensible command system
4. **Metrics Collection** - Performance monitoring
5. **Docker Support** - Container deployment
6. **Systemd Integration** - Service management

## Development Notes

- All async operations use proper error handling
- File operations are non-blocking with aiofiles
- Configuration is validated on startup
- Logging is configurable and structured
- Signal handling ensures clean shutdown

## Testing

The application includes comprehensive error handling and logging to aid in debugging. For production use, consider:

1. Setting up proper logging rotation
2. Configuring appropriate file permissions
3. Testing script execution in isolated environments
4. Monitoring resource usage during long-running operations

## Deployment

The application is designed to run as a system service or daemon. Consider using systemd, supervisor, or similar process managers for production deployment.