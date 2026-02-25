# Slack Integration for Webhook Alerts

## Overview
The Slack Integration system allows admins to receive real-time notifications in Slack channels when webhook alert conditions are triggered. This provides instant visibility into webhook failures and performance issues.

## Features
- **Multiple Slack Configurations**: Support for multiple Slack workspaces/webhooks
- **Channel Mappings**: Route alerts to different channels based on severity
- **Test Functionality**: Send test messages to verify Slack integration
- **Delivery Tracking**: Track all Slack notification deliveries
- **Active/Inactive Toggle**: Enable/disable Slack configurations
- **Formatted Messages**: Rich Slack message formatting with severity indicators

## Database Tables

### slack_configurations
Stores Slack webhook URLs and default channels:
- `id`: UUID primary key
- `organization_id`: Reference to user
- `name`: Configuration name
- `webhook_url`: Slack incoming webhook URL
- `default_channel`: Default channel for alerts
- `is_active`: Enable/disable configuration
- `created_at`, `updated_at`: Timestamps

### slack_channel_mappings
Maps alert severities to specific Slack channels:
- `id`: UUID primary key
- `slack_config_id`: Reference to slack_configurations
- `alert_severity`: low, medium, high, critical
- `channel_name`: Slack channel (e.g., #critical-alerts)
- `created_at`: Timestamp

### slack_notification_deliveries
Tracks delivery status of Slack notifications:
- `id`: UUID primary key
- `alert_history_id`: Reference to webhook_alert_history
- `slack_config_id`: Reference to slack_configurations
- `channel`: Channel where message was sent
- `status`: sent, failed, pending
- `response_data`: Slack API response
- `error_message`: Error details if failed
- `sent_at`: Timestamp

## Setup Instructions

### 1. Create Slack Incoming Webhook
1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Navigate to "Incoming Webhooks"
4. Activate Incoming Webhooks
5. Click "Add New Webhook to Workspace"
6. Select the channel and authorize
7. Copy the webhook URL

### 2. Add Slack Configuration
1. Navigate to Webhooks → Slack Integration tab
2. Click "Add Configuration"
3. Enter configuration name (e.g., "Production Alerts")
4. Paste Slack webhook URL
5. Set default channel (e.g., #alerts)
6. Click "Create Configuration"

### 3. Configure Channel Mappings
For each Slack configuration, you can map alert severities to specific channels:
1. Select severity level (low, medium, high, critical)
2. Enter channel name (e.g., #critical-alerts)
3. Click "+" to add mapping

If no mapping exists for a severity, alerts use the default channel.

### 4. Test Slack Integration
Click the "Test" button on any configuration to send a test message to Slack.

## Alert Message Format

Slack messages include:
- **Header**: Severity emoji + alert name
- **Fields**: 
  - Severity level
  - Condition type
  - Threshold value
  - Current value
- **Message**: Custom alert message
- **Actions**: Quick action buttons (View Details, Snooze Alert)

### Severity Emojis
- Low: 🟢
- Medium: 🟡
- High: 🟠
- Critical: 🔴

## Edge Function: check-webhook-alerts

This function runs periodically to check alert conditions and send Slack notifications.

### Functionality
1. Fetches all active alert rules
2. Checks if alerts are snoozed
3. Evaluates alert conditions (failure rate, response time, etc.)
4. Creates alert history entries
5. Sends formatted Slack messages
6. Tracks delivery status

### Scheduling
Set up a cron job to run this function periodically:
```bash
# Every 5 minutes
*/5 * * * * curl -X POST https://your-project.supabase.co/functions/v1/check-webhook-alerts
```

Or use Supabase's scheduled functions feature.

## Usage Examples

### Example 1: Critical Alerts to Dedicated Channel
```
Configuration: Production Alerts
Default Channel: #alerts
Channel Mappings:
  - critical → #critical-alerts
  - high → #high-priority
```

### Example 2: Multiple Workspaces
```
Configuration 1: Engineering Team
  - Webhook URL: https://hooks.slack.com/services/T123/B456/xyz
  - Default: #eng-alerts

Configuration 2: Operations Team
  - Webhook URL: https://hooks.slack.com/services/T789/B012/abc
  - Default: #ops-alerts
```

## Delivery Tracking

View delivery status in the database:
```sql
SELECT 
  snd.*,
  wah.severity,
  sc.name as config_name
FROM slack_notification_deliveries snd
JOIN webhook_alert_history wah ON snd.alert_history_id = wah.id
JOIN slack_configurations sc ON snd.slack_config_id = sc.id
ORDER BY snd.sent_at DESC;
```

## Troubleshooting

### Messages Not Sending
1. Verify webhook URL is correct
2. Check configuration is active
3. Ensure Slack app has permissions
4. Review error_message in slack_notification_deliveries

### Wrong Channel
1. Check channel mappings for alert severity
2. Verify default channel is set
3. Ensure channel exists in Slack workspace

### Test Message Fails
1. Verify webhook URL hasn't expired
2. Check Slack app is still installed
3. Ensure channel exists and bot has access

## Security Considerations

1. **Webhook URL Protection**: Store webhook URLs securely
2. **RLS Policies**: Only admins can manage configurations
3. **Sensitive Data**: Avoid sending sensitive data in alert messages
4. **Rate Limiting**: Slack has rate limits on incoming webhooks

## Best Practices

1. **Separate Channels**: Use different channels for different severities
2. **Descriptive Names**: Use clear configuration names
3. **Test Regularly**: Periodically test Slack integrations
4. **Monitor Deliveries**: Check delivery status for failed notifications
5. **Update Webhooks**: Rotate webhook URLs periodically for security

## Integration with Alert Rules

When creating alert rules in the WebhookAlertRuleManager:
1. Set notification channels to include "slack"
2. Configure appropriate severity level
3. Slack notifications will be sent automatically when conditions are met

## API Reference

### Test Slack Webhook (Frontend)
```typescript
const response = await fetch(config.webhook_url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    channel: config.default_channel,
    text: 'Test notification',
    blocks: [/* Slack block kit format */]
  })
});
```

### Query Slack Configurations
```typescript
const { data } = await supabase
  .from('slack_configurations')
  .select('*')
  .eq('is_active', true);
```

## Future Enhancements

- Interactive Slack buttons for alert resolution
- Slack slash commands for webhook management
- Thread replies for alert updates
- Slack workflow integration
- Custom message templates
- Alert aggregation to reduce noise
