"""
Discord bot implementation
"""

import asyncio
import logging
import sys
from typing import Optional, Callable, Any
import discord
from discord.ext import commands

from .config import Config


class DiscordBot:
    """Main Discord bot class"""
    
    def __init__(self, config: Config):
        self.config = config
        self.bot = commands.Bot(
            command_prefix=config.bot.prefix,
            intents=discord.Intents.default()
        )
        self.bot.intents.message_content = True
        
        # Message handlers
        self.message_handlers: list[Callable[[discord.Message], Any]] = []
        self.ready_handlers: list[Callable[[], Any]] = []
        
        # Setup event handlers
        self._setup_handlers()
        
        # Reconnection state
        self.reconnect_attempts = 0
        self.is_running = False
    
    def _setup_handlers(self):
        """Setup Discord event handlers"""
        
        @self.bot.event
        async def on_ready():
            """Called when bot is ready"""
            logging.info(f"Bot logged in as {self.bot.user}")
            self.reconnect_attempts = 0
            self.is_running = True
            
            # Call registered ready handlers
            for handler in self.ready_handlers:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler()
                    else:
                        handler()
                except Exception as e:
                    logging.error(f"Error in ready handler: {e}")
        
        @self.bot.event
        async def on_message(message):
            """Handle incoming messages"""
            # Ignore messages from the bot itself
            if message.author == self.bot.user:
                return
            
            # Check if message is in the configured channel
            if self.config.bot.channel_id and message.channel.id != self.config.bot.channel_id:
                return
            
            # Call registered message handlers
            for handler in self.message_handlers:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(message)
                    else:
                        handler(message)
                except Exception as e:
                    logging.error(f"Error in message handler: {e}")
            
            # Process commands
            await self.bot.process_commands(message)
        
        @self.bot.event
        async def on_disconnect():
            """Called when bot disconnects"""
            logging.warning("Bot disconnected")
            self.is_running = False
        
        @self.bot.event
        async def on_error(event, *args, **kwargs):
            """Handle errors"""
            logging.error(f"Error in event {event}: {sys.exc_info()}")
    
    def add_message_handler(self, handler: Callable[[discord.Message], Any]):
        """Add a message handler"""
        self.message_handlers.append(handler)
    
    def add_ready_handler(self, handler: Callable[[], Any]):
        """Add a ready handler"""
        self.ready_handlers.append(handler)
    
    async def start(self):
        """Start the bot"""
        try:
            await self.bot.start(self.config.bot.token)
        except discord.LoginFailure:
            logging.error("Invalid Discord bot token")
            raise
        except Exception as e:
            logging.error(f"Error starting bot: {e}")
            raise
    
    async def stop(self):
        """Stop the bot"""
        self.is_running = False
        await self.bot.close()
    
    async def send_message(self, content: str, channel_id: Optional[int] = None) -> bool:
        """Send a message to Discord"""
        try:
            channel_id = channel_id or self.config.bot.channel_id
            if not channel_id:
                logging.error("No channel ID configured")
                return False
            
            channel = self.bot.get_channel(channel_id)
            if not channel:
                logging.error(f"Channel {channel_id} not found")
                return False
            
            await channel.send(content)
            return True
        except Exception as e:
            logging.error(f"Error sending message: {e}")
            return False
    
    async def get_channel_messages(self, limit: int = 10) -> list[discord.Message]:
        """Get recent messages from the configured channel"""
        try:
            channel_id = self.config.bot.channel_id
            if not channel_id:
                logging.error("No channel ID configured")
                return []
            
            channel = self.bot.get_channel(channel_id)
            if not channel:
                logging.error(f"Channel {channel_id} not found")
                return []
            
            messages = []
            async for message in channel.history(limit=limit):
                messages.append(message)
            
            return messages
        except Exception as e:
            logging.error(f"Error getting channel messages: {e}")
            return []
    
    def is_connected(self) -> bool:
        """Check if bot is connected to Discord"""
        return self.bot.is_ready() and self.is_running