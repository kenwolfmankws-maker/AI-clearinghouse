# Webhook Alert Rules System Guide

## Overview
The Webhook Alert Rules system provides intelligent monitoring and alerting for webhook failures, allowing admins to set custom thresholds and receive instant notifications when webhook performance degrades.

## Features

### 1. Alert Rule Configuration
- **Condition Types**:
  - Failure Rate (%): Alert when failure percentage exceeds threshold
  - Average Response Time (ms): Alert when response time is too slow
  - Consecutive Failures: Alert after N consecutive failed deliveries
  - Total Failures: Alert when total failures exceed threshold

- **Customizable Parameters**:
  - Threshold value
  - Time window (minutes)
  - Webhook type filter (optional)
  - Endpoint URL filter (optional)
  - Critical alert flag
  - Notification channels (email, Slack)

### 2. Alert History
- View all triggered alerts
- Track resolution status
- Add resolution notes
- Filter by status (pending/resolved)
- View critical alerts separately

### 3. Alert Snoozing
- Temporarily disable alerts
- Set snooze duration
- Add snooze reason
- Automatic re-enabling after snooze period

### 4. Notification Channels
- Email notifications via Resend
- Slack integration (coming soon)
- Critical alert escalation
- Customizable alert templates

## Database Schema

### webhook_alert_rules
```sql
- id: UUID (primary key)
- name: TEXT (rule name)
- description: TEXT
- webhook_type: TEXT (optional filter)
- endpoint_url: TEXT (optional filter)
- condition_type: TEXT (failure_rate, response_time, consecutive_failures, total_failures)
- threshold_value: NUMERIC
- time_window_minutes: INTEGER
- notification_channels: JSONB
- is_critical: BOOLEAN
- is_enabled: BOOLEAN
- created_by: UUID
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### webhook_alert_history
```sql
- id: UUID (primary key)
- alert_rule_id: UUID (foreign key)
- triggered_at: TIMESTAMPTZ
- condition_met: TEXT
- actual_value: NUMERIC
- threshold_value: NUMERIC
- affected_deliveries: INTEGER
- notification_sent: BOOLEAN
- notification_channels: JSONB
- resolved_at: TIMESTAMPTZ
- resolved_by: UUID
- resolution_notes: TEXT
```

### webhook_alert_snoozes
```sql
- id: UUID (primary key)
- alert_rule_id: UUID (foreign key)
- snoozed_until: TIMESTAMPTZ
- snoozed_by: UUID
- reason: TEXT
- created_at: TIMESTAMPTZ
```

## Usage Examples

### Example 1: High Failure Rate Alert
```
Name: "Critical Failure Rate Alert"
Condition: Failure Rate
Threshold: 10%
Time Window: 60 minutes
Critical: Yes
Channels: Email, Slack
```

### Example 2: Slow Response Time Alert
```
Name: "Slow Webhook Response"
Condition: Average Response Time
Threshold: 5000ms
Time Window: 30 minutes
Critical: No
Channels: Email
```

### Example 3: Consecutive Failures
```
Name: "Endpoint Down Detection"
Condition: Consecutive Failures
Threshold: 5
Endpoint: https://api.example.com/webhook
Critical: Yes
Channels: Email, Slack
```

## Best Practices

1. **Start Conservative**: Begin with higher thresholds and adjust based on actual patterns
2. **Use Time Windows**: Set appropriate time windows to avoid false positives
3. **Critical Alerts**: Reserve critical flag for truly urgent situations
4. **Endpoint-Specific Rules**: Create rules for critical endpoints
5. **Regular Review**: Review alert history to tune thresholds
6. **Resolution Notes**: Always document how issues were resolved

## Monitoring Dashboard

Access the alert system via:
1. Navigate to Webhook Manager
2. Click "Alert Rules" tab to configure rules
3. Click "Alert History" tab to view triggered alerts
4. Use snooze functionality for planned maintenance

## Troubleshooting

### Alerts Not Triggering
- Verify rule is enabled
- Check if alert is snoozed
- Confirm threshold values are correct
- Review time window settings

### Too Many Alerts
- Increase threshold values
- Extend time windows
- Add endpoint filters
- Use snooze during maintenance

### Email Notifications Not Sending
- Verify Resend API key is configured
- Check email addresses in notification settings
- Review edge function logs

## Future Enhancements
- Slack integration
- SMS notifications via Twilio
- Escalation policies
- Alert grouping
- Custom notification templates
- Webhook health score
