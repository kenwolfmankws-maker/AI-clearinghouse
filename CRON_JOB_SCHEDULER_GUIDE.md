# Automated Cron Job Scheduler Guide

## Overview
This guide explains the automated cron job scheduling system for sending 2FA reminder emails. The system runs daily at 9:00 AM UTC and tracks execution history, success rates, and provides manual triggering capabilities.

## Database Schema

### cron_job_executions Table
Tracks all cron job executions with detailed metrics:

```sql
- id: UUID (Primary Key)
- job_name: TEXT (e.g., 'send-2fa-reminders')
- started_at: TIMESTAMPTZ (Execution start time)
- completed_at: TIMESTAMPTZ (Execution completion time)
- status: TEXT ('running', 'success', 'failed')
- execution_time_ms: INTEGER (Duration in milliseconds)
- records_processed: INTEGER (Number of reminders sent)
- records_failed: INTEGER (Number of failed sends)
- error_message: TEXT (Error details if failed)
- metadata: JSONB (Additional execution data)
```

## Database Functions

### get_cron_job_stats()
Returns comprehensive statistics for a cron job:

```sql
SELECT * FROM get_cron_job_stats('send-2fa-reminders', 30);
```

Returns:
- total_executions: Total runs in period
- successful_executions: Successful runs
- failed_executions: Failed runs
- success_rate: Percentage of successful runs
- avg_execution_time_ms: Average duration
- last_execution_time: Most recent run timestamp
- last_execution_status: Status of last run
- next_scheduled_time: Next scheduled execution (9 AM UTC)

### trigger_2fa_reminder_job()
Manually trigger the 2FA reminder job (admin only):

```sql
SELECT trigger_2fa_reminder_job();
```

## Edge Function Integration

The `send-2fa-reminders` edge function automatically logs execution data:

1. **Start**: Creates execution record with 'running' status
2. **Processing**: Sends reminders and tracks success/failure counts
3. **Completion**: Updates record with final status, duration, and metrics
4. **Error Handling**: Logs error messages if job fails

## Cron Job Dashboard

### Features

**Statistics Cards:**
- Success Rate: Percentage of successful executions
- Average Duration: Mean execution time
- Last Run: Most recent execution time and status
- Next Run: Next scheduled execution (9 AM UTC daily)

**Execution History Table:**
- Status badges (success/failed/running)
- Start time and duration
- Records processed and failed
- Error messages for failed runs
- Last 10 executions displayed

**Manual Trigger:**
- Button to manually run the job for testing
- Real-time feedback on execution results
- Auto-refresh after manual trigger

### Usage

Navigate to: **Organization → Security Tab → Cron Job Dashboard**

The dashboard auto-refreshes every 30 seconds to show real-time status.

## Scheduling Configuration

### Current Schedule
- **Frequency**: Daily
- **Time**: 9:00 AM UTC
- **Method**: Supabase pg_cron extension

### Modifying Schedule

To change the schedule, update the cron expression in your database:

```sql
-- Run every 6 hours
SELECT cron.schedule(
  'send-2fa-reminders-daily',
  '0 */6 * * *',
  $$ ... $$
);

-- Run at 2 AM UTC daily
SELECT cron.schedule(
  'send-2fa-reminders-daily',
  '0 2 * * *',
  $$ ... $$
);
```

## Monitoring & Alerts

### Success Rate Monitoring
Monitor the success rate in the dashboard. If it drops below 95%:
1. Check execution logs for error patterns
2. Verify Resend API key is valid
3. Check database connectivity
4. Review email template rendering

### Performance Monitoring
Track average execution time:
- Normal: < 5 seconds for small orgs
- Warning: > 30 seconds
- Critical: > 60 seconds

### Failed Execution Alerts
When executions fail:
1. Error message logged in cron_job_executions
2. Check error_message field for details
3. Common issues:
   - API key expired
   - Database connection timeout
   - Email service rate limits

## Manual Testing

### Test the Job
1. Navigate to Organization → Security → Cron Job Dashboard
2. Click "Manual Trigger" button
3. Wait for completion notification
4. Review execution log in the table
5. Verify reminders were sent (check two_factor_reminders_sent table)

### Verify Reminders Sent

```sql
SELECT * FROM two_factor_reminders_sent
ORDER BY sent_at DESC
LIMIT 10;
```

## Troubleshooting

### Job Not Running
1. Verify pg_cron extension is enabled
2. Check cron schedule exists:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'send-2fa-reminders-daily';
   ```
3. Review Supabase logs for errors

### No Reminders Sent
1. Check if users need reminders:
   ```sql
   SELECT * FROM get_users_needing_2fa_reminders();
   ```
2. Verify reminder config is enabled
3. Check Resend API key environment variable

### High Failure Rate
1. Review error messages in execution logs
2. Check API rate limits
3. Verify database permissions
4. Test edge function manually

## Best Practices

1. **Monitor Regularly**: Check dashboard weekly for anomalies
2. **Test After Changes**: Manual trigger after config updates
3. **Review Logs**: Investigate any failed executions promptly
4. **Backup Schedule**: Consider redundant scheduling methods
5. **Alert Setup**: Configure monitoring alerts for critical failures
6. **Performance Optimization**: Batch process large user sets
7. **Rate Limiting**: Respect email service rate limits

## Security Considerations

1. **Access Control**: Only admins can view execution logs
2. **Manual Triggers**: Restricted to admin users
3. **API Keys**: Stored securely as environment variables
4. **Audit Trail**: All executions logged permanently
5. **Error Exposure**: Error messages sanitized in UI

## Integration with Other Systems

### Webhook Integration
Trigger webhooks on job completion:

```typescript
// In edge function
await fetch(webhookUrl, {
  method: 'POST',
  body: JSON.stringify({
    job: 'send-2fa-reminders',
    status: 'success',
    metrics: { sent, failed }
  })
});
```

### Monitoring Services
Export metrics to external monitoring:
- Datadog
- New Relic
- Prometheus

## Future Enhancements

Potential improvements:
1. Multiple scheduling times per day
2. Timezone-aware scheduling per organization
3. Retry logic for failed sends
4. Email delivery tracking
5. Advanced analytics and reporting
6. Predictive failure detection
7. Auto-scaling based on user count
