/**
 * Input/Output handlers for various interfaces
 */

const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const net = require('net');
const readline = require('readline');
const EventEmitter = require('events');

class StdinHandler extends EventEmitter {
  constructor(bot, config, logger) {
    super();
    this.bot = bot;
    this.config = config;
    this.logger = logger;
    this.rl = null;
    this.running = false;
  }

  async start() {
    this.running = true;
    this.logger.info('Starting stdin/stdout handler');

    // Setup readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    this.rl.on('line', async (line) => {
      if (!this.running) return;

      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      this.logger.debug(`Received from stdin: ${trimmedLine}`);

      // Send to Discord
      const success = await this.bot.sendMessage(trimmedLine);
      if (success) {
        this.logger.debug(`Sent message to Discord: ${trimmedLine}`);
      } else {
        this.logger.error(`Failed to send message: ${trimmedLine}`);
      }
    });

    this.rl.on('close', () => {
      this.logger.info('Stdin closed');
      this.emit('close');
    });
  }

  async stop() {
    this.running = false;
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  writeStdout(message) {
    try {
      console.log(message);
    } catch (error) {
      this.logger.error('Error writing to stdout:', error);
    }
  }
}

class FileHandler extends EventEmitter {
  constructor(bot, config, logger) {
    super();
    this.bot = bot;
    this.config = config;
    this.logger = logger;
    this.watcher = null;
    this.running = false;
    this.lastModified = 0;
  }

  async start() {
    if (!this.config.file.enabled) {
      return;
    }

    this.running = true;
    this.logger.info('Starting file handler');

    // Setup file watcher
    if (this.config.file.inputFile) {
      await this.setupFileWatcher();
    }

    // Start periodic check
    this.periodicCheck();
  }

  async setupFileWatcher() {
    const inputPath = path.resolve(this.config.file.inputFile);
    
    // Ensure input file exists
    await fs.ensureFile(inputPath);

    this.watcher = chokidar.watch(inputPath, {
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', async () => {
      await this.processInputFile();
    });

    this.watcher.on('error', (error) => {
      this.logger.error('File watcher error:', error);
    });
  }

  async periodicCheck() {
    while (this.running) {
      try {
        await new Promise(resolve => setTimeout(resolve, this.config.file.watchInterval));
        if (this.config.file.inputFile) {
          await this.processInputFile();
        }
      } catch (error) {
        this.logger.error('Error in periodic file check:', error);
      }
    }
  }

  async processInputFile() {
    try {
      const inputPath = path.resolve(this.config.file.inputFile);
      if (!await fs.pathExists(inputPath)) {
        return;
      }

      const stats = await fs.stat(inputPath);
      if (stats.mtime.getTime() <= this.lastModified) {
        return;
      }

      this.lastModified = stats.mtime.getTime();

      const content = await fs.readFile(inputPath, this.config.file.fileEncoding);
      const trimmedContent = content.trim();

      if (!trimmedContent) {
        return;
      }

      this.logger.debug(`Processing file content: ${trimmedContent.substring(0, 100)}...`);

      // Send to Discord
      const success = await this.bot.sendMessage(trimmedContent);
      if (success) {
        this.logger.debug('Sent file content to Discord');
        // Clear the file after sending
        await fs.writeFile(inputPath, '', this.config.file.fileEncoding);
      } else {
        this.logger.error('Failed to send file content to Discord');
      }
    } catch (error) {
      this.logger.error('Error processing input file:', error);
    }
  }

  async writeOutputFile(message) {
    if (!this.config.file.outputFile) {
      return;
    }

    try {
      const outputPath = path.resolve(this.config.file.outputFile);
      await fs.ensureFile(outputPath);
      await fs.appendFile(outputPath, `${message}\n`, this.config.file.fileEncoding);
      this.logger.debug(`Wrote message to output file: ${message.substring(0, 100)}...`);
    } catch (error) {
      this.logger.error('Error writing to output file:', error);
    }
  }

  async stop() {
    this.running = false;
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }
}

