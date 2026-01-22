// Alert Service for Crypto Suite
// Handles notifications via multiple channels: webhooks, email, Telegram, Discord

const axios = require('axios');
const nodemailer = require('nodemailer');
const { Telegraf } = require('telegraf');
const { WebClient } = require('@slack/web-api');

class AlertService {
  constructor(config = {}) {
    this.webhooks = new Map();
    this.emailTransporter = null;
    this.telegramBot = null;
    this.slackClient = null;
    this.discordWebhooks = new Map();
    this.alertQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.alertHistory = [];
    this.maxHistorySize = 500;

    // Alert severity levels
    this.severityLevels = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    // Minimum severity for each channel
    this.channelThresholds = {
      webhook: 'low',
      email: 'medium',
      telegram: 'medium',
      discord: 'low',
      slack: 'medium'
    };

    if (config.email) this.setupEmail(config.email);
    if (config.telegram) this.setupTelegram(config.telegram);
    if (config.slack) this.setupSlack(config.slack);
  }

  // Setup email notifications
  setupEmail(config) {
    this.emailTransporter = nodemailer.createTransport({
      host: config.host || 'smtp.gmail.com',
      port: config.port || 587,
      secure: config.secure || false,
      auth: {
        user: config.user,
        pass: config.password
      }
    });
    this.emailConfig = config;
  }

  // Setup Telegram bot
  setupTelegram(config) {
    this.telegramBot = new Telegraf(config.botToken);
    this.telegramChatIds = config.chatIds || [];
  }

  // Setup Slack
  setupSlack(config) {
    this.slackClient = new WebClient(config.token);
    this.slackChannels = config.channels || [];
  }

  // Register a webhook
  registerWebhook(id, url, options = {}) {
    this.webhooks.set(id, {
      url,
      secret: options.secret,
      events: options.events || ['*'],
      headers: options.headers || {},
      active: true
    });
    return id;
  }

  // Remove a webhook
  removeWebhook(id) {
    return this.webhooks.delete(id);
  }

  // Register Discord webhook
  registerDiscordWebhook(id, webhookUrl) {
    this.discordWebhooks.set(id, webhookUrl);
    return id;
  }

  // Send alert to all configured channels
  async sendAlert(alert) {
    const enrichedAlert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: Date.now(),
      severity: alert.severity || 'medium'
    };

