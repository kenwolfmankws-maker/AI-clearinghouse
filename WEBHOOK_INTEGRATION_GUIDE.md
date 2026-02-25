# Webhook Integration System Guide

## Overview
The webhook integration system allows you to send A/B test results and alerts to external services like Slack, Discord, Microsoft Teams, or custom webhooks.

## Features
- **Multi-Service Support**: Slack, Discord, Microsoft Teams, and custom webhooks
- **Event Triggers**: Test completion, alerts, test start, variant winner detection
- **Retry Logic**: Automatic retry with exponential backoff
- **Delivery Tracking**: Complete history of webhook deliveries with status
- **Custom Payloads**: Customize webhook payload format
- **Test Webhooks**: Send test messages to verify configuration

## Setup

### 1. Database Setup
Run the SQL setup script:
```bash
psql -h your-db-host -U postgres -d postgres -f DATABASE_WEBHOOK_INTEGRATION_SETUP.sql
```

### 2. Deploy Edge Function
```bash
supabase functions deploy send-webhook
```

## Configuration

### Creating a Webhook

1. Navigate to Analytics > Webhooks
2. Click "Add Webhook"
3. Fill in the configuration:
   - **Name**: Descriptive name for the webhook
   - **Service Type**: Choose from Slack, Discord, Teams, or Custom
   - **Webhook URL**: The endpoint URL from your service
   - **Events**: Select which events trigger the webhook
   - **Retry Logic**: Enable/disable automatic retries
   - **Max Retries**: Number of retry attempts (1-10)

### Service-Specific Setup

#### Slack
1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Enable "Incoming Webhooks"
4. Add webhook to workspace
5. Copy the webhook URL
6. Paste into AI Clearinghouse webhook configuration

#### Discord
1. Open Discord server settings
2. Go to Integrations > Webhooks
3. Create a new webhook
4. Copy the webhook URL
5. Paste into AI Clearinghouse webhook configuration

#### Microsoft Teams
1. Open Teams channel
2. Click "..." > Connectors
3. Configure "Incoming Webhook"
4. Provide a name and upload image
5. Copy the webhook URL
6. Paste into AI Clearinghouse webhook configuration

#### Custom Webhooks
For custom endpoints:
- URL must accept POST requests
- Content-Type: application/json
- Return 2xx status code for success
- Implement idempotency for retries

## Event Types

### test_complete
Triggered when an A/B test completes.
```json
{
  "event": "test_complete",
  "test_id": "uuid",
  "test_name": "Email Subject Test",
  "winner": "Variant B",
  "confidence": 95.5,
  "improvement": 12.3,
  "completed_at": "2025-10-31T23:00:00Z"
}
```

### alert_triggered
Triggered when performance alert fires.
```json
{
  "event": "alert_triggered",
  "alert_type": "underperformance",
  "test_id": "uuid",
  "variant": "Variant A",
  "metric": "open_rate",
  "threshold": 10.0,
  "actual": 5.2,
  "severity": "high"
}
```

### test_started
Triggered when scheduled test begins.
```json
{
  "event": "test_started",
  "test_id": "uuid",
  "test_name": "New Campaign Test",
  "variants": ["Control", "Variant A", "Variant B"],
  "started_at": "2025-10-31T23:00:00Z"
}
```

### variant_winner
Triggered when statistical significance is reached.
```json
{
  "event": "variant_winner",
  "test_id": "uuid",
  "winner": "Variant B",
  "confidence": 99.2,
  "sample_size": 10000,
  "detected_at": "2025-10-31T23:00:00Z"
}
```

## Retry Logic

### How It Works
1. Initial delivery attempt
2. If failed and retry enabled:
   - Wait with exponential backoff
   - Retry up to max_retries times
   - Backoff: 1min, 2min, 4min, 8min, etc.
3. Mark as failed after max retries

### Retry Triggers
- Network errors
- Timeout (default 30s)
- HTTP 5xx errors
- Connection refused

### Non-Retry Scenarios
- HTTP 4xx errors (client errors)
- Invalid webhook configuration
- Webhook disabled

## Delivery Status

### Status Types
- **Pending**: Queued for delivery
- **Success**: Delivered successfully (2xx response)
- **Failed**: All retry attempts exhausted
- **Retrying**: Waiting for next retry attempt

### Viewing Delivery History
1. Go to Analytics > Webhooks
2. Click "Delivery History" tab
3. View status, attempts, and error messages
4. Filter by status or date range

## Testing Webhooks

### Test Delivery
1. Find webhook in list
2. Click the send icon
3. Check delivery history for results
4. Verify message in destination service

### Test Payload
```json
{
  "event": "test",
  "message": "This is a test webhook from AI Clearinghouse",
  "timestamp": "2025-10-31T23:00:00Z"
}
```

## Best Practices

### Security
- Use HTTPS URLs only
- Rotate webhook URLs periodically
- Implement webhook signature verification
- Limit webhook permissions in services

### Performance
- Keep webhook endpoints fast (<5s)
- Return 2xx immediately, process async
- Implement rate limiting on your end
- Monitor webhook delivery rates

### Reliability
- Enable retry logic for critical webhooks
- Set appropriate timeout values
- Monitor delivery success rates
- Set up alerts for webhook failures

### Payload Customization
- Keep payloads small (<100KB)
- Include only necessary data
- Use consistent field naming
- Document your webhook format

## Troubleshooting

### Webhook Not Firing
- Check webhook is enabled
- Verify event is selected in configuration
- Check test/alert actually triggered
- Review delivery history for errors

