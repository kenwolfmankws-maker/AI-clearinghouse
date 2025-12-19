export interface SMSAlertData {
  webhookName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric: string;
  currentValue: number;
  threshold: number;
  timeWindow?: string;
}

export function generateSMSAlert(data: SMSAlertData): string {
  const { webhookName, severity, metric, currentValue, threshold, timeWindow } = data;
  
  const severityEmoji = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: 'ℹ️'
  };

  const emoji = severityEmoji[severity] || '📢';
  
  // Keep SMS concise (160 chars ideal, 320 max for multi-part)
  let message = `${emoji} ${severity.toUpperCase()} ALERT\n`;
  message += `Webhook: ${webhookName}\n`;
  message += `${metric}: ${currentValue}`;
  
  if (threshold) {
    message += ` (threshold: ${threshold})`;
  }
  
  if (timeWindow) {
    message += `\nWindow: ${timeWindow}`;
  }
  
  message += `\nCheck dashboard for details.`;
  
  return message;
}

export function generateTestSMS(webhookName: string): string {
  return `✅ Test SMS from Webhook Monitor\n\nThis is a test message for webhook: ${webhookName}\n\nIf you received this, SMS alerts are configured correctly.`;
}
