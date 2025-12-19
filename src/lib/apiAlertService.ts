import { APIUsageRecord } from './apiUsageTracker';

export interface AlertRule {
  id: string;
  name: string;
  type: 'rate_limit' | 'cost_spike' | 'violation' | 'quota' | 'key_expiry';

  threshold: number;
  enabled: boolean;
  apiKeys: string[];
  channels: ('browser' | 'email' | 'slack' | 'discord')[];
}

export interface NotificationPreference {
  email?: string;
  slackWebhook?: string;
  discordWebhook?: string;
  browserEnabled: boolean;
}

const ALERT_RULES_KEY = 'api_alert_rules';
const NOTIFICATION_PREFS_KEY = 'api_notification_prefs';
const ALERT_HISTORY_KEY = 'api_alert_history';

export class APIAlertService {
  static getAlertRules(): AlertRule[] {
    const data = localStorage.getItem(ALERT_RULES_KEY);
    return data ? JSON.parse(data) : this.getDefaultRules();
  }

  static saveAlertRules(rules: AlertRule[]) {
    localStorage.setItem(ALERT_RULES_KEY, JSON.stringify(rules));
  }

  static getNotificationPreferences(): NotificationPreference {
    const data = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    return data ? JSON.parse(data) : { browserEnabled: true };
  }

  static saveNotificationPreferences(prefs: NotificationPreference) {
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  }

  private static getDefaultRules(): AlertRule[] {
    return [
      {
        id: '1',
        name: 'Rate Limit Warning (90%)',
        type: 'rate_limit',
        threshold: 90,
        enabled: true,
        apiKeys: ['OPENAI_API_KEY', 'VITE_RESEND_API_KEY', 'TWILIO_AUTH_TOKEN'],
        channels: ['browser', 'email'],
      },
      {
        id: '2',
        name: 'Cost Spike Alert',
        type: 'cost_spike',
        threshold: 50,
        enabled: true,
        apiKeys: ['OPENAI_API_KEY', 'TWILIO_AUTH_TOKEN'],
        channels: ['browser', 'email', 'slack'],
      },
      {
        id: '3',
        name: 'Repeated Violations',
        type: 'violation',
        threshold: 5,
        enabled: true,
        apiKeys: ['OPENAI_API_KEY', 'VITE_RESEND_API_KEY', 'TWILIO_AUTH_TOKEN'],
        channels: ['browser', 'email'],
      },
    ];
  }

  static checkAlerts(keyName: string, record: APIUsageRecord) {
    const rules = this.getAlertRules().filter(r => r.enabled && r.apiKeys.includes(keyName));
    rules.forEach(rule => {
      if (this.shouldTriggerAlert(rule, record)) {
        this.sendAlert(rule, keyName, record);
      }
    });
  }

  private static shouldTriggerAlert(rule: AlertRule, record: APIUsageRecord): boolean {
    switch (rule.type) {
      case 'rate_limit':
        if (record.rateLimit) {
          const usage = this.getCurrentUsagePercentage(record);
          return usage >= rule.threshold;
        }
        return false;
      case 'cost_spike':
        return this.detectCostSpike(record, rule.threshold);
      case 'violation':
        return record.rateLimitViolations >= rule.threshold;
      default:
        return false;
    }
  }

  private static getCurrentUsagePercentage(record: APIUsageRecord): number {
    if (!record.rateLimit) return 0;
    const recentCalls = record.callHistory.slice(-record.rateLimit).length;
    return (recentCalls / record.rateLimit) * 100;
  }

  private static detectCostSpike(record: APIUsageRecord, threshold: number): boolean {
    const recent = record.callHistory.slice(-10);
    if (recent.length < 5) return false;
    const avgCost = recent.reduce((sum, c) => sum + c.cost, 0) / recent.length;
    const lastCost = recent[recent.length - 1].cost;
    return lastCost > avgCost * (1 + threshold / 100);
  }

  private static sendAlert(rule: AlertRule, keyName: string, record: APIUsageRecord) {
    const message = this.formatAlertMessage(rule, keyName, record);
    const prefs = this.getNotificationPreferences();

    rule.channels.forEach(channel => {
      switch (channel) {
        case 'browser':
          if (prefs.browserEnabled) this.sendBrowserNotification(message);
          break;
        case 'email':
          if (prefs.email) this.sendEmailAlert(prefs.email, message);
          break;
        case 'slack':
          if (prefs.slackWebhook) this.sendSlackAlert(prefs.slackWebhook, message);
          break;
        case 'discord':
          if (prefs.discordWebhook) this.sendDiscordAlert(prefs.discordWebhook, message);
          break;
      }
    });

    this.logAlert(rule, keyName, message);
  }

  private static formatAlertMessage(rule: AlertRule, keyName: string, record: APIUsageRecord): string {
    switch (rule.type) {
      case 'rate_limit':
        return `${keyName}: Rate limit at ${this.getCurrentUsagePercentage(record).toFixed(1)}%`;
      case 'cost_spike':
        return `${keyName}: Cost spike detected - $${record.estimatedCost.toFixed(2)}`;
      case 'violation':
        return `${keyName}: ${record.rateLimitViolations} rate limit violations`;
      default:
        return `Alert triggered for ${keyName}`;
    }
  }

  private static sendBrowserNotification(message: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('API Usage Alert', { body: message, icon: '/placeholder.svg' });
    }
  }

  private static async sendEmailAlert(email: string, message: string) {
    console.log(`Email alert to ${email}: ${message}`);
  }

  private static async sendSlackAlert(webhook: string, message: string) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
    } catch (error) {
      console.error('Slack alert failed:', error);
    }
  }

  private static async sendDiscordAlert(webhook: string, message: string) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });
    } catch (error) {
      console.error('Discord alert failed:', error);
    }
  }

  private static logAlert(rule: AlertRule, keyName: string, message: string) {
    const history = JSON.parse(localStorage.getItem(ALERT_HISTORY_KEY) || '[]');
    history.unshift({
      timestamp: new Date().toISOString(),
      ruleName: rule.name,
      keyName,
      message,
    });
    localStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  }

  static getAlertHistory() {
    return JSON.parse(localStorage.getItem(ALERT_HISTORY_KEY) || '[]');
  }

  static async requestBrowserPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  static sendKeyExpiryAlert(keyName: string, daysUntilExpiry: number) {
    const message = `${keyName}: API key expires in ${daysUntilExpiry} days`;
    const prefs = this.getNotificationPreferences();
    
    if (prefs.browserEnabled) this.sendBrowserNotification(message);
    if (prefs.email) this.sendEmailAlert(prefs.email, message);
    if (prefs.slackWebhook) this.sendSlackAlert(prefs.slackWebhook, message);
    if (prefs.discordWebhook) this.sendDiscordAlert(prefs.discordWebhook, message);
    
    this.logAlert({ id: 'expiry', name: 'Key Expiry', type: 'key_expiry', threshold: 0, enabled: true, apiKeys: [keyName], channels: [] }, keyName, message);
  }
}