class SocketHandler extends EventEmitter {
  constructor(bot, config, logger) {
    super();
    this.bot = bot;
    this.config = config;
    this.logger = logger;
    this.server = null;
    this.running = false;
  }

  async start() {
    if (!this.config.socket.enabled) {
      return;
    }

    this.running = true;
    this.logger.info(`Starting Unix socket server at ${this.config.socket.socketPath}`);

    // Remove existing socket file
    const socketPath = path.resolve(this.config.socket.socketPath);
    if (await fs.pathExists(socketPath)) {
      await fs.remove(socketPath);
    }

    // Create server
    this.server = net.createServer((socket) => {
      this.handleClient(socket);
    });

    this.server.listen(socketPath, () => {
      this.logger.info('Unix socket server started');
      // Set socket permissions
      const mode = typeof this.config.socket.socketMode === 'string' 
        ? parseInt(this.config.socket.socketMode, 8)
        : this.config.socket.socketMode;
      try {
        fs.chmodSync(socketPath, mode);
        this.logger.debug(`Set socket permissions to ${mode.toString(8)}`);
      } catch (error) {
        this.logger.warn('Could not set socket permissions:', error.message);
      }
    });

    this.server.on('error', (error) => {
      this.logger.error('Socket server error:', error);
    });
  }

  handleClient(socket) {
    const clientAddr = socket.remoteAddress;
    this.logger.info(`Client connected: ${clientAddr}`);

    let buffer = '';

    socket.on('data', async (data) => {
      buffer += data.toString();
      
      // Process complete messages (assuming JSON lines)
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = await this.processSocketMessage(line);
            socket.write(response + '\n');
          } catch (error) {
            this.logger.error('Error processing socket message:', error);
            socket.write(JSON.stringify({ error: error.message }) + '\n');
          }
        }
      }
    });

    socket.on('close', () => {
      this.logger.info(`Client disconnected: ${clientAddr}`);
    });

    socket.on('error', (error) => {
      this.logger.error(`Client error ${clientAddr}:`, error);
    });
  }

  async processSocketMessage(message) {
    try {
      const data = JSON.parse(message);
      const command = data.command;

      switch (command) {
        case 'send':
          const content = data.content || '';
          const success = await this.bot.sendMessage(content);
          return JSON.stringify({ success, message: content });

        case 'status':
          const status = this.bot.getConnectionStatus();
          return JSON.stringify({ ...status, running: this.running });

        case 'get_messages':
          const limit = data.limit || 10;
          const messages = await this.bot.getChannelMessages(limit);
          const messageData = messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            author: msg.author.tag,
            timestamp: msg.createdAt.toISOString()
          }));
          return JSON.stringify({ messages: messageData });

        default:
          return JSON.stringify({ error: `Unknown command: ${command}` });
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        return JSON.stringify({ error: 'Invalid JSON message' });
      }
      return JSON.stringify({ error: error.message });
    }
  }

  async stop() {
    this.running = false;
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          // Remove socket file
          const socketPath = path.resolve(this.config.socket.socketPath);
          if (fs.existsSync(socketPath)) {
            fs.unlinkSync(socketPath);
          }
          resolve();
        });
      });
    }
  }

  async sendSocketMessage(socketPath, message) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(socketPath);
      let response = '';
      let resolved = false;
      
      socket.on('connect', () => {
        socket.write(message + '\n');
      });

      socket.on('data', (data) => {
        response += data.toString();
        // Check if we have a complete response (ends with newline)
        if (response.includes('\n')) {
          if (!resolved) {
            resolved = true;
            socket.destroy();
            resolve(response.trim());
          }
        }
      });

      socket.on('close', () => {
        if (!resolved) {
          resolved = true;
          resolve(response.trim());
        }
      });

      socket.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      });

      // Timeout after 2 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          reject(new Error('Socket timeout'));
        }
      }, 2000);
    });
  }
}

module.exports = {
  StdinHandler,
  FileHandler,
  SocketHandler
};