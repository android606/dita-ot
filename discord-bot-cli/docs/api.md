# API Reference

## Command-Line Interface

### Main Command

```bash
discord-bot-cli [OPTIONS]
```

### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `-c, --config` | PATH | Configuration file path | Auto-detect |
| `-t, --token` | TEXT | Discord bot token | From env/config |
| `--channel-id` | INTEGER | Discord channel ID | From env/config |
| `--guild-id` | INTEGER | Discord guild ID | From env/config |
| `--prefix` | TEXT | Command prefix | "!" |
| `--stdin` | FLAG | Enable stdin/stdout mode | False |
| `--file-input` | PATH | Input file path | None |
| `--file-output` | PATH | Output file path | None |
| `--socket-path` | PATH | Unix socket path | None |
| `--service` | FLAG | Enable service mode | False |
| `--script-dir` | PATH | Script directory | None |
| `--log-level` | TEXT | Logging level | "INFO" |
| `--log-file` | PATH | Log file path | None |
| `--daemon` | FLAG | Run as daemon | False |
| `--help` | FLAG | Show help message | - |

## Configuration API

### Bot Configuration

```python
@dataclass
class BotConfig:
    token: str                    # Discord bot token (required)
    channel_id: Optional[int]     # Target channel ID
    guild_id: Optional[int]       # Target guild ID
    prefix: str                   # Command prefix
    auto_reconnect: bool          # Auto-reconnect on disconnect
    max_reconnect_attempts: int   # Max reconnection attempts
    reconnect_delay: float        # Delay between attempts (seconds)
```

### File Configuration

```python
@dataclass
class FileConfig:
    enabled: bool                 # Enable file-based messaging
    input_file: Optional[str]     # Input file path
    output_file: Optional[str]    # Output file path
    watch_interval: float         # File check interval (seconds)
    file_encoding: str            # File encoding
```

### Socket Configuration

```python
@dataclass
class SocketConfig:
    enabled: bool                 # Enable Unix socket
    socket_path: str              # Socket file path
    socket_mode: int              # Socket file permissions
    max_connections: int          # Max concurrent connections
```

### Service Configuration

```python
@dataclass
class ServiceConfig:
    enabled: bool                 # Enable service mode
    script_directory: str         # Script directory path
    allowed_commands: list        # Allowed system commands
    max_execution_time: int       # Max execution time (seconds)
    working_directory: str        # Working directory for scripts
```

### Logging Configuration

```python
@dataclass
class LoggingConfig:
    level: str                    # Logging level
    file: Optional[str]           # Log file path
    format: str                   # Log message format
    max_file_size: int            # Max log file size (bytes)
    backup_count: int             # Number of backup files
```

## Discord Bot API

### DiscordBot Class

```python
class DiscordBot:
    def __init__(self, config: Config)
    async def start(self)
    async def stop(self)
    async def send_message(self, content: str, channel_id: Optional[int] = None) -> bool
    async def get_channel_messages(self, limit: int = 10) -> list[discord.Message]
    def is_connected(self) -> bool
    def add_message_handler(self, handler: Callable[[discord.Message], Any])
    def add_ready_handler(self, handler: Callable[[], Any])
```

### Message Handlers

```python
async def message_handler(message: discord.Message):
    """Handle incoming Discord messages"""
    # message.id - Message ID
    # message.content - Message content
    # message.author - Message author
    # message.channel - Channel object
    # message.guild - Guild object (if applicable)
    pass

async def ready_handler():
    """Handle bot ready event"""
    pass
```

## I/O Handlers API

### StdinHandler

```python
class StdinHandler:
    def __init__(self, bot, config: Config)
    async def start(self)
    async def stop(self)
    def write_stdout(self, message: str)
```

### FileHandler

```python
class FileHandler:
    def __init__(self, bot, config: Config)
    async def start(self)
    async def stop(self)
    async def write_output_file(self, message: str)
```

### SocketHandler

```python
class SocketHandler:
    def __init__(self, bot, config: Config)
    async def start(self)
    async def stop(self)
    async def send_socket_message(self, socket_path: str, message: str) -> Optional[str]
```

## Service Handler API

### ServiceHandler

```python
class ServiceHandler:
    def __init__(self, bot, config: Config)
    async def start(self)
    async def stop(self)
    async def execute_script_direct(self, script_name: str, args: List[str] = None) -> str
```

### Built-in Commands

| Command | Description | Example |
|---------|-------------|---------|
| `help` | Show available commands | `!help` |
| `list` | List available scripts | `!list` |
| `status` | Show bot status | `!status` |
| `reload` | Reload scripts | `!reload` |
| `ls` | List directory contents | `!ls -la` |
| `ps` | Show running processes | `!ps aux` |
| `df` | Show disk usage | `!df -h` |
| `free` | Show memory usage | `!free -h` |
| `uptime` | Show system uptime | `!uptime` |
| `whoami` | Show current user | `!whoami` |
| `pwd` | Show current directory | `!pwd` |

