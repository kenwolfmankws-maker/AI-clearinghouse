# Server-Side Password Reset Rate Limiting Guide

## Overview
This system implements comprehensive server-side rate limiting for password reset requests with progressive delays, IP-based blocking, and CAPTCHA integration to prevent abuse.

## Features
- ✅ Email-based rate limiting (3/hour, 10/day)
- ✅ IP-based rate limiting and blocking
- ✅ Progressive delays (5min → 15min → 30min → 1hr → 2hr)
- ✅ Automatic IP blocking after 20 attempts
- ✅ CAPTCHA requirement after 3 attempts
- ✅ Real-time countdown timers
- ✅ Comprehensive attempt logging
- ✅ Automatic cleanup of old records

## Database Tables

### password_reset_attempts
Tracks all password reset attempts:
- `email`: User's email address
- `ip_address`: Request IP address
- `attempted_at`: Timestamp of attempt
- `success`: Whether email was sent
- `blocked`: Whether request was blocked
- `user_agent`: Browser/client info

### password_reset_ip_blocklist
Stores blocked IP addresses:
- `ip_address`: Blocked IP
- `blocked_at`: When blocked
- `reason`: Why blocked
- `expires_at`: When block expires

## Rate Limiting Configuration

```typescript
{
  maxAttemptsPerHour: 3,      // Max 3 attempts per hour per email
  maxAttemptsPerDay: 10,      // Max 10 attempts per day per email
  progressiveDelays: [5, 15, 30, 60, 120], // Minutes between attempts
  ipBlockThreshold: 20,       // Block IP after 20 attempts in 24hrs
  captchaThreshold: 3         // Require CAPTCHA after 3 attempts
}
```

## Progressive Delay System
1st attempt: 5 minute cooldown
2nd attempt: 15 minute cooldown
3rd attempt: 30 minute cooldown
4th attempt: 1 hour cooldown
5th+ attempts: 2 hour cooldown

## Edge Function: request-password-reset

### Request Format
```javascript
const { data, error } = await supabase.functions.invoke('request-password-reset', {
  body: { 
    email: 'user@example.com',
    captchaToken: 'optional-captcha-token'
  }
});
```

### Response Formats

**Success:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "attemptsRemaining": 7
}
```

**Rate Limited:**
```json
{
  "error": "Please wait before requesting another reset",
  "remainingSeconds": 180,
  "attemptsCount": 5,
  "rateLimited": true
}
```

**CAPTCHA Required:**
```json
{
  "error": "CAPTCHA verification required",
  "requiresCaptcha": true,
  "attemptsCount": 3
}
```

**IP Blocked:**
```json
{
  "error": "Too many attempts. Your IP has been temporarily blocked.",
  "blocked": true,
  "expiresAt": "2025-11-05T16:00:00Z"
}
```

## Security Features

### IP-Based Protection
- Tracks attempts by IP address
- Automatically blocks IPs after 20 attempts in 24 hours
- Blocks expire after 24 hours
- Prevents distributed attacks

### Progressive Delays
- Increases wait time with each attempt
- Discourages brute force attacks
- Balances security with user experience

### CAPTCHA Integration
- Required after 3 attempts
- Prevents automated abuse
- Can integrate with hCaptcha, reCAPTCHA, or Turnstile

## Frontend Integration

The `ForgotPasswordModal` component handles:
- Real-time countdown display
- Visual feedback for rate limits
- CAPTCHA requirement alerts
- IP block notifications
- Progressive delay messaging

## Monitoring & Maintenance

### View Recent Attempts
```sql
SELECT email, ip_address, attempted_at, success, blocked
FROM password_reset_attempts
WHERE attempted_at > NOW() - INTERVAL '24 hours'
ORDER BY attempted_at DESC;
```

### Check Blocked IPs
```sql
SELECT ip_address, blocked_at, reason, expires_at
FROM password_reset_ip_blocklist
WHERE expires_at > NOW();
```

### Manual IP Unblock
```sql
DELETE FROM password_reset_ip_blocklist
WHERE ip_address = '123.456.789.0';
```

### Cleanup Old Records
```sql
SELECT cleanup_old_password_reset_attempts();
```

## Customization

### Adjust Rate Limits
Edit the `config` object in the edge function:
```typescript
const config: RateLimitConfig = {
  maxAttemptsPerHour: 5,     // Increase hourly limit
  maxAttemptsPerDay: 15,     // Increase daily limit
  progressiveDelays: [3, 10, 20, 40, 80], // Adjust delays
  ipBlockThreshold: 30,      // More lenient IP blocking
  captchaThreshold: 5        // Require CAPTCHA later
};
```

### Add CAPTCHA Verification
Integrate with your CAPTCHA provider:
```typescript
// In edge function, add verification:
if (captchaToken) {
  const captchaValid = await verifyCaptcha(captchaToken);
  if (!captchaValid) {
    return new Response(
      JSON.stringify({ error: 'Invalid CAPTCHA' }),
      { status: 400, headers: corsHeaders }
    );
  }
}
```

## Best Practices

1. **Monitor Attempts**: Regularly check for suspicious patterns
2. **Adjust Thresholds**: Tune based on your user base
3. **Log Analysis**: Review blocked IPs and attempt patterns
4. **User Communication**: Clear error messages help legitimate users
5. **Cleanup Schedule**: Run cleanup function daily via cron job

## Troubleshooting

### User Can't Reset Password
1. Check if IP is blocked
2. Verify attempt count
3. Check cooldown period
4. Review error logs

### Too Many False Positives
1. Increase thresholds
2. Reduce progressive delays
3. Adjust IP block threshold
4. Review CAPTCHA requirement

### Performance Issues
1. Add database indexes (already included)
2. Run cleanup function more frequently
3. Archive old attempts to separate table

## Security Considerations

- All sensitive operations use service role key
- RLS policies prevent direct table access
- IP addresses logged for security monitoring
- Progressive delays prevent timing attacks
- CAPTCHA prevents automated abuse
- Automatic cleanup prevents data accumulation
