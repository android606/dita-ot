"""
Input/Output handlers for various interfaces
"""

import asyncio
import json
import logging
import os
import socket
import sys
from pathlib import Path
from typing import Optional, Callable, Any, Dict
import aiofiles
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from .config import Config


class StdinHandler:
    """Handle stdin/stdout communication"""
    
    def __init__(self, bot, config: Config):
        self.bot = bot
        self.config = config
        self.running = False
    
    async def start(self):
        """Start stdin/stdout handling"""
        self.running = True
        logging.info("Starting stdin/stdout handler")
        
        # Read from stdin in a separate task
        asyncio.create_task(self._read_stdin())
    
    async def stop(self):
        """Stop stdin/stdout handling"""
        self.running = False
    
    async def _read_stdin(self):
        """Read messages from stdin"""
        while self.running:
            try:
                # Read line from stdin
                line = await asyncio.get_event_loop().run_in_executor(
                    None, sys.stdin.readline
                )
                
                if not line:
                    break
                
                line = line.strip()
                if not line:
                    continue
                
                # Send to Discord
                success = await self.bot.send_message(line)
                if success:
                    logging.debug(f"Sent message to Discord: {line}")
                else:
                    logging.error(f"Failed to send message: {line}")
                
            except Exception as e:
                logging.error(f"Error reading from stdin: {e}")
                break
    
    def write_stdout(self, message: str):
        """Write message to stdout"""
        try:
            print(message, flush=True)
        except Exception as e:
            logging.error(f"Error writing to stdout: {e}")


