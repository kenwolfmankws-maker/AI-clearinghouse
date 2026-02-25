# SMS Cost Threshold Alerts Guide

## Overview
Automated cost monitoring and alerting system for SMS notifications with budget management, projections, and multi-channel alerts.

## Features
- Daily/Monthly budget limits
- Warning and critical thresholds
- Email/Slack notifications when limits exceeded
- Cost projections and spending trends
- Automatic budget resets
- Real-time cost tracking

## Database Setup

Run `DATABASE_SMS_COST_ALERTS_SETUP.sql` to create:
- `sms_cost_budgets` - Budget configurations
- `sms_cost_alerts` - Alert history
- Automatic spend tracking triggers

## Configuration

### 1. Create Budget
```typescript
const budget = {
  budget_type: 'monthly', // or 'daily'
  budget_limit: 100.00,
  warning_threshold: 80, // Alert at 80%
  critical_threshold: 95, // Alert at 95%
  alert_email: 'admin@company.com',
  alert_slack_channel: '#alerts'
};
```

### 2. Budget Types
- **Daily**: Resets every day at midnight
- **Monthly**: Resets on specified day of month

### 3. Alert Thresholds
- **Warning**: 80% (default) - First notification
- **Critical**: 95% (default) - Urgent notification
- **Exceeded**: 100%+ - Budget limit reached

## Edge Function

The `check-sms-cost-thresholds` function:
- Runs periodically (recommended: every hour)
- Checks all active budgets
- Resets budgets when period ends
- Sends alerts via email/Slack
- Prevents duplicate alerts (1-hour cooldown)

### Manual Trigger
```bash
curl -X POST https://your-project.supabase.co/functions/v1/check-sms-cost-thresholds \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## UI Components

### SMSCostBudgetManager
- Create/edit budgets
- Set thresholds
- Configure alert channels
- Enable/disable budgets
- Visual usage indicators

### SMSCostProjectionDashboard
- Spending trends over time
- Projected total spend
- Days remaining in period
- Budget status visualization
- Alert history

## Automated Spend Tracking

Costs automatically update when SMS sent:
```sql
-- Trigger updates budget on SMS delivery
CREATE TRIGGER update_budget_on_sms_delivery
  AFTER INSERT OR UPDATE ON sms_notification_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_budget_spend();
```

## Cost Calculation

Twilio pricing (approximate):
- US/Canada: $0.0079 per SMS
- International: Varies by country
- Store actual cost in `sms_notification_deliveries.cost`

## Alert Flow

1. SMS sent → Cost recorded
2. Budget spend updated automatically
3. Cron job checks thresholds
4. If threshold exceeded:
   - Create alert record
   - Send email notification
   - Send Slack notification
   - Set 1-hour cooldown

## Best Practices

1. **Set Realistic Limits**
   - Monitor actual usage first
   - Add 20% buffer for safety

2. **Multiple Budgets**
   - Create separate budgets per department
   - Use daily limits for testing environments

3. **Alert Channels**
   - Email for non-urgent warnings
   - Slack for critical alerts
   - SMS for exceeded limits (ironic but effective)

4. **Regular Review**
   - Check projections weekly
   - Adjust limits based on trends
   - Archive old alert history

## Cron Job Setup

Add to your cron scheduler:
```bash
# Check SMS costs every hour
0 * * * * curl -X POST https://your-project.supabase.co/functions/v1/check-sms-cost-thresholds
```

Or use Supabase pg_cron:
```sql
SELECT cron.schedule(
  'check-sms-costs',
  '0 * * * *',
  $$SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/check-sms-cost-thresholds',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )$$
);
```

## Troubleshooting

**Budget not resetting:**
- Check `last_reset_at` timestamp
- Verify cron job is running
- Manually trigger function

**Alerts not sending:**
- Verify email/Slack configuration
- Check alert cooldown period
- Review function logs

**Incorrect costs:**
- Validate Twilio pricing
- Check cost calculation in SMS delivery
- Update cost per message in config

## Integration Example

```typescript
// Check budget before sending SMS
const { data: budget } = await supabase
  .from('sms_cost_budgets')
  .select('*')
  .eq('is_active', true)
  .single();

if (budget.current_spend >= budget.budget_limit) {
  throw new Error('SMS budget exceeded');
}

// Send SMS...
// Cost automatically tracked via trigger
```
