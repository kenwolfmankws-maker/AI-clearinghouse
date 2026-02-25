# Webhook Analytics Export & Reporting Guide

This guide covers the webhook analytics export functionality, scheduled reports, and performance monitoring features.

## Features Overview

### 1. Analytics Dashboard
- **Delivery Trends**: Line chart showing successful vs failed deliveries over 30 days
- **Peak Usage Hours**: Bar chart displaying webhook activity by hour of day
- **Export Options**: Download analytics data in CSV or JSON format
- **Custom Filters**: Filter by date range, webhook type, status, and endpoint

### 2. Data Export
- **CSV Format**: Spreadsheet-compatible format for Excel/Google Sheets
- **JSON Format**: Structured data for programmatic analysis
- **Filtered Exports**: Apply filters before exporting
- **Instant Download**: Client-side file generation

### 3. Scheduled Reports
- **Email Delivery**: Automated reports sent via email
- **Frequency Options**: Daily, weekly, or monthly schedules
- **Multiple Recipients**: Send to multiple email addresses
- **Format Selection**: Choose CSV or JSON attachment format

## Database Schema

### scheduled_webhook_reports
```sql
- id: UUID (Primary Key)
- name: VARCHAR(255) - Report name
- frequency: VARCHAR(20) - 'daily', 'weekly', 'monthly'
- recipient_emails: TEXT[] - Array of email addresses
- filters: JSONB - Report filter configuration
- format: VARCHAR(10) - 'csv' or 'json'
- enabled: BOOLEAN - Active status
- last_sent_at: TIMESTAMPTZ - Last execution time
- next_scheduled_at: TIMESTAMPTZ - Next scheduled run
- created_by: UUID - User who created report
```

### webhook_report_executions
```sql
- id: UUID (Primary Key)
- report_id: UUID - Reference to scheduled report
- status: VARCHAR(20) - 'success' or 'failed'
- records_included: INTEGER - Number of records in report
- error_message: TEXT - Error details if failed
- executed_at: TIMESTAMPTZ - Execution timestamp
```

## Analytics Functions

### get_webhook_analytics()
Retrieves webhook delivery data with filters:
```sql
SELECT * FROM get_webhook_analytics(
  start_date := '2024-01-01',
  end_date := NOW(),
  webhook_type_filter := 'test_complete',
  status_filter := 'delivered',
  endpoint_filter := 'https://example.com/webhook'
);
```

### get_webhook_hourly_patterns()
Returns delivery patterns by hour:
```sql
SELECT * FROM get_webhook_hourly_patterns(days_back := 7);
```

### get_webhook_daily_trends()
Returns daily delivery statistics:
```sql
SELECT * FROM get_webhook_daily_trends(days_back := 30);
```

## Using the Analytics Dashboard

### Accessing Analytics
1. Navigate to Organization page
2. Click "Webhooks" tab
3. Select "Analytics" sub-tab

### Exporting Data
1. **Apply Filters** (optional):
   - Set date range
   - Select webhook type
   - Choose status (delivered/failed)
   - Filter by endpoint URL

2. **Export**:
   - Click "Export CSV" for spreadsheet format
   - Click "Export JSON" for structured data
   - File downloads automatically

### Viewing Charts
- **Delivery Trends**: Shows success/failure trends over time
- **Peak Hours**: Identifies busiest hours for webhook activity
- **Interactive**: Hover for detailed metrics

## Scheduled Reports

### Creating a Report
1. Go to "Reports" tab in Webhook Manager
2. Click "New Report"
3. Configure:
   - **Name**: Descriptive report name
   - **Frequency**: Daily, weekly, or monthly
   - **Recipients**: Comma-separated email addresses
   - **Format**: CSV or JSON

4. Click "Create Report"

### Managing Reports
- **Enable/Disable**: Toggle report active status
- **Delete**: Remove scheduled report
- **View Status**: See last sent time and next scheduled run

