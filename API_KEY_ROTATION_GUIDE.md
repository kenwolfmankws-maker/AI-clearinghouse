# API Key Rotation System Guide

## Overview
Automatic API key rotation system with scheduled regeneration, grace periods, audit logging, and expiry notifications.

## Features
- **Scheduled Rotation**: Configure automatic key rotation intervals (30, 60, 90 days, etc.)
- **Grace Periods**: Old keys remain valid during transition period
- **Audit Logging**: Complete history of all key rotations
- **Expiry Notifications**: Alerts before keys expire
- **Manual Rotation**: Rotate keys on-demand
- **Key History**: View all previous keys and rotation dates

## Database Setup

Run the SQL in `DATABASE_API_KEY_ROTATION_SETUP.sql` to create:
- `api_key_rotation_policies` - Rotation schedules and settings
- `api_key_history` - Historical record of all keys
- `api_key_rotation_audit` - Audit log of rotation events

## Configuration

### Enable Rotation for a Key
1. Go to Settings → API Keys
2. Click the gear icon next to any API key
3. Toggle "Enable Rotation"
4. Configure:
   - **Rotation Interval**: Days between rotations (default: 90)
   - **Grace Period**: Days old key remains valid (default: 7)
   - **Notify Before**: Days before expiry to send alert (default: 14)
   - **Auto-Rotate**: Enable automatic rotation

### Rotation Policies

```typescript
{
  rotationEnabled: true,
  rotationIntervalDays: 90,    // Rotate every 90 days
  gracePeriodDays: 7,          // Old key valid for 7 days
  autoRotate: true,            // Automatic rotation
  notifyBeforeDays: 14         // Alert 14 days before expiry
}
```

## Manual Rotation

Click "Rotate Now" to immediately generate a new key:
- New key is generated and displayed
- Old key enters grace period
- Rotation is logged in audit trail
- Notification sent (if configured)

## Notifications

The system sends alerts when:
- Key is within notification window (default: 14 days)
- Key rotation is performed
- Auto-rotation fails
- Grace period is ending

Configure notification channels in Settings → Alerts.

## Scheduled Rotation

Deploy the `rotate-api-keys` edge function and set up a cron job:

```sql
SELECT cron.schedule(
  'rotate-api-keys',
  '0 2 * * *',  -- Run daily at 2 AM
  'SELECT net.http_post(
    url:=''https://your-project.supabase.co/functions/v1/rotate-api-keys'',
    headers:=''{"Authorization": "Bearer YOUR_ANON_KEY"}''::jsonb
  )'
);
```

## Security Best Practices

1. **Regular Rotation**: Rotate keys every 90 days minimum
2. **Grace Periods**: Keep grace periods short (7 days max)
3. **Audit Review**: Regularly review rotation audit logs
4. **Notifications**: Enable alerts for all rotation events
5. **Manual Rotation**: Rotate immediately if key is compromised

## Key History

View complete rotation history:
- All previous keys (hashed for security)
- Rotation dates and reasons
- Who performed the rotation (manual/automatic)
- Current active status

## API Integration

Update your applications to handle key rotation:

```typescript
// Check for key rotation
const policy = await apiKeyRotationService.getRotationPolicy('openai');
if (policy?.nextRotationDate) {
  const daysUntil = calculateDaysUntil(policy.nextRotationDate);
  if (daysUntil <= 7) {
    console.warn('API key rotation approaching');
  }
}

// Handle rotation notification
apiKeyRotationService.on('keyRotated', (keyName, newKey) => {
  // Update key in your application
  updateAPIKey(keyName, newKey);
});
```

## Troubleshooting

**Keys not rotating automatically:**
- Verify auto_rotate is enabled
- Check cron job is running
- Review edge function logs

**Grace period issues:**
- Ensure both old and new keys are configured
- Check grace period hasn't expired
- Verify key history records

**Missing notifications:**
- Confirm notification preferences are set
- Check alert rules are enabled
- Verify webhook/email configuration
