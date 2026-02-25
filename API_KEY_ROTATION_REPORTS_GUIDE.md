# API Key Rotation Compliance Reports Guide

## Overview
Automated compliance report generation system for API key rotation analytics with scheduled email delivery, customizable thresholds, and multi-format export capabilities.

## Features
- **Scheduled Reports**: Daily, weekly, or monthly automated report generation
- **Multi-Format Export**: CSV and PDF report formats
- **Email Delivery**: Automated email delivery to multiple administrators
- **Compliance Metrics**: Track rotation compliance rates and policy violations
- **Expiration Alerts**: Highlight keys approaching expiration
- **Customizable Thresholds**: Set compliance thresholds and warning periods
- **Report History**: Track all sent reports with metrics

## Database Setup

Run the SQL setup file to create required tables:

```sql
-- Execute DATABASE_API_KEY_ROTATION_REPORTS_SETUP.sql
```

This creates:
- `api_key_rotation_report_schedules` - Report schedule configurations
- `api_key_rotation_report_history` - Tracking of sent reports

## Creating Report Schedules

### Via UI
1. Navigate to Settings → API Key Rotation Analytics
2. Click "New Schedule" in the Automated Compliance Reports section
3. Configure:
   - **Report Name**: Descriptive name for the report
   - **Frequency**: Daily, weekly, or monthly
   - **Format**: CSV, PDF, or both
   - **Recipients**: Comma-separated email addresses
   - **Compliance Threshold**: Minimum acceptable compliance rate (%)
   - **Expiration Warning**: Days before expiration to flag keys
   - **Include Options**: Policy violations, rotation history, compliance trends
4. Click "Create Schedule"

### Programmatically
```typescript
import { createReportSchedule } from '@/lib/apiKeyRotationReportService';

await createReportSchedule({
  report_name: 'Weekly Security Compliance',
  schedule_frequency: 'weekly',
  report_format: 'csv',
  recipient_emails: ['admin@example.com', 'security@example.com'],
  compliance_threshold: 80,
  expiration_warning_days: 7,
  include_policy_violations: true,
  include_rotation_history: true,
  include_compliance_trends: true,
  enabled: true
});
```

## Report Contents

### Summary Metrics
- Total API keys managed
- Overall compliance rate (%)
- Keys expiring soon (within warning period)
- Policy violations count
- Total rotations performed

### Keys Expiring Soon
Lists all keys that will expire within the configured warning period:
- Key name
- Expiration date
- Days until expiration

### Policy Violations
Lists keys that don't meet compliance requirements:
- Keys without auto-rotation enabled
- Keys without rotation intervals configured
- Keys overdue for rotation

### CSV Format
```csv
API Key,Rotation Enabled,Interval (days),Last Rotation,Next Rotation,Status
production-api,true,90,2024-01-15,2024-04-15,Compliant
staging-api,false,N/A,Never,N/A,Non-Compliant
```

## Email Notifications

Reports are automatically sent via email with:
- HTML formatted summary
- CSV attachment (if format includes CSV)
- Highlighted policy violations
- Expiration warnings

### Email Template
```
Subject: API Key Rotation Compliance Report - [Date]

Summary:
- Total API Keys: 15
- Compliance Rate: 86.7%
- Keys Expiring Soon: 2
- Policy Violations: 2

Keys Expiring in Next 7 Days:
- production-api - Expires: 2024-04-20
- staging-api - Expires: 2024-04-22

Policy Violations:
- legacy-api - Auto-rotation disabled
- test-api - No rotation interval set
```

## Managing Schedules

### Enable/Disable Schedule
Toggle the switch next to any schedule to enable or disable it without deleting.

### Delete Schedule
Click the trash icon to permanently delete a schedule.

### View Report History
Report history shows:
- When reports were sent
- Compliance metrics at time of sending
- Number of violations and expiring keys
- Recipients

## Manual Report Export

Export current compliance data anytime:
1. Navigate to API Key Rotation Analytics
2. Click "Export CSV" button
3. CSV file downloads with current data

## Compliance Thresholds

### Setting Thresholds
Configure minimum acceptable compliance rates:
- **80%+**: Recommended for production environments
- **90%+**: High-security environments
- **100%**: Maximum security (all keys must have rotation)

### Threshold Alerts
When compliance falls below threshold:
- Highlighted in report summary
- Email subject includes "⚠️ COMPLIANCE ALERT"
- Detailed violation list provided

## Best Practices

### Report Frequency
- **Daily**: High-security environments, critical systems
- **Weekly**: Standard production environments
- **Monthly**: Development/staging environments

### Recipients
Include:
- Security team leads
- DevOps administrators
- Compliance officers
- Management (for executive summaries)

### Thresholds
- Start with 80% compliance threshold
- Gradually increase as rotation adoption improves
- Set expiration warnings to 7-14 days for adequate response time

### Report Formats
- **CSV**: For data analysis and record keeping
- **PDF**: For executive summaries and compliance documentation
- **Both**: Complete audit trail

## Automation Setup

### Scheduled Execution
Reports run automatically based on configured frequency:
- Daily: Same time each day
- Weekly: Same day/time each week
- Monthly: Same date each month

### Cron Job (Optional)
For server-side automation, set up a cron job:

```bash
# Daily at 8 AM
0 8 * * * curl -X POST https://your-domain.com/api/send-rotation-reports

# Weekly on Monday at 9 AM
0 9 * * 1 curl -X POST https://your-domain.com/api/send-rotation-reports

# Monthly on 1st at 10 AM
0 10 1 * * curl -X POST https://your-domain.com/api/send-rotation-reports
```

## Troubleshooting

### Reports Not Sending
1. Verify schedule is enabled
2. Check recipient email addresses are valid
3. Confirm email service (Resend) is configured
4. Review report history for error messages

### Missing Data
1. Ensure rotation policies are configured
2. Verify user has access to API keys
3. Check database permissions

### Incorrect Metrics
1. Refresh rotation policy data
2. Verify rotation history is being logged
3. Check date/time calculations for expiration warnings

## Security Considerations

- Reports contain sensitive security information
- Restrict recipient list to authorized personnel only
- Use secure email delivery (TLS/SSL)
- Store report history with appropriate access controls
- Regularly review and update recipient lists
- Archive old reports according to retention policies

## Integration with Alerts

Combine with real-time alerts:
- Scheduled reports provide regular overview
- Real-time alerts for immediate issues
- Complementary monitoring approach

## Compliance Documentation

Use reports for:
- Security audits
- Compliance certifications (SOC 2, ISO 27001)
- Internal security reviews
- Executive reporting
- Trend analysis over time
