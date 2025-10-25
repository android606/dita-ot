/**
 * Discord bot implementation
 */

const { Client, GatewayIntentBits, Events } = require('discord.js');
const EventEmitter = require('events');

class DiscordBot extends EventEmitter {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.messageHandlers = [];
    this.readyHandlers = [];
  }

  async initialize() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ]
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.once(Events.ClientReady, (readyClient) => {
      this.logger.info(`Bot logged in as ${readyClient.user.tag}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('ready');
      
      // Call registered ready handlers
      this.readyHandlers.forEach(handler => {
        try {
          if (typeof handler === 'function') {
            handler();
          }
        } catch (error) {
          this.logger.error('Error in ready handler:', error);
        }
      });
    });

    this.client.on(Events.MessageCreate, (message) => {
      // Ignore messages from the bot itself
      if (message.author.bot) return;

      // Check if message is in the configured channel
      if (this.config.bot.channelId && message.channel.id !== this.config.bot.channelId) {
        return;
      }

      this.logger.debug(`Received message from ${message.author.tag}: ${message.content}`);

      // Call registered message handlers
      this.messageHandlers.forEach(handler => {
        try {
          if (typeof handler === 'function') {
            handler(message);
          }
        } catch (error) {
          this.logger.error('Error in message handler:', error);
        }
      });

      this.emit('message', message);
    });

    this.client.on(Events.Error, (error) => {
      this.logger.error('Discord client error:', error);
      this.emit('error', error);
    });

    this.client.on(Events.Disconnect, () => {
      this.logger.warn('Bot disconnected');
      this.isConnected = false;
      this.emit('disconnect');
    });

    this.client.on(Events.ShardError, (error) => {
      this.logger.error('Shard error:', error);
      this.emit('error', error);
    });
  }

  async start() {
    try {
      if (!this.client) {
        await this.initialize();
      }

      await this.client.login(this.config.bot.token);
    } catch (error) {
      this.logger.error('Failed to start bot:', error);
      throw error;
    }
  }

  async stop() {
    if (this.client) {
      this.isConnected = false;
      await this.client.destroy();
      this.client = null;
    }
  }

  async sendMessage(content, channelId = null) {
    try {
      const targetChannelId = channelId || this.config.bot.channelId;
      if (!targetChannelId) {
        this.logger.error('No channel ID configured');
        return false;
      }

      const channel = this.client.channels.cache.get(targetChannelId);
      if (!channel) {
        this.logger.error(`Channel ${targetChannelId} not found`);
        return false;
      }

      await channel.send(content);
      this.logger.debug(`Sent message to channel ${targetChannelId}: ${content}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return false;
    }
  }

  async getChannelMessages(limit = 10) {
    try {
      const channelId = this.config.bot.channelId;
      if (!channelId) {
        this.logger.error('No channel ID configured');
        return [];
      }

      const channel = this.client.channels.cache.get(channelId);
      if (!channel) {
        this.logger.error(`Channel ${channelId} not found`);
        return [];
      }

      const messages = await channel.messages.fetch({ limit });
      return Array.from(messages.values());
    } catch (error) {
      this.logger.error('Error getting channel messages:', error);
      return [];
    }
  }

  addMessageHandler(handler) {
    if (typeof handler === 'function') {
      this.messageHandlers.push(handler);
    }
  }

  addReadyHandler(handler) {
    if (typeof handler === 'function') {
      this.readyHandlers.push(handler);
    }
  }

  removeMessageHandler(handler) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  removeReadyHandler(handler) {
    const index = this.readyHandlers.indexOf(handler);
    if (index > -1) {
      this.readyHandlers.splice(index, 1);
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      ready: this.client?.readyAt ? true : false,
      user: this.client?.user?.tag || null,
      guilds: this.client?.guilds?.cache?.size || 0
    };
  }
}

module.exports = DiscordBot;