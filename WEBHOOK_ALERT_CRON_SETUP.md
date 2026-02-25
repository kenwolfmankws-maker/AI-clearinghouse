# Webhook Alert Cron Job Setup Guide

## Edge Function Deployment

### Step 1: Create Edge Function via Supabase Dashboard

1. Go to your Supabase Dashboard → Edge Functions
2. Click "Create a new function"
3. Name it: `check-webhook-alerts`
4. Copy the code from `supabase/functions/check-webhook-alerts/index.ts`

### Step 2: Set Up Cron Job

In Supabase Dashboard → Database → Extensions:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every 5 minutes
SELECT cron.schedule(
  'check-webhook-alerts-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-webhook-alerts',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### Step 3: Verify Cron Job

```sql
-- Check scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## Manual Testing

Test the function manually:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-webhook-alerts \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Monitoring

- Check `webhook_alert_history` table for triggered alerts
- Check `slack_notification_deliveries` for Slack delivery status
- Monitor cron job execution in `cron.job_run_details`