## Socket Protocol

### Message Format

All socket messages are JSON with the following structure:

```json
{
    "command": "command_name",
    "content": "message_content",
    "limit": 10
}
```

### Commands

#### Send Message
```json
{
    "command": "send",
    "content": "Hello from socket!"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Hello from socket!"
}
```

#### Get Status
```json
{
    "command": "status"
}
```

**Response:**
```json
{
    "connected": true,
    "running": true
}
```

#### Get Messages
```json
{
    "command": "get_messages",
    "limit": 10
}
```

**Response:**
```json
{
    "messages": [
        {
            "id": 123456789012345678,
            "content": "Hello world!",
            "author": "User#1234",
            "timestamp": "2023-01-01T12:00:00.000Z"
        }
    ]
}
```

### Error Responses

```json
{
    "error": "Error message description"
}
```

## Script Environment Variables

When executing scripts in service mode, the following environment variables are available:

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_MESSAGE_ID` | Discord message ID | `123456789012345678` |
| `DISCORD_AUTHOR` | Message author | `User#1234` |
| `DISCORD_CHANNEL_ID` | Channel ID | `987654321098765432` |
| `DISCORD_GUILD_ID` | Guild ID | `111111111111111111` |
| `DISCORD_MESSAGE_CONTENT` | Full message content | `!my_script arg1 arg2` |
| `DISCORD_ARGS` | Command arguments | `arg1 arg2` |

## Configuration Manager API

### ConfigManager Class

```python
class ConfigManager:
    def __init__(self, config_path: Optional[str] = None)
    def load_config(self) -> Config
    def save_config(self, config: Config, path: Optional[str] = None) -> None
```

### Configuration Loading

The configuration manager loads settings from multiple sources in order of precedence:

1. Command-line arguments
2. Environment variables
3. Configuration file
4. Default values

### Environment Variable Mapping

| Config Field | Environment Variable | Type |
|--------------|---------------------|------|
| `bot.token` | `DISCORD_BOT_TOKEN` | str |
| `bot.channel_id` | `DISCORD_CHANNEL_ID` | int |
| `bot.guild_id` | `DISCORD_GUILD_ID` | int |
| `bot.prefix` | `DISCORD_PREFIX` | str |
| `file.enabled` | `DISCORD_FILE_ENABLED` | bool |
| `file.input_file` | `DISCORD_INPUT_FILE` | str |
| `file.output_file` | `DISCORD_OUTPUT_FILE` | str |
| `socket.enabled` | `DISCORD_SOCKET_ENABLED` | bool |
| `socket.socket_path` | `DISCORD_SOCKET_PATH` | str |
| `service.enabled` | `DISCORD_SERVICE_ENABLED` | bool |
| `service.script_directory` | `DISCORD_SCRIPT_DIR` | str |
| `logging.level` | `DISCORD_LOG_LEVEL` | str |
| `logging.file` | `DISCORD_LOG_FILE` | str |

## Error Handling

### Exception Types

| Exception | Description | When Raised |
|-----------|-------------|-------------|
| `ValueError` | Invalid configuration | Missing required config |
| `discord.LoginFailure` | Invalid bot token | Authentication failed |
| `FileNotFoundError` | File not found | Script or config file missing |
| `PermissionError` | Permission denied | File access denied |
| `TimeoutError` | Operation timeout | Script execution timeout |

### Error Responses

#### Socket Errors
```json
{
    "error": "Invalid JSON message"
}
```

#### Script Execution Errors
```
Script failed (exit code 1):
Error message here
```

#### Configuration Errors
```
Error loading configuration: Discord bot token is required
```

## Logging

### Log Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `DEBUG` | Detailed debugging info | Development |
| `INFO` | General information | Normal operation |
| `WARNING` | Warning messages | Potential issues |
| `ERROR` | Error messages | Failed operations |
| `CRITICAL` | Critical errors | Fatal issues |

### Log Format

Default format: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`

Example: `2023-01-01 12:00:00,000 - discord_bot_cli.bot - INFO - Bot logged in as MyBot#1234`

### Log Rotation

- Maximum file size: 10MB (configurable)
- Backup count: 5 files (configurable)
- Automatic rotation when size limit reached

## Security Considerations

### File Permissions

- Socket files: 600 (owner read/write only)
- Log files: 644 (owner read/write, group/other read)
- Scripts: 755 (owner read/write/execute, group/other read/execute)

### Input Validation

- JSON message validation for socket communication
- Command argument sanitization
- Script execution timeout limits
- File path validation

### Network Security

- Only outbound connections to Discord servers
- No incoming network connections (except Unix socket)
- Socket files in secure directories only