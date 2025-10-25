"""
Main entry point for Discord Bot CLI
"""

import asyncio
import logging
import signal
import sys
from pathlib import Path
from typing import Optional

import click

from .config import ConfigManager, Config
from .bot import DiscordBot
from .io_handlers import StdinHandler, FileHandler, SocketHandler
from .service import ServiceHandler


def setup_logging(config: Config):
    """Setup logging configuration"""
    log_level = getattr(logging, config.logging.level.upper(), logging.INFO)
    
    # Configure logging
    handlers = [logging.StreamHandler(sys.stderr)]
    
    if config.logging.file:
        from logging.handlers import RotatingFileHandler
        file_handler = RotatingFileHandler(
            config.logging.file,
            maxBytes=config.logging.max_file_size,
            backupCount=config.logging.backup_count
        )
        handlers.append(file_handler)
    
    logging.basicConfig(
        level=log_level,
        format=config.logging.format,
        handlers=handlers
    )


class DiscordBotCLI:
    """Main CLI application class"""
    
    def __init__(self, config: Config):
        self.config = config
        self.bot = DiscordBot(config)
        self.stdin_handler = StdinHandler(self.bot, config)
        self.file_handler = FileHandler(self.bot, config)
        self.socket_handler = SocketHandler(self.bot, config)
        self.service_handler = ServiceHandler(self.bot, config)
        
        # Setup message handlers
        self._setup_message_handlers()
        
        # Setup signal handlers
        self._setup_signal_handlers()
    
    def _setup_message_handlers(self):
        """Setup message handlers for different outputs"""
        
        async def handle_discord_message(message):
            """Handle incoming Discord messages"""
            # Output to stdout
            self.stdin_handler.write_stdout(f"[{message.author}] {message.content}")
            
            # Output to file
            await self.file_handler.write_output_file(f"[{message.author}] {message.content}")
        
        self.bot.add_message_handler(handle_discord_message)
    
    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        def signal_handler(signum, frame):
            logging.info(f"Received signal {signum}, shutting down...")
            asyncio.create_task(self.shutdown())
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    async def start(self):
        """Start the bot and all handlers"""
        try:
            # Start all handlers
            await self.stdin_handler.start()
            await self.file_handler.start()
            await self.socket_handler.start()
            await self.service_handler.start()
            
            # Start the bot
            await self.bot.start()
        
        except KeyboardInterrupt:
            logging.info("Received keyboard interrupt")
        except Exception as e:
            logging.error(f"Error starting bot: {e}")
            raise
        finally:
            await self.shutdown()
    
    async def shutdown(self):
        """Shutdown all handlers and bot"""
        logging.info("Shutting down...")
        
        # Stop all handlers
        await self.stdin_handler.stop()
        await self.file_handler.stop()
        await self.socket_handler.stop()
        await self.service_handler.stop()
        
        # Stop the bot
        await self.bot.stop()
        
        logging.info("Shutdown complete")


@click.command()
@click.option('--config', '-c', help='Configuration file path')
@click.option('--token', '-t', help='Discord bot token')
@click.option('--channel-id', help='Discord channel ID')
@click.option('--guild-id', help='Discord guild ID')
@click.option('--prefix', default='!', help='Command prefix')
@click.option('--stdin', is_flag=True, help='Enable stdin/stdout mode')
@click.option('--file-input', help='Input file path for file-based messaging')
@click.option('--file-output', help='Output file path for file-based messaging')
@click.option('--socket-path', help='Unix socket path for IPC')
@click.option('--service', is_flag=True, help='Enable service mode')
@click.option('--script-dir', help='Script directory for service mode')
@click.option('--log-level', default='INFO', help='Logging level')
@click.option('--log-file', help='Log file path')
@click.option('--daemon', is_flag=True, help='Run as daemon')
def main(config, token, channel_id, guild_id, prefix, stdin, file_input, file_output,
         socket_path, service, script_dir, log_level, log_file, daemon):
    """Discord Bot CLI - A Linux command-line utility for Discord bot integration"""
    
    # Load configuration
    config_manager = ConfigManager(config)
    try:
        app_config = config_manager.load_config()
    except Exception as e:
        click.echo(f"Error loading configuration: {e}", err=True)
        sys.exit(1)
    
    # Override with command line options
    if token:
        app_config.bot.token = token
    if channel_id:
        app_config.bot.channel_id = int(channel_id)
    if guild_id:
        app_config.bot.guild_id = int(guild_id)
    if prefix:
        app_config.bot.prefix = prefix
    if stdin or file_input or file_output:
        app_config.file.enabled = True
    if file_input:
        app_config.file.input_file = file_input
    if file_output:
        app_config.file.output_file = file_output
    if socket_path:
        app_config.socket.enabled = True
        app_config.socket.socket_path = socket_path
    if service or script_dir:
        app_config.service.enabled = True
    if script_dir:
        app_config.service.script_directory = script_dir
    if log_level:
        app_config.logging.level = log_level
    if log_file:
        app_config.logging.file = log_file
    
    # Setup logging
    setup_logging(app_config)
    
    # Validate configuration
    if not app_config.bot.token:
        click.echo("Error: Discord bot token is required", err=True)
        click.echo("Set DISCORD_BOT_TOKEN environment variable or use --token option", err=True)
        sys.exit(1)
    
    if not app_config.bot.channel_id:
        click.echo("Warning: No channel ID configured. Bot will listen to all channels.", err=True)
    
    # Create and start application
    app = DiscordBotCLI(app_config)
    
    if daemon:
        # TODO: Implement daemon mode
        click.echo("Daemon mode not yet implemented", err=True)
        sys.exit(1)
    
    try:
        asyncio.run(app.start())
    except KeyboardInterrupt:
        logging.info("Received keyboard interrupt")
    except Exception as e:
        logging.error(f"Application error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()