### Report Content
Each report includes:
- Webhook delivery statistics
- Success/failure rates
- Response times
- Error details
- Time period covered (last 7 days)

## Edge Function: send-webhook-report

### Automatic Execution
The `send-webhook-report` function runs automatically to:
1. Check for scheduled reports due to run
2. Generate analytics data
3. Format as CSV or JSON
4. Send via email with attachment
5. Update next scheduled time
6. Log execution status

### Manual Testing
```typescript
const { data, error } = await supabase.functions.invoke('send-webhook-report');
```

## Setting Up Cron Job

### Using pg_cron (Recommended)
```sql
-- Run every hour to check for scheduled reports
SELECT cron.schedule(
  'send-webhook-reports',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/send-webhook-report',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

### Using External Cron
Set up a cron job to call the edge function:
```bash
0 * * * * curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/send-webhook-report \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Email Configuration

Reports are sent using Resend API. Ensure:
1. `VITE_RESEND_API_KEY` is configured in Supabase secrets
2. Sender domain is verified in Resend
3. Update sender email in edge function:
   ```typescript
   from: 'Webhook Reports <noreply@yourdomain.com>'
   ```

## Analytics Metrics

### Available Metrics
- **Total Deliveries**: All webhook delivery attempts
- **Success Rate**: Percentage of successful deliveries
- **Failure Rate**: Percentage of failed deliveries
- **Average Response Time**: Mean webhook response time
- **Retry Rate**: Percentage requiring retries
- **Hourly Patterns**: Deliveries by hour of day
- **Daily Trends**: Day-by-day statistics

### Filtering Options
- **Date Range**: Custom start and end dates
- **Webhook Type**: Filter by event type
- **Status**: delivered, failed, pending, retrying
- **Endpoint**: Filter by webhook URL

## Best Practices

### Report Scheduling
- **Daily Reports**: For high-volume webhooks
- **Weekly Reports**: For moderate activity
- **Monthly Reports**: For low-volume or summary reports

### Data Retention
- Keep at least 30 days of webhook delivery data
- Archive older data for long-term analysis
- Regular cleanup of old report executions

### Performance
- Use date range filters for large datasets
- Export during off-peak hours
- Limit recipient list to necessary stakeholders

## Troubleshooting

### Reports Not Sending
1. Check `webhook_report_executions` for errors
2. Verify Resend API key is configured
3. Confirm recipient emails are valid
4. Check edge function logs

### Missing Data in Reports
1. Verify webhook deliveries exist in database
2. Check date range filters
3. Ensure analytics functions are working:
   ```sql
   SELECT * FROM get_webhook_analytics();
   ```

### Export Issues
1. Check browser console for errors
2. Verify data exists for selected filters
3. Try different export format

## Security Considerations

### Access Control
- Only admins can create/manage scheduled reports
- RLS policies enforce admin-only access
- Report data filtered by organization

### Email Security
- Use verified sender domains
- Validate recipient email addresses
- Include unsubscribe mechanism for compliance

### Data Privacy
- Limit sensitive data in reports
- Use secure email transmission
- Consider encryption for sensitive webhooks

## Monitoring

### Track Report Health
```sql
-- Check recent report executions
SELECT 
  sr.name,
  sre.status,
  sre.records_included,
  sre.executed_at
FROM webhook_report_executions sre
JOIN scheduled_webhook_reports sr ON sr.id = sre.report_id
ORDER BY sre.executed_at DESC
LIMIT 20;
```

### Success Rate
```sql
-- Calculate report success rate
SELECT 
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate
FROM webhook_report_executions
WHERE executed_at >= NOW() - INTERVAL '7 days';
```

## Next Steps

1. **Set up scheduled reports** for key stakeholders
2. **Configure cron job** for automatic report sending
3. **Monitor report executions** for failures
4. **Export historical data** for trend analysis
5. **Customize report content** based on needs