class FileHandler:
    """Handle file-based messaging"""
    
    def __init__(self, bot, config: Config):
        self.bot = bot
        self.config = config
        self.observer: Optional[Observer] = None
        self.running = False
    
    async def start(self):
        """Start file watching"""
        if not self.config.file.enabled:
            return
        
        self.running = True
        logging.info("Starting file handler")
        
        # Setup file watcher
        if self.config.file.input_file:
            self._setup_file_watcher()
        
        # Start periodic check
        asyncio.create_task(self._periodic_check())
    
    async def stop(self):
        """Stop file watching"""
        self.running = False
        if self.observer:
            self.observer.stop()
            self.observer.join()
    
    def _setup_file_watcher(self):
        """Setup file system watcher"""
        input_path = Path(self.config.file.input_file)
        if not input_path.exists():
            input_path.parent.mkdir(parents=True, exist_ok=True)
            input_path.touch()
        
        class FileEventHandler(FileSystemEventHandler):
            def __init__(self, handler):
                self.handler = handler
                self.last_modified = 0
            
            def on_modified(self, event):
                if event.is_directory:
                    return
                
                if event.src_path == str(input_path):
                    # Check if file was actually modified
                    current_time = os.path.getmtime(event.src_path)
                    if current_time > self.last_modified:
                        self.last_modified = current_time
                        asyncio.create_task(self.handler._process_input_file())
        
        self.observer = Observer()
        self.observer.schedule(
            FileEventHandler(self),
            str(input_path.parent),
            recursive=False
        )
        self.observer.start()
    
    async def _periodic_check(self):
        """Periodic check for file changes"""
        while self.running:
            try:
                await asyncio.sleep(self.config.file.watch_interval)
                if self.config.file.input_file:
                    await self._process_input_file()
            except Exception as e:
                logging.error(f"Error in periodic file check: {e}")
    
    async def _process_input_file(self):
        """Process input file for new messages"""
        try:
            input_path = Path(self.config.file.input_file)
            if not input_path.exists():
                return
            
            # Read file content
            async with aiofiles.open(input_path, 'r', encoding=self.config.file.file_encoding) as f:
                content = await f.read()
            
            if not content.strip():
                return
            
            # Send to Discord
            success = await self.bot.send_message(content.strip())
            if success:
                logging.debug(f"Sent file content to Discord: {content[:100]}...")
                # Clear the file after sending
                await f.truncate(0)
            else:
                logging.error("Failed to send file content to Discord")
        
        except Exception as e:
            logging.error(f"Error processing input file: {e}")
    
    async def write_output_file(self, message: str):
        """Write message to output file"""
        if not self.config.file.output_file:
            return
        
        try:
            output_path = Path(self.config.file.output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            async with aiofiles.open(output_path, 'a', encoding=self.config.file.file_encoding) as f:
                await f.write(f"{message}\n")
            
            logging.debug(f"Wrote message to output file: {message[:100]}...")
        
        except Exception as e:
            logging.error(f"Error writing to output file: {e}")


class SocketHandler:
    """Handle Unix socket communication"""
    
    def __init__(self, bot, config: Config):
        self.bot = bot
        self.config = config
        self.server: Optional[asyncio.Server] = None
        self.running = False
    
    async def start(self):
        """Start Unix socket server"""
        if not self.config.socket.enabled:
            return
        
        self.running = True
        logging.info(f"Starting Unix socket server at {self.config.socket.socket_path}")
        
        # Remove existing socket file
        socket_path = Path(self.config.socket.socket_path)
        if socket_path.exists():
            socket_path.unlink()
        
        # Create server
        self.server = await asyncio.start_unix_server(
            self._handle_client,
            self.config.socket.socket_path
        )
        
        # Set socket permissions
        os.chmod(self.config.socket.socket_path, self.config.socket.socket_mode)
        
        logging.info("Unix socket server started")
    
    async def stop(self):
        """Stop Unix socket server"""
        self.running = False
        if self.server:
            self.server.close()
            await self.server.wait_closed()
        
        # Remove socket file
        socket_path = Path(self.config.socket.socket_path)
        if socket_path.exists():
            socket_path.unlink()
    
    async def _handle_client(self, reader, writer):
        """Handle client connection"""
        client_addr = writer.get_extra_info('peername')
        logging.info(f"Client connected: {client_addr}")
        
        try:
            while self.running:
                # Read message length
                length_data = await reader.read(4)
                if not length_data:
                    break
                
                message_length = int.from_bytes(length_data, 'big')
                
                # Read message content
                message_data = await reader.read(message_length)
                if len(message_data) != message_length:
                    break
                
                message = message_data.decode('utf-8')
                logging.debug(f"Received socket message: {message}")
                
                # Process message
                response = await self._process_socket_message(message)
                
                # Send response
                response_data = response.encode('utf-8')
                response_length = len(response_data).to_bytes(4, 'big')
                writer.write(response_length + response_data)
                await writer.drain()
        
        except Exception as e:
            logging.error(f"Error handling client {client_addr}: {e}")
        finally:
            writer.close()
            await writer.wait_closed()
            logging.info(f"Client disconnected: {client_addr}")
    
    async def _process_socket_message(self, message: str) -> str:
        """Process socket message and return response"""
        try:
            # Parse JSON message
            data = json.loads(message)
            command = data.get('command')
            
            if command == 'send':
                content = data.get('content', '')
                success = await self.bot.send_message(content)
                return json.dumps({'success': success, 'message': content})
            
            elif command == 'status':
                return json.dumps({
                    'connected': self.bot.is_connected(),
                    'running': self.bot.is_running
                })
            
            elif command == 'get_messages':
                limit = data.get('limit', 10)
                messages = await self.bot.get_channel_messages(limit)
                message_data = []
                for msg in messages:
                    message_data.append({
                        'id': msg.id,
                        'content': msg.content,
                        'author': str(msg.author),
                        'timestamp': msg.created_at.isoformat()
                    })
                return json.dumps({'messages': message_data})
            
            else:
                return json.dumps({'error': f'Unknown command: {command}'})
        
        except json.JSONDecodeError:
            return json.dumps({'error': 'Invalid JSON message'})
        except Exception as e:
            return json.dumps({'error': str(e)})
    
    async def send_socket_message(self, socket_path: str, message: str) -> Optional[str]:
        """Send message to Unix socket"""
        try:
            reader, writer = await asyncio.open_unix_connection(socket_path)
            
            # Send message
            message_data = message.encode('utf-8')
            message_length = len(message_data).to_bytes(4, 'big')
            writer.write(message_length + message_data)
            await writer.drain()
            
            # Read response
            length_data = await reader.read(4)
            if not length_data:
                return None
            
            response_length = int.from_bytes(length_data, 'big')
            response_data = await reader.read(response_length)
            response = response_data.decode('utf-8')
            
            writer.close()
            await writer.wait_closed()
            
            return response
        
        except Exception as e:
            logging.error(f"Error sending socket message: {e}")
            return None