/**
 * Configuration management for Discord Bot CLI
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
require('dotenv').config();

class ConfigManager {
  constructor(configPath = null) {
    this.configPath = configPath || this.findConfigFile();
    this.config = null;
  }

  findConfigFile() {
    const configLocations = [
      './discord-bot.yaml',
      './discord-bot.yml',
      '~/.config/discord-bot/config.yaml',
      '~/.config/discord-bot/config.yml',
      '/etc/discord-bot/config.yaml',
      '/etc/discord-bot/config.yml'
    ];

    for (const location of configLocations) {
      const fullPath = path.resolve(location.replace('~', require('os').homedir()));
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    return './discord-bot.yaml';
  }

  loadConfig() {
    let configData = {};

    // Load from file if it exists
    if (this.configPath && fs.existsSync(this.configPath)) {
      try {
        const fileContent = fs.readFileSync(this.configPath, 'utf8');
        configData = yaml.parse(fileContent) || {};
      } catch (error) {
        console.warn(`Warning: Could not load config file ${this.configPath}: ${error.message}`);
      }
    }

    // Override with environment variables
    const envOverrides = this.loadEnvOverrides();
    configData = this.mergeConfigs(configData, envOverrides);

    // Create configuration object with defaults
    this.config = {
      bot: {
        token: configData.bot?.token || process.env.DISCORD_BOT_TOKEN,
        applicationId: configData.bot?.applicationId || process.env.DISCORD_APPLICATION_ID,
        publicKey: configData.bot?.publicKey || process.env.DISCORD_PUBLIC_KEY,
        channelId: configData.bot?.channelId || process.env.DISCORD_CHANNEL_ID,
        guildId: configData.bot?.guildId || process.env.DISCORD_GUILD_ID,
        prefix: configData.bot?.prefix || process.env.DISCORD_PREFIX || '!',
        autoReconnect: configData.bot?.autoReconnect !== false,
        maxReconnectAttempts: configData.bot?.maxReconnectAttempts || 5,
        reconnectDelay: configData.bot?.reconnectDelay || 5000
      },
      file: {
        enabled: configData.file?.enabled || process.env.DISCORD_FILE_ENABLED === 'true',
        inputFile: configData.file?.inputFile || process.env.DISCORD_INPUT_FILE,
        outputFile: configData.file?.outputFile || process.env.DISCORD_OUTPUT_FILE,
        watchInterval: configData.file?.watchInterval || 1000,
        fileEncoding: configData.file?.fileEncoding || 'utf8'
      },
      socket: {
        enabled: configData.socket?.enabled || process.env.DISCORD_SOCKET_ENABLED === 'true',
        socketPath: configData.socket?.socketPath || process.env.DISCORD_SOCKET_PATH || '/tmp/discord-bot.sock',
        socketMode: configData.socket?.socketMode || '0o600',
        maxConnections: configData.socket?.maxConnections || 10
      },
      service: {
        enabled: configData.service?.enabled || process.env.DISCORD_SERVICE_ENABLED === 'true',
        scriptDirectory: configData.service?.scriptDirectory || process.env.DISCORD_SCRIPT_DIR || './scripts',
        allowedCommands: configData.service?.allowedCommands || ['ls', 'ps', 'df', 'free', 'uptime', 'whoami', 'pwd'],
        maxExecutionTime: configData.service?.maxExecutionTime || 30000,
        workingDirectory: configData.service?.workingDirectory || process.cwd()
      },
      logging: {
        level: configData.logging?.level || process.env.DISCORD_LOG_LEVEL || 'info',
        file: configData.logging?.file || process.env.DISCORD_LOG_FILE,
        format: configData.logging?.format || '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        maxFileSize: configData.logging?.maxFileSize || 10 * 1024 * 1024,
        backupCount: configData.logging?.backupCount || 5
      }
    };

    // Validate required configuration
    if (!this.config.bot.token) {
      throw new Error('Discord bot token is required. Set DISCORD_BOT_TOKEN environment variable or configure in config file.');
    }

    return this.config;
  }

  loadEnvOverrides() {
    const overrides = {};

    // Bot configuration
    if (process.env.DISCORD_BOT_TOKEN) {
      overrides.bot = { ...overrides.bot, token: process.env.DISCORD_BOT_TOKEN };
    }
    if (process.env.DISCORD_APPLICATION_ID) {
      overrides.bot = { ...overrides.bot, applicationId: process.env.DISCORD_APPLICATION_ID };
    }
    if (process.env.DISCORD_PUBLIC_KEY) {
      overrides.bot = { ...overrides.bot, publicKey: process.env.DISCORD_PUBLIC_KEY };
    }
    if (process.env.DISCORD_CHANNEL_ID) {
      overrides.bot = { ...overrides.bot, channelId: process.env.DISCORD_CHANNEL_ID };
    }
    if (process.env.DISCORD_GUILD_ID) {
      overrides.bot = { ...overrides.bot, guildId: process.env.DISCORD_GUILD_ID };
    }
    if (process.env.DISCORD_PREFIX) {
      overrides.bot = { ...overrides.bot, prefix: process.env.DISCORD_PREFIX };
    }

    // File configuration
    if (process.env.DISCORD_FILE_ENABLED) {
      overrides.file = { ...overrides.file, enabled: process.env.DISCORD_FILE_ENABLED === 'true' };
    }
    if (process.env.DISCORD_INPUT_FILE) {
      overrides.file = { ...overrides.file, inputFile: process.env.DISCORD_INPUT_FILE };
    }
    if (process.env.DISCORD_OUTPUT_FILE) {
      overrides.file = { ...overrides.file, outputFile: process.env.DISCORD_OUTPUT_FILE };
    }

    // Socket configuration
    if (process.env.DISCORD_SOCKET_ENABLED) {
      overrides.socket = { ...overrides.socket, enabled: process.env.DISCORD_SOCKET_ENABLED === 'true' };
    }
    if (process.env.DISCORD_SOCKET_PATH) {
      overrides.socket = { ...overrides.socket, socketPath: process.env.DISCORD_SOCKET_PATH };
    }

    // Service configuration
    if (process.env.DISCORD_SERVICE_ENABLED) {
      overrides.service = { ...overrides.service, enabled: process.env.DISCORD_SERVICE_ENABLED === 'true' };
    }
    if (process.env.DISCORD_SCRIPT_DIR) {
      overrides.service = { ...overrides.service, scriptDirectory: process.env.DISCORD_SCRIPT_DIR };
    }

    // Logging configuration
    if (process.env.DISCORD_LOG_LEVEL) {
      overrides.logging = { ...overrides.logging, level: process.env.DISCORD_LOG_LEVEL };
    }
    if (process.env.DISCORD_LOG_FILE) {
      overrides.logging = { ...overrides.logging, file: process.env.DISCORD_LOG_FILE };
    }

    return overrides;
  }

  mergeConfigs(base, overrides) {
    const result = { ...base };

    for (const key in overrides) {
      if (overrides[key] && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
        result[key] = { ...result[key], ...overrides[key] };
      } else {
        result[key] = overrides[key];
      }
    }

    return result;
  }

  saveConfig(config, path = null) {
    const savePath = path || this.configPath;
    const dir = path.dirname(savePath);

    // Ensure directory exists
    fs.ensureDirSync(dir);

    // Convert config to YAML
    const yamlContent = yaml.stringify(config, {
      indent: 2,
      lineWidth: 0
    });

    fs.writeFileSync(savePath, yamlContent, 'utf8');
  }

  createDefaultConfig() {
    const defaultConfig = {
      bot: {
        token: '${DISCORD_BOT_TOKEN}',
        applicationId: '${DISCORD_APPLICATION_ID}',
        publicKey: '${DISCORD_PUBLIC_KEY}',
        channelId: null,
        guildId: null,
        prefix: '!',
        autoReconnect: true,
        maxReconnectAttempts: 5,
        reconnectDelay: 5000
      },
      file: {
        enabled: false,
        inputFile: null,
        outputFile: null,
        watchInterval: 1000,
        fileEncoding: 'utf8'
      },
      socket: {
        enabled: false,
        socketPath: '/tmp/discord-bot.sock',
        socketMode: '0o600',
        maxConnections: 10
      },
      service: {
        enabled: false,
        scriptDirectory: './scripts',
        allowedCommands: ['ls', 'ps', 'df', 'free', 'uptime', 'whoami', 'pwd'],
        maxExecutionTime: 30000,
        workingDirectory: '.'
      },
      logging: {
        level: 'info',
        file: null,
        format: '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        maxFileSize: 10485760,
        backupCount: 5
      }
    };

    return defaultConfig;
  }
}

module.exports = ConfigManager;