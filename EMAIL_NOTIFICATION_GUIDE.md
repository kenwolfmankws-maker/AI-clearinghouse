# Email Notification System for Webhook Alerts

This guide explains how to set up and use email notifications for webhook alerts alongside Slack notifications.

## Overview

The email notification system sends formatted HTML emails when webhook alert conditions are met. It includes:
- SMTP configuration management
- Email recipient management with severity filtering
- Professional HTML email templates
- Delivery tracking and analytics
- Test email functionality

## Database Tables

### email_configurations
Stores SMTP server settings for each organization:
- `smtp_host`: SMTP server hostname
- `smtp_port`: SMTP port (default: 587)
- `smtp_user`: SMTP username
- `smtp_password`: SMTP password (encrypted)
- `from_email`: Sender email address
- `from_name`: Sender display name
- `use_tls`: Enable TLS encryption
- `is_active`: Enable/disable email notifications

### email_alert_recipients
Manages who receives alert emails:
- `email`: Recipient email address
- `name`: Recipient display name
- `severity_levels`: Array of severities to receive (critical, high, medium, low)
- `webhook_ids`: Array of webhook IDs (empty = all webhooks)
- `is_active`: Enable/disable recipient

### email_notification_deliveries
Tracks email delivery status:
- `recipient_email`: Who received the email
- `subject`: Email subject line
- `severity`: Alert severity level
- `webhook_name`: Name of webhook that triggered alert
- `sent_at`: When email was sent
- `delivery_status`: sent, failed, bounced
- `error_message`: Error details if failed
- `opened_at`: When email was opened (if tracking enabled)
- `clicked_at`: When links were clicked (if tracking enabled)

## UI Components

### EmailConfigurationManager
Located in `src/components/EmailConfigurationManager.tsx`

**Features:**
- SMTP server configuration
- TLS/SSL settings
- Test email functionality
- Recipient management
- Severity level filtering per recipient

**Usage:**
```tsx
import EmailConfigurationManager from '@/components/EmailConfigurationManager';

<EmailConfigurationManager />
```

## Email Templates

### Alert Email Template
Located in `src/lib/emailAlertTemplates.ts`

**Features:**
- Severity-based color coding
- Professional HTML layout
- Responsive design
- Plain text fallback
- Dashboard quick links

**Severity Colors:**
- Critical: Red (#DC2626)
- High: Orange (#EA580C)
- Medium: Yellow (#F59E0B)
- Low: Blue (#3B82F6)

## Configuration Steps

### 1. Configure SMTP Settings

Navigate to Webhook Integration → Email Notifications tab:

1. Enter SMTP server details:
   - Host: smtp.gmail.com (for Gmail)
   - Port: 587 (TLS) or 465 (SSL)
   - Username: your-email@gmail.com
   - Password: your-app-password

2. Set sender information:
   - From Email: alerts@yourdomain.com
   - From Name: Webhook Alerts

3. Enable TLS if required
4. Save configuration

### 2. Add Recipients

In the Recipients section:

1. Enter recipient email address
2. Enter display name (optional)
3. Click "Add Recipient"
4. Recipients automatically receive all severity levels

### 3. Test Email Configuration

Click "Send Test Email" to verify:
- SMTP credentials are correct
- Email delivery is working
- Email formatting appears correctly

## Gmail SMTP Setup

For Gmail accounts:

1. Enable 2-Factor Authentication
2. Generate App Password:
   - Go to Google Account → Security
   - Select "App passwords"
   - Generate password for "Mail"
3. Use app password in SMTP configuration

**Settings:**
- Host: smtp.gmail.com
- Port: 587
- TLS: Enabled
- Username: your-email@gmail.com
- Password: [16-character app password]

## Integration with check-webhook-alerts

The edge function should send both Slack and email notifications:

```typescript
// Send email notifications
const { data: emailConfig } = await supabase
  .from('email_configurations')
  .select('*')
  .eq('organization_id', rule.organization_id)
  .eq('is_active', true)
  .single();

if (emailConfig) {
  const { data: recipients } = await supabase
    .from('email_alert_recipients')
    .select('*')
    .eq('organization_id', rule.organization_id)
    .eq('is_active', true);

  for (const recipient of recipients || []) {
    if (recipient.severity_levels.includes(rule.severity)) {
      await sendAlertEmail(emailConfig, recipient, alertData);
    }
  }
}
```

## Email Delivery Tracking

Track email delivery status:

```typescript
await supabase
  .from('email_notification_deliveries')
  .insert({
    organization_id: rule.organization_id,
    alert_rule_id: rule.id,
    recipient_email: recipient.email,
    subject: emailSubject,
    severity: rule.severity,
    webhook_name: webhook.name,
    delivery_status: 'sent'
  });
```

## Troubleshooting

### Emails Not Sending

1. Verify SMTP credentials
2. Check TLS/SSL settings
3. Ensure firewall allows SMTP port
4. Check spam folder
5. Review error logs in email_notification_deliveries

### Gmail Blocking

If Gmail blocks emails:
- Use App Password instead of account password
- Enable "Less secure app access" (not recommended)
- Use OAuth2 authentication (advanced)

### Formatting Issues

- Test in multiple email clients
- Check HTML template rendering
- Verify plain text fallback

## Best Practices

1. **Security:**
   - Never store passwords in plain text
   - Use environment variables for sensitive data
   - Enable TLS encryption
   - Use app-specific passwords

2. **Deliverability:**
   - Use verified sender domain
   - Include unsubscribe link
   - Monitor bounce rates
   - Keep recipient lists clean

3. **Performance:**
   - Batch email sending
   - Use queue for large volumes
   - Implement rate limiting
   - Cache email templates

4. **Monitoring:**
   - Track delivery rates
   - Monitor bounce rates
   - Review error logs
   - Test regularly

## Advanced Features

### Custom Email Templates

Modify `src/lib/emailAlertTemplates.ts` to customize:
- Email layout
- Color schemes
- Logo and branding
- Additional data fields

### Severity Filtering

Recipients can choose which severities to receive:
```typescript
severity_levels: ['critical', 'high'] // Only critical and high alerts
```

### Webhook Filtering

Target specific webhooks:
```typescript
webhook_ids: [webhook1_id, webhook2_id] // Only these webhooks
```

## Support

For issues or questions:
1. Check email_notification_deliveries for errors
2. Review SMTP server logs
3. Test with simple email client first
4. Verify network connectivity