/**
 * Service mode implementation for script execution
 */

const { execa } = require('execa');
const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

class ServiceHandler extends EventEmitter {
  constructor(bot, config, logger) {
    super();
    this.bot = bot;
    this.config = config;
    this.logger = logger;
    this.running = false;
    this.scriptCache = new Map();
  }

  async start() {
    if (!this.config.service.enabled) {
      return;
    }

    this.running = true;
    this.logger.info('Starting service mode');

    // Load available scripts
    await this.loadScripts();

    // Add command handler
    this.bot.addMessageHandler((message) => this.handleServiceMessage(message));
  }

  async stop() {
    this.running = false;
  }

  async loadScripts() {
    const scriptDir = path.resolve(this.config.service.scriptDirectory);
    
    if (!await fs.pathExists(scriptDir)) {
      await fs.ensureDir(scriptDir);
      this.logger.info(`Created script directory: ${scriptDir}`);
      return;
    }

    const files = await fs.readdir(scriptDir);
    
    for (const file of files) {
      const filePath = path.join(scriptDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile() && (stats.mode & parseInt('111', 8))) { // Check if executable
        this.scriptCache.set(file, filePath);
        this.logger.info(`Loaded script: ${file}`);
      }
    }
  }

  async handleServiceMessage(message) {
    const content = message.content.trim();

    // Check if message starts with service prefix
    if (!content.startsWith(this.config.bot.prefix)) {
      return;
    }

    // Remove prefix
    const commandLine = content.substring(this.config.bot.prefix.length).trim();

    // Parse command
    const parts = commandLine.split(/\s+/);
    if (parts.length === 0) return;

    const command = parts[0];
    const args = parts.slice(1);

    this.logger.debug(`Executing command: ${command} with args: ${args.join(' ')}`);

    // Execute command
    const response = await this.executeCommand(command, args, message);

    // Send response back to Discord
    if (response) {
      await this.bot.sendMessage(response);
    }
  }

  async executeCommand(command, args, message) {
    try {
      // Check if command is in allowed commands
      if (this.config.service.allowedCommands.length > 0 && 
          !this.config.service.allowedCommands.includes(command)) {
        return `Command '${command}' not allowed`;
      }

      // Check if it's a script
      if (this.scriptCache.has(command)) {
        return await this.executeScript(command, args, message);
      }

      // Check if it's a system command
      if (['ls', 'ps', 'df', 'free', 'uptime', 'whoami', 'pwd'].includes(command)) {
        return await this.executeSystemCommand(command, args);
      }

      // Check if it's a custom command
      switch (command) {
        case 'help':
          return await this.getHelp();
        case 'list':
          return await this.listScripts();
        case 'status':
          return await this.getStatus();
        case 'reload':
          await this.loadScripts();
          return 'Scripts reloaded';
        default:
          return `Unknown command: ${command}. Use 'help' for available commands.`;
      }
    } catch (error) {
      this.logger.error(`Error executing command '${command}':`, error);
      return `Error executing command: ${error.message}`;
    }
  }

  async executeScript(scriptName, args, message) {
    const scriptPath = this.scriptCache.get(scriptName);

    try {
      // Prepare environment
      const env = {
        ...process.env,
        DISCORD_MESSAGE_ID: message?.id || 'direct',
        DISCORD_AUTHOR: message?.author?.tag || 'system',
        DISCORD_CHANNEL_ID: message?.channel?.id || 'direct',
        DISCORD_GUILD_ID: message?.guild?.id || '',
        DISCORD_MESSAGE_CONTENT: message?.content || 'direct execution',
        DISCORD_ARGS: args.join(' ')
      };

      // Execute script
      const result = await execa(scriptPath, args, {
        cwd: this.config.service.workingDirectory,
        env,
        timeout: this.config.service.maxExecutionTime
      });

      if (result.exitCode === 0) {
        return result.stdout || 'Script executed successfully';
      } else {
        return `Script failed (exit code ${result.exitCode}):\n${result.stderr || result.stdout}`;
      }
    } catch (error) {
      if (error.timedOut) {
        return `Script '${scriptName}' timed out after ${this.config.service.maxExecutionTime}ms`;
      }
      this.logger.error(`Error executing script '${scriptName}':`, error);
      return `Error executing script: ${error.message}`;
    }
  }

  async executeSystemCommand(command, args) {
    try {
      const result = await execa(command, args, {
        timeout: this.config.service.maxExecutionTime
      });

      if (result.exitCode === 0) {
        return result.stdout || 'Command executed successfully';
      } else {
        return `Command failed (exit code ${result.exitCode}):\n${result.stderr || result.stdout}`;
      }
    } catch (error) {
      if (error.timedOut) {
        return `Command '${command}' timed out after ${this.config.service.maxExecutionTime}ms`;
      }
      this.logger.error(`Error executing command '${command}':`, error);
      return `Error executing command: ${error.message}`;
    }
  }

  async getHelp() {
    const helpText = [
      'Available commands:',
      '  help - Show this help message',
      '  list - List available scripts',
      '  status - Show bot status',
      '  reload - Reload scripts',
      '',
      'System commands:',
      `  ${this.config.service.allowedCommands.join(', ')}`,
      '',
      'Scripts:'
    ];

    if (this.scriptCache.size > 0) {
      for (const scriptName of this.scriptCache.keys()) {
        helpText.push(`  ${scriptName}`);
      }
    } else {
      helpText.push('  No scripts available');
    }

    return helpText.join('\n');
  }

  async listScripts() {
    if (this.scriptCache.size === 0) {
      return 'No scripts available';
    }

    const scriptList = [];
    for (const [scriptName, scriptPath] of this.scriptCache.entries()) {
      scriptList.push(`  ${scriptName} (${scriptPath})`);
    }

    return 'Available scripts:\n' + scriptList.join('\n');
  }

  async getStatus() {
    const status = this.bot.getConnectionStatus();
    const statusInfo = [
      `Bot connected: ${status.connected}`,
      `Service running: ${this.running}`,
      `Scripts loaded: ${this.scriptCache.size}`,
      `Working directory: ${this.config.service.workingDirectory}`,
      `Max execution time: ${this.config.service.maxExecutionTime}ms`
    ];

    return statusInfo.join('\n');
  }

  async executeScriptDirect(scriptName, args = []) {
    if (!this.scriptCache.has(scriptName)) {
      return `Script '${scriptName}' not found`;
    }

    return await this.executeScript(scriptName, args, null);
  }
}

module.exports = ServiceHandler;