    // Add to history
    this.alertHistory.unshift(enrichedAlert);
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.pop();
    }

    // Queue the alert
    this.alertQueue.push(enrichedAlert);
    this.processQueue();

    return enrichedAlert.id;
  }

  // Process alert queue
  async processQueue() {
    if (this.isProcessing || this.alertQueue.length === 0) return;

    this.isProcessing = true;

    while (this.alertQueue.length > 0) {
      const alert = this.alertQueue.shift();
      await this.dispatchAlert(alert);
    }

    this.isProcessing = false;
  }

  // Dispatch alert to all channels
  async dispatchAlert(alert) {
    const results = {
      webhook: [],
      email: null,
      telegram: null,
      discord: [],
      slack: null
    };

    // Send to webhooks
    for (const [id, webhook] of this.webhooks) {
      if (!webhook.active) continue;
      if (!this.shouldSendToChannel('webhook', alert.severity)) continue;
      if (!this.matchesEventFilter(webhook.events, alert.type)) continue;

      try {
        const result = await this.sendWebhook(webhook, alert);
        results.webhook.push({ id, success: true, result });
      } catch (error) {
        results.webhook.push({ id, success: false, error: error.message });
      }
    }

    // Send email
    if (this.emailTransporter && this.shouldSendToChannel('email', alert.severity)) {
      try {
        results.email = await this.sendEmail(alert);
      } catch (error) {
        results.email = { success: false, error: error.message };
      }
    }

    // Send Telegram
    if (this.telegramBot && this.shouldSendToChannel('telegram', alert.severity)) {
      try {
        results.telegram = await this.sendTelegram(alert);
      } catch (error) {
        results.telegram = { success: false, error: error.message };
      }
    }

    // Send Discord
    for (const [id, webhookUrl] of this.discordWebhooks) {
      if (!this.shouldSendToChannel('discord', alert.severity)) continue;

      try {
        const result = await this.sendDiscord(webhookUrl, alert);
        results.discord.push({ id, success: true, result });
      } catch (error) {
        results.discord.push({ id, success: false, error: error.message });
      }
    }

    // Send Slack
    if (this.slackClient && this.shouldSendToChannel('slack', alert.severity)) {
      try {
        results.slack = await this.sendSlack(alert);
      } catch (error) {
        results.slack = { success: false, error: error.message };
      }
    }

    return results;
  }

  // Check if alert should be sent to channel based on severity
  shouldSendToChannel(channel, severity) {
    const threshold = this.channelThresholds[channel];
    return this.severityLevels[severity] >= this.severityLevels[threshold];
  }

  // Check if alert matches event filter
  matchesEventFilter(events, alertType) {
    return events.includes('*') || events.includes(alertType);
  }

  // Send webhook with retry
  async sendWebhook(webhook, alert, attempt = 1) {
    try {
      const payload = {
        ...alert,
        signature: webhook.secret ? this.signPayload(alert, webhook.secret) : undefined
      };

      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Crypto-Suite-Signature': payload.signature,
          ...webhook.headers
        },
        timeout: 10000
      });

      return { status: response.status, data: response.data };
    } catch (error) {
      if (attempt < this.retryAttempts) {
        await this.delay(this.retryDelay * attempt);
        return this.sendWebhook(webhook, alert, attempt + 1);
      }
      throw error;
    }
  }

  // Send email notification
  async sendEmail(alert) {
    const severityColors = {
      low: '#3498db',
      medium: '#f39c12',
      high: '#e74c3c',
      critical: '#9b59b6'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${severityColors[alert.severity]}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Crypto Suite Alert</h1>
          <p style="margin: 10px 0 0 0; text-transform: uppercase;">${alert.severity} Severity</p>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333;">${alert.type}</h2>
          <p style="color: #666; font-size: 16px;">${alert.message}</p>
          ${alert.data ? `<pre style="background: #fff; padding: 15px; border-radius: 5px; overflow-x: auto;">${JSON.stringify(alert.data, null, 2)}</pre>` : ''}
          <p style="color: #999; font-size: 12px; margin-top: 20px;">Alert ID: ${alert.id}<br>Time: ${new Date(alert.timestamp).toISOString()}</p>
        </div>
        <div style="background: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
          Crypto Suite - Blockchain Monitoring
        </div>
      </div>
    `;

    const result = await this.emailTransporter.sendMail({
      from: this.emailConfig.from || this.emailConfig.user,
      to: this.emailConfig.to,
      subject: `[${alert.severity.toUpperCase()}] ${alert.type} - Crypto Suite Alert`,
      html
    });

    return { success: true, messageId: result.messageId };
  }

  // Send Telegram notification
  async sendTelegram(alert) {
    const emoji = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🚨',
      critical: '🔴'
    };

    const message = `
${emoji[alert.severity]} *${alert.type}*

${alert.message}

${alert.data ? `\`\`\`json\n${JSON.stringify(alert.data, null, 2)}\n\`\`\`` : ''}

_Severity: ${alert.severity}_
_Time: ${new Date(alert.timestamp).toISOString()}_
    `.trim();

    const results = [];
    for (const chatId of this.telegramChatIds) {
      try {
        await this.telegramBot.telegram.sendMessage(chatId, message, {
          parse_mode: 'Markdown'
        });
        results.push({ chatId, success: true });
      } catch (error) {
        results.push({ chatId, success: false, error: error.message });
      }
    }

    return { success: true, results };
  }

  // Send Discord notification
  async sendDiscord(webhookUrl, alert) {
    const colors = {
      low: 0x3498db,
      medium: 0xf39c12,
      high: 0xe74c3c,
      critical: 0x9b59b6
    };

    const embed = {
      title: alert.type,
      description: alert.message,
      color: colors[alert.severity],
      fields: alert.data ? Object.entries(alert.data).slice(0, 10).map(([key, value]) => ({
        name: key,
        value: typeof value === 'object' ? JSON.stringify(value).slice(0, 100) : String(value).slice(0, 100),
        inline: true
      })) : [],
      footer: {
        text: `Crypto Suite | ${alert.severity.toUpperCase()}`
      },
      timestamp: new Date(alert.timestamp).toISOString()
    };

    const response = await axios.post(webhookUrl, {
      embeds: [embed]
    });

    return { success: true, status: response.status };
  }

  // Send Slack notification
  async sendSlack(alert) {
    const colors = {
      low: '#3498db',
      medium: '#f39c12',
      high: '#e74c3c',
      critical: '#9b59b6'
    };

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${alert.type}`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: alert.message
        }
      }
    ];

    if (alert.data) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`${JSON.stringify(alert.data, null, 2)}\`\`\``
        }
      });
    }

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `*Severity:* ${alert.severity} | *Time:* ${new Date(alert.timestamp).toISOString()}`
        }
      ]
    });

    const results = [];
    for (const channel of this.slackChannels) {
      try {
        await this.slackClient.chat.postMessage({
          channel,
          blocks,
          attachments: [{ color: colors[alert.severity] }]
        });
        results.push({ channel, success: true });
      } catch (error) {
        results.push({ channel, success: false, error: error.message });
      }
    }

    return { success: true, results };
  }

  // Sign payload for webhook verification
  signPayload(payload, secret) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  // Generate unique alert ID
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Delay helper
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get alert history
  getAlertHistory(filters = {}) {
    let history = [...this.alertHistory];

    if (filters.severity) {
      history = history.filter(a => a.severity === filters.severity);
    }
    if (filters.type) {
      history = history.filter(a => a.type === filters.type);
    }
    if (filters.since) {
      history = history.filter(a => a.timestamp >= filters.since);
    }
    if (filters.limit) {
      history = history.slice(0, filters.limit);
    }

    return history;
  }

  // Set channel threshold
  setChannelThreshold(channel, severity) {
    if (this.channelThresholds.hasOwnProperty(channel) &&
        this.severityLevels.hasOwnProperty(severity)) {
      this.channelThresholds[channel] = severity;
    }
  }

  // Get statistics
  getStats() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const recentAlerts = this.alertHistory.filter(a => a.timestamp > last24h);

    const bySeverity = {};
    for (const severity of Object.keys(this.severityLevels)) {
      bySeverity[severity] = recentAlerts.filter(a => a.severity === severity).length;
    }

    return {
      totalAlerts: this.alertHistory.length,
      last24hAlerts: recentAlerts.length,
      bySeverity,
      webhooksConfigured: this.webhooks.size,
      discordWebhooksConfigured: this.discordWebhooks.size,
      emailConfigured: !!this.emailTransporter,
      telegramConfigured: !!this.telegramBot,
      slackConfigured: !!this.slackClient,
      queueLength: this.alertQueue.length
    };
  }
}

// Singleton instance
let alertServiceInstance = null;

const getAlertService = (config) => {
  if (!alertServiceInstance) {
    alertServiceInstance = new AlertService(config);
  }
  return alertServiceInstance;
};

module.exports = {
  AlertService,
  getAlertService
};
