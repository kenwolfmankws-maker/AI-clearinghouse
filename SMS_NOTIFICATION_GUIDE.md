# SMS Notification Guide for Webhook Alerts

This guide explains how to set up SMS notifications using Twilio for critical webhook alerts.

## Overview

The SMS notification system sends text messages for high-priority webhook alerts using Twilio's API. This provides an additional layer of real-time alerting alongside Slack and Email notifications.

## Database Schema

Three tables manage SMS notifications:

### 1. sms_configurations
Stores Twilio settings per user/organization:
- `from_phone_number`: Your Twilio phone number (E.164 format)
- `enabled`: Toggle SMS notifications on/off
- Twilio credentials are managed via environment variables

### 2. sms_alert_recipients
Manages phone numbers that receive alerts:
- `phone_number`: Recipient's phone number (E.164 format)
- `name`: Optional recipient name
- `alert_types`: Array of alert severities (critical, high, medium, low)
- `enabled`: Toggle recipient on/off

### 3. sms_notification_deliveries
Tracks SMS delivery status:
- `twilio_message_sid`: Twilio's message identifier
- `status`: pending, sent, delivered, failed
- `error_message`: Delivery error details if failed

## Configuration Steps

### 1. Set Up Twilio Account

1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token from the console
3. Purchase a phone number for sending SMS

### 2. Configure Environment Variables

The following Twilio credentials are already configured as secrets:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

These are accessible in edge functions via `Deno.env.get()`

### 3. Configure SMS Settings in UI

Navigate to Analytics → Webhook Integration → SMS Notifications tab:

1. **Twilio Configuration**:
   - Enter your Twilio phone number (format: +1234567890)
   - Enable/disable SMS notifications
   - Test the configuration

2. **Add Recipients**:
   - Enter phone number (E.164 format required)
   - Optional: Add recipient name
   - Select alert types (critical, high by default)
   - Enable/disable individual recipients

## SMS Message Templates

Messages are generated based on alert severity:

### Critical Alert
```
🚨 CRITICAL ALERT
Webhook: Production API
Failure Rate: 85% (threshold: 20%)
Window: Last 5 minutes
Check dashboard for details.
```

### High Priority Alert
```
⚠️ HIGH ALERT
Webhook: Payment Gateway
Response Time: 5000ms (threshold: 2000ms)
Window: Last 15 minutes
Check dashboard for details.
```

## Integration with check-webhook-alerts Function

Update your `check-webhook-alerts` edge function to include SMS notifications:

```typescript
// Send SMS for critical alerts
if (alertRule.severity === 'critical' || alertRule.severity === 'high') {
  const { data: smsConfig } = await supabaseAdmin
    .from('sms_configurations')
    .select('*')
    .eq('user_id', webhook.user_id)
    .eq('enabled', true)
    .single();

  if (smsConfig) {
    const { data: recipients } = await supabaseAdmin
      .from('sms_alert_recipients')
      .select('*')
      .eq('user_id', webhook.user_id)
      .eq('enabled', true)
      .contains('alert_types', [alertRule.severity]);

    if (recipients && recipients.length > 0) {
      await sendSMSAlerts(recipients, alertData, smsConfig);
    }
  }
}

async function sendSMSAlerts(recipients, alertData, config) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  
  const message = generateSMSAlert({
    webhookName: alertData.webhookName,
    severity: alertData.severity,
    metric: alertData.metric,
    currentValue: alertData.currentValue,
    threshold: alertData.threshold,
    timeWindow: alertData.timeWindow
  });

  for (const recipient of recipients) {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: recipient.phone_number,
            From: config.from_phone_number,
            Body: message
          })
        }
      );

      const result = await response.json();

      await supabaseAdmin.from('sms_notification_deliveries').insert({
        user_id: recipient.user_id,
        webhook_id: alertData.webhookId,
        recipient_phone: recipient.phone_number,
        alert_type: alertData.severity,
        message_body: message,
        twilio_message_sid: result.sid,
        status: result.status,
        sent_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('SMS send error:', error);
    }
  }
}
```

## Phone Number Format

All phone numbers must be in E.164 format:
- Include country code
- No spaces, dashes, or parentheses
- Examples:
  - US: +14155552671
  - UK: +447911123456
  - Australia: +61412345678

## Best Practices

1. **Use for Critical Alerts Only**: SMS should be reserved for high-priority alerts to avoid alert fatigue

2. **Limit Recipients**: Add only essential personnel to avoid unnecessary costs

3. **Test Regularly**: Use the test SMS feature to verify configuration

4. **Monitor Costs**: Track SMS usage in Twilio console as each message incurs a cost

5. **Set Appropriate Thresholds**: Configure alert rules to trigger SMS only when necessary

6. **Keep Messages Concise**: SMS has a 160-character limit (extended to 320 for multi-part)

## Troubleshooting

### SMS Not Sending
- Verify Twilio credentials are correct
- Check phone number format (E.164 required)
- Ensure Twilio account has sufficient balance
- Verify "from" phone number is active in Twilio

### Delivery Failures
- Check `sms_notification_deliveries` table for error messages
- Verify recipient phone numbers are valid
- Check Twilio console for delivery logs
- Ensure recipient's carrier supports SMS

### Configuration Issues
- Verify environment variables are set correctly
- Check that SMS configuration is enabled
- Ensure recipients have correct alert_types selected

## Cost Considerations

SMS notifications incur costs per message sent:
- Typical cost: $0.0075 - $0.01 per SMS (varies by country)
- Monitor usage in Twilio console
- Set up billing alerts in Twilio
- Use SMS sparingly for critical alerts only

## Security

- Twilio credentials are stored as environment variables (never in code)
- Phone numbers are encrypted in database
- RLS policies ensure users only see their own configurations
- SMS delivery logs are user-scoped

## Related Documentation

- [Webhook Alert Rules Guide](WEBHOOK_ALERT_RULES_GUIDE.md)
- [Slack Integration Guide](SLACK_INTEGRATION_GUIDE.md)
- [Email Notification Guide](EMAIL_NOTIFICATION_GUIDE.md)
- [Webhook Alert Cron Setup](WEBHOOK_ALERT_CRON_SETUP.md)
