"""
Service mode implementation for script execution
"""

import asyncio
import logging
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Any
import json

from .config import Config


class ServiceHandler:
    """Handle service mode with script execution"""
    
    def __init__(self, bot, config: Config):
        self.bot = bot
        self.config = config
        self.running = False
        self.script_cache: Dict[str, str] = {}
    
    async def start(self):
        """Start service mode"""
        if not self.config.service.enabled:
            return
        
        self.running = True
        logging.info("Starting service mode")
        
        # Load available scripts
        await self._load_scripts()
        
        # Add command handler
        self.bot.add_message_handler(self._handle_service_message)
    
    async def stop(self):
        """Stop service mode"""
        self.running = False
    
    async def _load_scripts(self):
        """Load available scripts from script directory"""
        script_dir = Path(self.config.service.script_directory)
        if not script_dir.exists():
            script_dir.mkdir(parents=True, exist_ok=True)
            logging.info(f"Created script directory: {script_dir}")
            return
        
        for script_file in script_dir.glob("*"):
            if script_file.is_file() and script_file.stat().st_mode & 0o111:  # Executable
                self.script_cache[script_file.name] = str(script_file)
                logging.info(f"Loaded script: {script_file.name}")
    
    async def _handle_service_message(self, message):
        """Handle messages for service mode"""
        content = message.content.strip()
        
        # Check if message starts with service prefix
        if not content.startswith(self.config.bot.prefix):
            return
        
        # Remove prefix
        command_line = content[1:].strip()
        
        # Parse command
        parts = command_line.split()
        if not parts:
            return
        
        command = parts[0]
        args = parts[1:] if len(parts) > 1 else []
        
        # Execute command
        response = await self._execute_command(command, args, message)
        
        # Send response back to Discord
        if response:
            await self.bot.send_message(response)
    
    async def _execute_command(self, command: str, args: List[str], message) -> Optional[str]:
        """Execute a command or script"""
        try:
            # Check if command is in allowed commands
            if (self.config.service.allowed_commands and 
                command not in self.config.service.allowed_commands):
                return f"Command '{command}' not allowed"
            
            # Check if it's a script
            if command in self.script_cache:
                return await self._execute_script(command, args, message)
            
            # Check if it's a system command
            if command in ['ls', 'ps', 'df', 'free', 'uptime', 'whoami', 'pwd']:
                return await self._execute_system_command(command, args)
            
            # Check if it's a custom command
            if command == 'help':
                return await self._get_help()
            elif command == 'list':
                return await self._list_scripts()
            elif command == 'status':
                return await self._get_status()
            elif command == 'reload':
                await self._load_scripts()
                return "Scripts reloaded"
            
            return f"Unknown command: {command}. Use 'help' for available commands."
        
        except Exception as e:
            logging.error(f"Error executing command '{command}': {e}")
            return f"Error executing command: {str(e)}"
    
    async def _execute_script(self, script_name: str, args: List[str], message) -> str:
        """Execute a script"""
        script_path = self.script_cache[script_name]
        
        try:
            # Prepare environment
            env = os.environ.copy()
            env.update({
                'DISCORD_MESSAGE_ID': str(message.id),
                'DISCORD_AUTHOR': str(message.author),
                'DISCORD_CHANNEL_ID': str(message.channel.id),
                'DISCORD_GUILD_ID': str(message.guild.id) if message.guild else '',
                'DISCORD_MESSAGE_CONTENT': message.content,
                'DISCORD_ARGS': ' '.join(args)
            })
            
            # Execute script
            process = await asyncio.create_subprocess_exec(
                script_path,
                *args,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=self.config.service.working_directory,
                env=env
            )
            
            # Wait for completion with timeout
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self.config.service.max_execution_time
                )
            except asyncio.TimeoutError:
                process.kill()
                return f"Script '{script_name}' timed out after {self.config.service.max_execution_time} seconds"
            
            # Process output
            stdout_text = stdout.decode('utf-8', errors='replace').strip()
            stderr_text = stderr.decode('utf-8', errors='replace').strip()
            
            if process.returncode == 0:
                return stdout_text or "Script executed successfully"
            else:
                return f"Script failed (exit code {process.returncode}):\n{stderr_text or stdout_text}"
        
        except Exception as e:
            logging.error(f"Error executing script '{script_name}': {e}")
            return f"Error executing script: {str(e)}"
    
    async def _execute_system_command(self, command: str, args: List[str]) -> str:
        """Execute a system command"""
        try:
            process = await asyncio.create_subprocess_exec(
                command,
                *args,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=self.config.service.max_execution_time
            )
            
            stdout_text = stdout.decode('utf-8', errors='replace').strip()
            stderr_text = stderr.decode('utf-8', errors='replace').strip()
            
            if process.returncode == 0:
                return stdout_text or "Command executed successfully"
            else:
                return f"Command failed (exit code {process.returncode}):\n{stderr_text or stdout_text}"
        
        except asyncio.TimeoutError:
            return f"Command '{command}' timed out after {self.config.service.max_execution_time} seconds"
        except Exception as e:
            return f"Error executing command: {str(e)}"
    
    async def _get_help(self) -> str:
        """Get help information"""
        help_text = [
            "Available commands:",
            "  help - Show this help message",
            "  list - List available scripts",
            "  status - Show bot status",
            "  reload - Reload scripts",
            "",
            "System commands:",
            "  ls, ps, df, free, uptime, whoami, pwd",
            "",
            "Scripts:"
        ]
        
        if self.script_cache:
            for script_name in sorted(self.script_cache.keys()):
                help_text.append(f"  {script_name}")
        else:
            help_text.append("  No scripts available")
        
        return "\n".join(help_text)
    
    async def _list_scripts(self) -> str:
        """List available scripts"""
        if not self.script_cache:
            return "No scripts available"
        
        script_list = []
        for script_name, script_path in self.script_cache.items():
            script_list.append(f"  {script_name} ({script_path})")
        
        return "Available scripts:\n" + "\n".join(script_list)
    
    async def _get_status(self) -> str:
        """Get bot status"""
        status_info = [
            f"Bot connected: {self.bot.is_connected()}",
            f"Service running: {self.running}",
            f"Scripts loaded: {len(self.script_cache)}",
            f"Working directory: {self.config.service.working_directory}",
            f"Max execution time: {self.config.service.max_execution_time}s"
        ]
        
        return "\n".join(status_info)
    
    async def execute_script_direct(self, script_name: str, args: List[str] = None) -> str:
        """Execute a script directly (for external use)"""
        if script_name not in self.script_cache:
            return f"Script '{script_name}' not found"
        
        return await self._execute_script(script_name, args or [], None)