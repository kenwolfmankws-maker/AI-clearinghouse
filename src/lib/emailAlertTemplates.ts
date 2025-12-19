export interface AlertEmailData {
  severity: 'critical' | 'high' | 'medium' | 'low';
  webhookName: string;
  alertType: string;
  currentValue: number;
  threshold: number;
  timeWindow: string;
  webhookUrl?: string;
  dashboardUrl?: string;
}

const severityColors = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#F59E0B',
  low: '#3B82F6'
};

const severityEmojis = {
  critical: '🚨',
  high: '⚠️',
  medium: '⚡',
  low: 'ℹ️'
};

export function generateAlertEmailHTML(data: AlertEmailData): string {
  const color = severityColors[data.severity];
  const emoji = severityEmojis[data.severity];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Webhook Alert: ${data.webhookName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${color}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${emoji} Webhook Alert</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">${data.severity} Severity</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px;">${data.webhookName}</h2>
              
              <div style="background-color: #f9fafb; border-left: 4px solid ${color}; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px;"><strong>Alert Type:</strong> ${data.alertType}</p>
                <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px;"><strong>Current Value:</strong> ${data.currentValue}</p>
                <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px;"><strong>Threshold:</strong> ${data.threshold}</p>
                <p style="margin: 0; color: #374151; font-size: 16px;"><strong>Time Window:</strong> ${data.timeWindow}</p>
              </div>
              
              ${data.dashboardUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.dashboardUrl}" style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">View Dashboard</a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">This is an automated alert from your Webhook Monitoring System</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateAlertEmailText(data: AlertEmailData): string {
  return `
WEBHOOK ALERT - ${data.severity.toUpperCase()} SEVERITY

Webhook: ${data.webhookName}
Alert Type: ${data.alertType}
Current Value: ${data.currentValue}
Threshold: ${data.threshold}
Time Window: ${data.timeWindow}

${data.dashboardUrl ? `View Dashboard: ${data.dashboardUrl}` : ''}

This is an automated alert from your Webhook Monitoring System.
  `.trim();
}

export function generateAlertEmailSubject(data: AlertEmailData): string {
  return `[${data.severity.toUpperCase()}] Webhook Alert: ${data.webhookName}`;
}