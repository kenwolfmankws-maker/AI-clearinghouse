# Webhook Rate Limiting Guide

## Overview
Rate limiting protects your webhook endpoints from being overwhelmed by controlling the maximum number of deliveries within a time window.

## Features
- Configurable rate limits per webhook
- Automatic throttling when limits exceeded
- Rate limit violation tracking for audit purposes
- Real-time usage monitoring
- Visual status indicators

## Database Setup

Run the SQL in `DATABASE_RATE_LIMITING_SETUP.sql`:

```sql
-- Adds rate_limit_enabled, rate_limit_max_requests, rate_limit_window_minutes
-- Creates webhook_rate_limit_violations table
```

## Configuration

### Enable Rate Limiting
1. Navigate to Analytics → Webhook Integration
2. Create or edit a webhook
3. Toggle "Enable Rate Limiting"
4. Set max requests (default: 100)
5. Set time window in minutes (default: 60)

### Example Configurations
- **Low Traffic**: 50 requests per 60 minutes
- **Medium Traffic**: 100 requests per 60 minutes
- **High Traffic**: 500 requests per 60 minutes
- **Burst Protection**: 10 requests per 5 minutes

## How It Works

1. **Request Counting**: System counts deliveries within the time window
2. **Limit Check**: Before each delivery, checks if limit is reached
3. **Throttling**: Returns 429 error if limit exceeded
4. **Violation Logging**: Records all violations in database
5. **Auto-Reset**: Counter resets after time window expires

## Rate Limit Status

The RateLimitStatus component shows:
- Current usage vs limit
- Usage percentage with color coding
- Recent violations
- Health status indicators

### Status Colors
- 🟢 Green (0-69%): Healthy
- 🟡 Yellow (70-89%): Warning
- 🔴 Red (90-100%): Critical

## API Response

When rate limit is exceeded:

```json
{
  "error": "Rate limit exceeded",
  "requestsInWindow": 105,
  "maxRequests": 100,
  "windowMinutes": 60
}
```

HTTP Status: 429 Too Many Requests

## Monitoring

### View Violations
Check the `webhook_rate_limit_violations` table:

```sql
SELECT * FROM webhook_rate_limit_violations
WHERE webhook_id = 'your-webhook-id'
ORDER BY violation_time DESC;
```

### Usage Metrics
- Real-time usage displayed in webhook cards
- Auto-refresh every 30 seconds
- Historical violation data

## Best Practices

1. **Set Realistic Limits**: Base on expected traffic patterns
2. **Monitor Usage**: Check status regularly
3. **Adjust as Needed**: Increase limits for legitimate high traffic
4. **Alert on Violations**: Set up notifications for repeated violations
5. **Review Logs**: Analyze violation patterns

## Troubleshooting

### High Violation Rate
- Increase rate limits
- Extend time window
- Check for unnecessary webhook triggers
- Implement request batching

### False Positives
- Verify time window is appropriate
- Check for traffic spikes
- Consider separate webhooks for different event types

## Security Benefits

- Prevents abuse and DoS attacks
- Protects downstream services
- Controls costs for metered APIs
- Ensures fair resource usage
- Maintains system stability
