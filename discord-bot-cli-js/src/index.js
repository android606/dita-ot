/**
 * Main entry point for Discord Bot CLI
 */

const { program } = require('commander');
const chalk = require('chalk');
const ConfigManager = require('./config');
const Logger = require('./logger');
const DiscordBot = require('./bot');
const { StdinHandler, FileHandler, SocketHandler } = require('./ioHandlers');
const ServiceHandler = require('./service');

class DiscordBotCLI {
  constructor(config) {
    this.config = config;
    this.logger = new Logger(config);
    this.bot = new DiscordBot(config, this.logger);
    this.stdinHandler = new StdinHandler(this.bot, config, this.logger);
    this.fileHandler = new FileHandler(this.bot, config, this.logger);
    this.socketHandler = new SocketHandler(this.bot, config, this.logger);
    this.serviceHandler = new ServiceHandler(this.bot, config, this.logger);

    // Setup message handlers
    this.setupMessageHandlers();

    // Setup signal handlers
    this.setupSignalHandlers();
  }

  setupMessageHandlers() {
    // Handle incoming Discord messages
    this.bot.addMessageHandler(async (message) => {
      // Output to stdout
      this.stdinHandler.writeStdout(`[${message.author.tag}] ${message.content}`);

      // Output to file
      await this.fileHandler.writeOutputFile(`[${message.author.tag}] ${message.content}`);
    });
  }

  setupSignalHandlers() {
    const gracefulShutdown = async (signal) => {
      this.logger.info(`Received ${signal}, shutting down...`);
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon
  }

  async start() {
    try {
      this.logger.info('Starting Discord Bot CLI...');

      // Start all handlers
      await this.stdinHandler.start();
      await this.fileHandler.start();
      await this.socketHandler.start();
      await this.serviceHandler.start();

      // Start the bot
      await this.bot.start();

      this.logger.info('Discord Bot CLI started successfully');
    } catch (error) {
      this.logger.error('Error starting Discord Bot CLI:', error);
      throw error;
    }
  }

  async shutdown() {
    this.logger.info('Shutting down...');

    // Stop all handlers
    await this.stdinHandler.stop();
    await this.fileHandler.stop();
    await this.socketHandler.stop();
    await this.serviceHandler.stop();

    // Stop the bot
    await this.bot.stop();

    this.logger.info('Shutdown complete');
  }
}

// CLI setup
program
  .name('discord-bot')
  .description('A Linux command-line utility that acts as a Discord bot interface for shell scripts')
  .version('1.0.0')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-t, --token <token>', 'Discord bot token')
  .option('--application-id <id>', 'Discord application ID')
  .option('--public-key <key>', 'Discord public key')
  .option('--channel-id <id>', 'Discord channel ID')
  .option('--guild-id <id>', 'Discord guild ID')
  .option('--prefix <prefix>', 'Command prefix', '!')
  .option('--stdin', 'Enable stdin/stdout mode')
  .option('--file-input <path>', 'Input file path for file-based messaging')
  .option('--file-output <path>', 'Output file path for file-based messaging')
  .option('--socket-path <path>', 'Unix socket path for IPC')
  .option('--service', 'Enable service mode')
  .option('--script-dir <path>', 'Script directory for service mode')
  .option('--log-level <level>', 'Logging level', 'info')
  .option('--log-file <path>', 'Log file path')
  .option('--daemon', 'Run as daemon')
  .action(async (options) => {
    try {
      // Load configuration
      const configManager = new ConfigManager(options.config);
      let config = configManager.loadConfig();

      // Override with command line options
      if (options.token) config.bot.token = options.token;
      if (options.applicationId) config.bot.applicationId = options.applicationId;
      if (options.publicKey) config.bot.publicKey = options.publicKey;
      if (options.channelId) config.bot.channelId = options.channelId;
      if (options.guildId) config.bot.guildId = options.guildId;
      if (options.prefix) config.bot.prefix = options.prefix;
      if (options.stdin || options.fileInput || options.fileOutput) {
        config.file.enabled = true;
      }
      if (options.fileInput) config.file.inputFile = options.fileInput;
      if (options.fileOutput) config.file.outputFile = options.fileOutput;
      if (options.socketPath) {
        config.socket.enabled = true;
        config.socket.socketPath = options.socketPath;
      }
      if (options.service || options.scriptDir) {
        config.service.enabled = true;
      }
      if (options.scriptDir) config.service.scriptDirectory = options.scriptDir;
      if (options.logLevel) config.logging.level = options.logLevel;
      if (options.logFile) config.logging.file = options.logFile;

      // Validate configuration
      if (!config.bot.token) {
        console.error(chalk.red('Error: Discord bot token is required'));
        console.error(chalk.yellow('Set DISCORD_BOT_TOKEN environment variable or use --token option'));
        process.exit(1);
      }

      if (!config.bot.channelId) {
        console.warn(chalk.yellow('Warning: No channel ID configured. Bot will listen to all channels.'));
      }

      // Create and start application
      const app = new DiscordBotCLI(config);

      if (options.daemon) {
        console.log(chalk.yellow('Daemon mode not yet implemented'));
        process.exit(1);
      }

      await app.start();
    } catch (error) {
      console.error(chalk.red('Application error:'), error.message);
      process.exit(1);
    }
  });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();

module.exports = DiscordBotCLI;