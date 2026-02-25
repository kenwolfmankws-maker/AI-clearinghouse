# Real-Time Performance Alerts System

## Overview

The Real-Time Performance Alerts system monitors A/B test performance and automatically notifies users when significant changes, underperformance, or anomalies are detected. It supports multiple alert channels and can automatically pause tests when critical issues arise.

## Features

- **Real-time monitoring** of active A/B tests
- **Statistical significance detection** with configurable confidence levels
- **Underperformance alerts** when variants fall below thresholds
- **Anomaly detection** using standard deviation analysis
- **Multi-channel notifications**: Email, In-App, SMS
- **Auto-pause functionality** for critical issues
- **Alert history and acknowledgment** tracking

## Database Setup

Run the following SQL to set up the alert system:

```sql
-- See DATABASE_REALTIME_ALERTS_SETUP.sql for complete schema
```

This creates:
- `digest_alert_configs` - User alert preferences and thresholds
- `digest_alert_history` - Log of all triggered alerts

## Alert Types

### 1. Statistical Significance
Triggered when variants show statistically significant differences in performance.

**Default Threshold**: 95% confidence level

### 2. Underperforming Variant
Triggered when a variant performs significantly worse than the baseline.

**Default Threshold**: 50% below average performance

### 3. Anomalous Behavior
Triggered when metrics deviate beyond expected ranges.

**Default Threshold**: 2 standard deviations

### 4. Test Completion
Triggered when a test reaches completion criteria.

## Configuration

### Setting Up Alerts

1. Navigate to **Analytics → Alert Config**
2. Enable desired alert types
3. Configure thresholds:
   - **Confidence Level**: 80-99% (default: 95%)
   - **Performance Threshold**: 10-90% (default: 50%)
   - **Anomaly Threshold**: 1-3 std devs (default: 2.0)

### Alert Channels

#### Email Notifications
- Automatically enabled for all users
- Sends detailed alert information with test links
- Powered by Resend API

#### In-App Notifications
- Real-time notifications in the application
- Visible in the Live Monitor tab
- Requires acknowledgment to dismiss

#### SMS Notifications (Optional)
- Requires phone number configuration
- Powered by Twilio
- Best for critical alerts only

### Auto-Pause Settings

Enable auto-pause to automatically stop tests when critical issues are detected:

1. Toggle **Enable Auto-Pause**
2. Set **Pause Threshold** (10-50%, default: 30%)
3. Tests will pause if any variant performs below this threshold

## Live Monitoring

### Accessing the Monitor

Navigate to **Analytics → Live Monitor** to view:
- All active and scheduled tests
- Real-time performance metrics
- Active alerts requiring attention
- Variant-by-variant breakdowns

### Monitoring Metrics

For each test, the monitor displays:
- **Total Sends**: Progress toward sample size goals
- **Open Rates**: Per-variant open percentages
- **Click Rates**: Per-variant click percentages
- **Confidence Level**: Statistical significance
- **Status Badges**: Significant, Underperforming, etc.

### Manual Actions

From the Live Monitor, you can:
- **Pause** active tests manually
- **Acknowledge** alerts to dismiss them
- **View** detailed test performance

## Edge Function: send-performance-alert

The system uses an edge function to send alerts via multiple channels.

### Function Parameters

```typescript
{
  alertType: 'significant_difference' | 'underperforming' | 'anomaly' | 'completion',
  testId: string,
  testName: string,
  severity: 'info' | 'warning' | 'critical',
  title: string,
  message: string,
  data: object,
  channels: {
    email: boolean,
    sms: boolean,
    inApp: boolean
  },
  phoneNumber?: string
}
```

### Invoking from Client

```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.functions.invoke('send-performance-alert', {
  body: {
    alertType: 'underperforming',
    testId: test.id,
    testName: test.name,
    severity: 'warning',
    title: 'Variant B Underperforming',
    message: 'Variant B has a 45% lower open rate than the baseline',
    data: { variantId: 'B', openRate: 12.5, baseline: 22.7 },
    channels: { email: true, sms: false, inApp: true },
    phoneNumber: '+1234567890'
  }
});
```

## Alert Severity Levels

### Info
- Test completion notifications
- Milestone achievements
- General updates

### Warning
- Moderate underperformance
- Approaching thresholds
- Requires attention but not urgent

### Critical
- Severe underperformance
- Statistical anomalies
- Auto-pause triggered
- Immediate action required

## Best Practices

### Threshold Configuration

1. **Start Conservative**: Begin with default thresholds (95% confidence, 50% performance)
2. **Adjust Based on Volume**: Lower thresholds for high-volume tests
3. **Consider Context**: Adjust for seasonal variations or campaign types

### Alert Fatigue Prevention

1. **Use Auto-Pause Wisely**: Only for critical issues
2. **Acknowledge Promptly**: Keep alert queue clean
3. **Review Regularly**: Adjust thresholds if too many false positives

### SMS Notifications

1. **Reserve for Critical**: Only enable for critical severity
2. **Test Phone Number**: Verify number format before enabling
3. **Monitor Costs**: SMS has per-message charges

## Monitoring Frequency

The Live Monitor refreshes every **30 seconds** to provide near real-time updates without overwhelming the database.

To adjust refresh rate, modify the interval in `RealTimeTestMonitor.tsx`:

```typescript
const interval = setInterval(loadActiveTests, 30000); // 30 seconds
```

## Alert History

All alerts are logged in `digest_alert_history` with:
- Alert type and severity
- Test details and metrics
- Actions taken (auto-pause, etc.)
- Acknowledgment status and timestamp

### Querying Alert History

```sql
SELECT 
  ah.*,
  dat.name as test_name
FROM digest_alert_history ah
JOIN digest_ab_tests dat ON ah.test_id = dat.id
WHERE ah.user_id = 'user-uuid'
ORDER BY ah.created_at DESC;
```

## Troubleshooting

### Alerts Not Triggering

1. Verify alert configs are enabled in database
2. Check threshold settings aren't too strict
3. Ensure tests have sufficient data (minimum 50 sends)

### Email Alerts Not Sending

1. Verify RESEND_API_KEY is configured
2. Check email address in user profile
3. Review edge function logs

### SMS Alerts Not Sending

1. Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
2. Check phone number format (+1234567890)
3. Verify Twilio "From" number is configured

## Integration with Existing Systems

The alert system integrates with:
- **Digest Analytics**: Pulls test performance data
- **A/B Test Dashboard**: Links to test details
- **Notification System**: Uses existing notification infrastructure

## Future Enhancements

- Slack/Discord webhook support
- Custom alert rules builder
- Machine learning-based anomaly detection
- Alert scheduling (quiet hours)
- Team-based alert routing
