# Scheduled Email Reports Guide

## Overview
The AI Clearinghouse platform supports automated scheduled email reports for invitation template analytics with advanced customization options. Admins can configure recurring reports with custom metrics, date ranges, and delivery preferences.

## Database Setup

Run the SQL file to create the necessary table:
```sql
-- See DATABASE_SCHEDULED_REPORTS_SETUP.sql
```

This creates the `scheduled_reports` table with fields for:
- Report name, description, and custom email subject
- Frequency (daily, weekly, monthly)
- Format (CSV, Excel)
- Timezone for delivery time
- Recipients (array of email addresses)
- Customizable metrics selection
- Date range configuration (7, 30, or 90 days)
- Active status and scheduling timestamps

## Using Scheduled Reports

### Creating a New Report

1. Navigate to Analytics page
2. Scroll to "Scheduled Reports" section
3. Click "New Report" button
4. Fill in the form:
   - **Report Name**: Descriptive name for the report
   - **Description** (optional): Internal notes about the report
   - **Email Subject** (optional): Custom subject line for emails
   - **Frequency**: How often to send (daily, weekly, monthly)
   - **Format**: CSV or Excel
   - **Date Range**: Last 7, 30, or 90 days
   - **Timezone**: Delivery timezone (UTC, America/New_York, etc.)
   - **Metrics to Include**: Check which metrics to include:
     - Usage Count
     - Acceptance Rate
     - Time to Accept
     - Category Performance
   - **Recipients**: Comma-separated email addresses

### Send Test Now Feature

Before scheduling, you can preview the report:
1. Fill in all report configuration fields
2. Click "Send Test Now" button
3. Test report will be sent immediately to specified recipients
4. Review the test email to ensure formatting and content are correct
5. Then click "Create Report" to schedule recurring delivery

### Managing Reports

- **Toggle Active/Inactive**: Use the switch to pause/resume reports
- **Delete Report**: Click trash icon to remove a scheduled report
- **View Details**: See frequency, format, date range, timezone, recipient count, and metric count

## Email Delivery

Reports are sent via Resend API using the configured VITE_RESEND_API_KEY.

### Edge Functions

**send-test-report**: Sends immediate test reports for preview
- Invoked when "Send Test Now" is clicked
- Uses mock data for quick preview
- Helps verify email formatting and recipient addresses

**send-scheduled-reports**: Sends recurring scheduled reports
- Should be triggered on a schedule (e.g., via cron job)
- Queries for due reports
- Fetches real analytics data based on date range
- Includes only selected metrics
- Sends emails with custom subject lines
- Updates last_sent_at timestamps

## Report Contents

Each report includes:
- Custom email subject (or default with date)
- Report description (if provided)
- Selected metrics only:
  - Usage counts (if selected)
  - Acceptance rates (if selected)
  - Time-to-acceptance averages (if selected)
  - Category performance (if selected)
- Date range and timezone information
- Template performance table with selected columns

## Customization Options

### Date Ranges
- **Last 7 days**: Recent short-term trends
- **Last 30 days**: Monthly performance overview
- **Last 90 days**: Quarterly analysis

### Metrics Selection
Choose which metrics to include in reports:
- Reduce email size by excluding unnecessary metrics
- Focus on specific KPIs relevant to recipients
- Customize reports for different stakeholder groups

### Email Customization
- **Custom Subject**: Override default subject line
- **Description**: Add context for report recipients
- **Timezone**: Ensure reports arrive at appropriate times

## Best Practices

1. **Test First**: Always use "Send Test Now" before scheduling
2. **Customize Metrics**: Only include metrics relevant to recipients
3. **Choose Appropriate Date Range**: Match frequency to date range (daily=7 days, weekly=30 days, monthly=90 days)
4. **Set Correct Timezone**: Ensure reports arrive during business hours
5. **Clear Subject Lines**: Use descriptive subjects for easy email filtering
6. **Limit Recipients**: Keep recipient lists manageable
7. **Monitor Delivery**: Check last_sent_at to ensure reports are being delivered

## Troubleshooting

- **Test reports not sending**: Verify VITE_RESEND_API_KEY is configured
- **Reports not sending**: Check edge function logs and Resend API status
- **Empty reports**: Verify analytics data exists for the date range
- **Email not received**: Check spam folders and verify email addresses
- **Missing metrics**: Ensure metrics are selected in report configuration
- **Wrong timezone**: Update timezone setting in report configuration
