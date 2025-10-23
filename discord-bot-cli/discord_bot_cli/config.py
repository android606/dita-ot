"""
Configuration management for Discord Bot CLI
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class BotConfig:
    """Bot configuration settings"""
    token: str
    channel_id: Optional[int] = None
    guild_id: Optional[int] = None
    prefix: str = "!"
    auto_reconnect: bool = True
    max_reconnect_attempts: int = 5
    reconnect_delay: float = 5.0


@dataclass
class FileConfig:
    """File-based messaging configuration"""
    enabled: bool = False
    input_file: Optional[str] = None
    output_file: Optional[str] = None
    watch_interval: float = 1.0
    file_encoding: str = "utf-8"


@dataclass
class SocketConfig:
    """Unix socket configuration"""
    enabled: bool = False
    socket_path: str = "/tmp/discord-bot.sock"
    socket_mode: int = 0o600
    max_connections: int = 10


@dataclass
class ServiceConfig:
    """Service mode configuration"""
    enabled: bool = False
    script_directory: str = "./scripts"
    allowed_commands: list = field(default_factory=list)
    max_execution_time: int = 30
    working_directory: str = "."


@dataclass
class LoggingConfig:
    """Logging configuration"""
    level: str = "INFO"
    file: Optional[str] = None
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    backup_count: int = 5


@dataclass
class Config:
    """Main configuration class"""
    bot: BotConfig
    file: FileConfig = field(default_factory=FileConfig)
    socket: SocketConfig = field(default_factory=SocketConfig)
    service: ServiceConfig = field(default_factory=ServiceConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)


class ConfigManager:
    """Configuration manager for loading and managing settings"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or self._find_config_file()
        self.config: Optional[Config] = None
    
    def _find_config_file(self) -> str:
        """Find configuration file in standard locations"""
        config_locations = [
            "./discord-bot.yaml",
            "./discord-bot.yml",
            "~/.config/discord-bot/config.yaml",
            "~/.config/discord-bot/config.yml",
            "/etc/discord-bot/config.yaml",
            "/etc/discord-bot/config.yml",
        ]
        
        for location in config_locations:
            path = Path(location).expanduser()
            if path.exists():
                return str(path)
        
        return "./discord-bot.yaml"
    
    def load_config(self) -> Config:
        """Load configuration from file and environment variables"""
        config_data = {}
        
        # Load from file if it exists
        if self.config_path and Path(self.config_path).exists():
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config_data = yaml.safe_load(f) or {}
        
        # Override with environment variables
        env_overrides = self._load_env_overrides()
        config_data = self._merge_configs(config_data, env_overrides)
        
        # Create configuration objects
        self.config = self._create_config_objects(config_data)
        return self.config
    
    def _load_env_overrides(self) -> Dict[str, Any]:
        """Load configuration overrides from environment variables"""
        overrides = {}
        
        # Bot configuration
        if token := os.getenv("DISCORD_BOT_TOKEN"):
            overrides.setdefault("bot", {})["token"] = token
        if channel_id := os.getenv("DISCORD_CHANNEL_ID"):
            overrides.setdefault("bot", {})["channel_id"] = int(channel_id)
        if guild_id := os.getenv("DISCORD_GUILD_ID"):
            overrides.setdefault("bot", {})["guild_id"] = int(guild_id)
        if prefix := os.getenv("DISCORD_PREFIX"):
            overrides.setdefault("bot", {})["prefix"] = prefix
        
        # File configuration
        if input_file := os.getenv("DISCORD_INPUT_FILE"):
            overrides.setdefault("file", {})["input_file"] = input_file
        if output_file := os.getenv("DISCORD_OUTPUT_FILE"):
            overrides.setdefault("file", {})["output_file"] = output_file
        if os.getenv("DISCORD_FILE_ENABLED", "").lower() in ("true", "1", "yes"):
            overrides.setdefault("file", {})["enabled"] = True
        
        # Socket configuration
        if socket_path := os.getenv("DISCORD_SOCKET_PATH"):
            overrides.setdefault("socket", {})["socket_path"] = socket_path
        if os.getenv("DISCORD_SOCKET_ENABLED", "").lower() in ("true", "1", "yes"):
            overrides.setdefault("socket", {})["enabled"] = True
        
        # Service configuration
        if script_dir := os.getenv("DISCORD_SCRIPT_DIR"):
            overrides.setdefault("service", {})["script_directory"] = script_dir
        if os.getenv("DISCORD_SERVICE_ENABLED", "").lower() in ("true", "1", "yes"):
            overrides.setdefault("service", {})["enabled"] = True
        
        # Logging configuration
        if log_level := os.getenv("DISCORD_LOG_LEVEL"):
            overrides.setdefault("logging", {})["level"] = log_level
        if log_file := os.getenv("DISCORD_LOG_FILE"):
            overrides.setdefault("logging", {})["file"] = log_file
        
        return overrides
    
    def _merge_configs(self, base: Dict[str, Any], overrides: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively merge configuration dictionaries"""
        result = base.copy()
        
        for key, value in overrides.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_configs(result[key], value)
            else:
                result[key] = value
        
        return result
    
    def _create_config_objects(self, config_data: Dict[str, Any]) -> Config:
        """Create configuration objects from dictionary data"""
        bot_data = config_data.get("bot", {})
        if not bot_data.get("token"):
            raise ValueError("Discord bot token is required")
        
        return Config(
            bot=BotConfig(**bot_data),
            file=FileConfig(**config_data.get("file", {})),
            socket=SocketConfig(**config_data.get("socket", {})),
            service=ServiceConfig(**config_data.get("service", {})),
            logging=LoggingConfig(**config_data.get("logging", {}))
        )
    
    def save_config(self, config: Config, path: Optional[str] = None) -> None:
        """Save configuration to file"""
        save_path = path or self.config_path
        
        # Ensure directory exists
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Convert config to dictionary
        config_dict = {
            "bot": {
                "token": config.bot.token,
                "channel_id": config.bot.channel_id,
                "guild_id": config.bot.guild_id,
                "prefix": config.bot.prefix,
                "auto_reconnect": config.bot.auto_reconnect,
                "max_reconnect_attempts": config.bot.max_reconnect_attempts,
                "reconnect_delay": config.bot.reconnect_delay,
            },
            "file": {
                "enabled": config.file.enabled,
                "input_file": config.file.input_file,
                "output_file": config.file.output_file,
                "watch_interval": config.file.watch_interval,
                "file_encoding": config.file.file_encoding,
            },
            "socket": {
                "enabled": config.socket.enabled,
                "socket_path": config.socket.socket_path,
                "socket_mode": oct(config.socket.socket_mode),
                "max_connections": config.socket.max_connections,
            },
            "service": {
                "enabled": config.service.enabled,
                "script_directory": config.service.script_directory,
                "allowed_commands": config.service.allowed_commands,
                "max_execution_time": config.service.max_execution_time,
                "working_directory": config.service.working_directory,
            },
            "logging": {
                "level": config.logging.level,
                "file": config.logging.file,
                "format": config.logging.format,
                "max_file_size": config.logging.max_file_size,
                "backup_count": config.logging.backup_count,
            }
        }
        
        with open(save_path, 'w', encoding='utf-8') as f:
            yaml.dump(config_dict, f, default_flow_style=False, indent=2)