### Delivery Failures
- Verify webhook URL is correct
- Check destination service is online
- Review timeout settings
- Check for rate limiting

### Slack-Specific Issues
- Ensure app has correct permissions
- Verify webhook URL hasn't expired
- Check channel still exists
- Review Slack API rate limits

### Discord-Specific Issues
- Verify webhook hasn't been deleted
- Check bot has channel permissions
- Review Discord rate limits (30 req/min)
- Ensure server is accessible

## API Integration

### Triggering Webhooks Programmatically
```typescript
import { supabase } from '@/lib/supabase';

// Trigger all webhooks for an event
await supabase.rpc('trigger_webhooks', {
  p_event_type: 'test_complete',
  p_payload: {
    test_id: 'uuid',
    test_name: 'My Test',
    winner: 'Variant B'
  }
});
```

### Direct Webhook Call
```typescript
const { data, error } = await supabase.functions.invoke('send-webhook', {
  body: {
    webhookId: 'webhook-uuid',
    eventType: 'test_complete',
    payload: { /* your data */ }
  }

  }
});
```



## Automated Retry System

### Scheduled Retry Function
The system includes an automated edge function that runs periodically to retry failed webhook deliveries.

#### How It Works
1. **Scheduled Execution**: Runs every 15 minutes via cron job
2. **Exponential Backoff**: Waits 2^retry_count minutes between attempts
3. **Automatic Cleanup**: Removes delivery logs older than 30 days
4. **Smart Retry**: Only retries deliveries that have reached their backoff time

#### Deployment
```bash
supabase functions deploy retry-failed-webhooks
```

#### Configure Cron Schedule
Set up a cron job or scheduled task to invoke the function:
```bash
# Example: Every 15 minutes
*/15 * * * * curl -X POST https://your-project.supabase.co/functions/v1/retry-failed-webhooks \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Or use Supabase's built-in cron functionality in your database:
```sql
-- Create cron job (requires pg_cron extension)
SELECT cron.schedule(
  'retry-failed-webhooks',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/retry-failed-webhooks',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

#### Retry Behavior
- **Backoff Schedule**:
  - Retry 1: 2 minutes after failure
  - Retry 2: 4 minutes after retry 1
  - Retry 3: 8 minutes after retry 2
  - Retry 4: 16 minutes after retry 3
  - Retry 5: 32 minutes after retry 4
- **Max Retries**: 5 attempts total
- **Final Status**: Marked as "failed" after max retries

#### Monitoring Retry Results
The function returns execution results:
```json
{
  "success": true,
  "results": {
    "processed": 15,
    "succeeded": 12,
    "failed": 2,
    "skipped": 1,
    "cleaned": 234
  }
}
```

## Health Metrics Dashboard

### Overview
The Health Metrics tab provides real-time insights into webhook performance and reliability.

### Key Metrics

#### Success Rate
- **Description**: Percentage of successful deliveries
- **Calculation**: (Successful deliveries / Total deliveries) × 100
- **Target**: > 95%
- **Action**: If < 95%, review webhook configurations and destination service health

#### Average Delivery Time
- **Description**: Mean time for webhook delivery
- **Calculation**: Average of all delivery_time_ms values
- **Target**: < 2000ms (2 seconds)
- **Action**: If > 5000ms, check destination service performance

#### Retry Rate
- **Description**: Percentage of deliveries requiring retry
- **Calculation**: (Deliveries with retry_count > 0 / Total deliveries) × 100
- **Target**: < 10%
- **Action**: If > 20%, investigate network issues or service reliability

#### Failure Rate
- **Description**: Percentage of permanently failed deliveries
- **Calculation**: (Failed deliveries / Total deliveries) × 100
- **Target**: < 5%
- **Action**: If > 5%, review webhook URLs and configurations

#### Last 24 Hours
- **Description**: Recent delivery activity
- **Shows**: Total deliveries, successes, and failures in past 24 hours
- **Use**: Quick health check and trend monitoring

#### Total Deliveries
- **Description**: All-time webhook delivery count
- **Use**: Overall system usage tracking

### Alerts

#### High Failure Rate Alert
Automatically displayed when failure rate exceeds 20%:
- **Trigger**: Failure rate > 20%
- **Severity**: High
- **Recommendation**: Check webhook URLs and service configurations
- **Actions**:
  1. Review recent failed deliveries
  2. Test webhooks individually
  3. Verify destination services are online
  4. Check for expired or invalid webhook URLs

### Using Health Metrics

#### Daily Monitoring
1. Check success rate (should be > 95%)
2. Review last 24 hours activity
3. Monitor for alerts
4. Investigate any anomalies

#### Performance Optimization
1. Identify slow webhooks (high avg delivery time)
2. Review high retry rate webhooks
3. Disable or fix consistently failing webhooks
4. Optimize payload sizes for faster delivery

#### Troubleshooting
1. Filter deliveries by status in Delivery History
2. Review error messages for failed deliveries
3. Check response codes and bodies
4. Test webhooks after configuration changes

## Monitoring

### Key Metrics
- Delivery success rate
- Average delivery time
- Retry rate
- Failed deliveries
- Last 24 hours activity

### Alerts
Set up monitoring for:
- Success rate < 95%
- Average delivery time > 5s
- Failed deliveries > 10/hour
- Retry rate > 20%

### Health Dashboard
Access the Health Metrics tab to view:
- Real-time performance metrics
- 24-hour activity trends
- Automatic alerts for issues
- Overall system health

## Support
For issues or questions:
- Check delivery history for error messages
- Review health metrics dashboard
- Review service-specific documentation
- Test with simple custom webhook first
- Contact support with webhook ID and error details
