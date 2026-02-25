# Password Reset Rate Limiting Guide

## Overview
This guide explains the rate limiting implementation for password reset requests to prevent abuse and protect your application from spam attacks.

## Features Implemented

### 1. **Cooldown Period**
- **Duration**: 5 minutes (300 seconds) between requests per email
- **Storage**: Uses localStorage to track request timestamps
- **Key Format**: `pwd_reset_{email}` for each unique email address

### 2. **Visual Countdown Timer**
- Real-time countdown display showing minutes and seconds
- Updates every second automatically
- Format: `MM:SS` (e.g., "4:32", "0:45")

### 3. **User Feedback**
- **Warning Alert**: Amber-colored alert box with clock icon
- **Disabled State**: Form input and button disabled during cooldown
- **Button Text**: Changes to show remaining time
- **Error Messages**: Clear explanation when limit is reached

### 4. **Rate Limit Logic**
```typescript
const COOLDOWN_MINUTES = 5;
const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;

// Check if user is on cooldown
const key = `pwd_reset_${email}`;
const lastRequest = localStorage.getItem(key);

if (lastRequest) {
  const elapsed = Date.now() - parseInt(lastRequest);
  if (elapsed < COOLDOWN_MS) {
    // User is on cooldown
    const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    // Show error and prevent submission
  }
}

// Store new request timestamp
localStorage.setItem(key, Date.now().toString());
```

## How It Works

### Request Flow
1. User enters email and clicks "Send Reset Link"
2. System checks localStorage for previous request timestamp
3. If within cooldown period:
   - Show error message with remaining time
   - Disable form submission
   - Display countdown timer
4. If cooldown expired or no previous request:
   - Send reset email via Supabase
   - Store current timestamp in localStorage
   - Start new cooldown period

### Countdown Timer
- Automatically updates every second
- Displays in MM:SS format
- Clears interval when countdown reaches zero
- Re-enables form when timer expires

## Customization

### Change Cooldown Duration
Edit the constant in `ForgotPasswordModal.tsx`:
```typescript
const COOLDOWN_MINUTES = 10; // Change to 10 minutes
```

### Adjust Visual Styling
Modify the alert component:
```typescript
<Alert className="bg-amber-500/10 border-amber-500/50">
  <Clock className="h-4 w-4 text-amber-500" />
  <AlertDescription className="text-amber-200">
    // Your custom message
  </AlertDescription>
</Alert>
```

### Change Storage Method
To use sessionStorage instead of localStorage:
```typescript
// Replace localStorage with sessionStorage
sessionStorage.setItem(key, Date.now().toString());
const lastRequest = sessionStorage.getItem(key);
```

## Security Considerations

### Current Implementation (Client-Side)
- **Pros**: Immediate feedback, no server load
- **Cons**: Can be bypassed by clearing localStorage
- **Best For**: Basic protection against accidental spam

### Enhanced Security (Server-Side)
For production environments, consider implementing server-side rate limiting:

1. **Database Tracking**:
```sql
CREATE TABLE password_reset_attempts (
  email TEXT PRIMARY KEY,
  last_attempt TIMESTAMP,
  attempt_count INTEGER DEFAULT 1
);
```

2. **Edge Function**:
```typescript
// Check database for recent attempts
// Enforce rate limit server-side
// Return error if limit exceeded
```

3. **IP-Based Limiting**:
- Track requests by IP address
- Prevent multiple email attempts from same IP
- Use Supabase Edge Functions with IP detection

## Testing

### Test Cooldown Period
1. Open the Forgot Password modal
2. Enter an email and submit
3. Try submitting again immediately
4. Verify countdown timer appears
5. Wait for timer to expire
6. Verify form re-enables

### Test Multiple Emails
1. Submit reset for email1@test.com
2. Submit reset for email2@test.com
3. Verify each email has independent cooldown

### Clear Rate Limit (Testing)
Open browser console and run:
```javascript
// Clear specific email
localStorage.removeItem('pwd_reset_user@example.com');

// Clear all password reset limits
Object.keys(localStorage)
  .filter(key => key.startsWith('pwd_reset_'))
  .forEach(key => localStorage.removeItem(key));
```

## User Experience

### Visual States
1. **Normal State**: Blue gradient button, enabled form
2. **Loading State**: Spinning loader, "Sending..." text
3. **Cooldown State**: Amber alert, disabled form, countdown timer
4. **Success State**: Green checkmark, confirmation message

### Error Messages
- **Rate Limited**: "Please wait X minutes before requesting another reset."
- **Invalid Email**: Standard HTML5 email validation
- **Network Error**: Supabase error message displayed

## Monitoring

### Track Rate Limit Hits
Add analytics to monitor how often users hit the rate limit:
```typescript
if (elapsed < COOLDOWN_MS) {
  // Log rate limit hit
  console.log('Rate limit hit:', email, remaining);
  
  // Optional: Send to analytics
  // analytics.track('password_reset_rate_limited', { email, remaining });
}
```

## Best Practices

1. **Clear Communication**: Always show remaining time to users
2. **Reasonable Limits**: 5 minutes is standard, adjust based on your needs
3. **Multiple Channels**: Consider SMS or other verification methods
4. **Audit Logging**: Log all reset attempts for security monitoring
5. **Email Throttling**: Implement server-side limits to prevent email spam

## Troubleshooting

### Timer Not Updating
- Check that useEffect cleanup is working
- Verify setInterval is being cleared properly

### Cooldown Not Working
- Check localStorage is enabled in browser
- Verify email format is consistent (lowercase, trimmed)

### Users Bypassing Limit
- Implement server-side validation
- Add IP-based rate limiting
- Use Supabase RLS policies

## Future Enhancements

1. **Progressive Delays**: Increase cooldown after multiple attempts
2. **CAPTCHA Integration**: Add after X failed attempts
3. **Account Lockout**: Temporarily lock account after many attempts
4. **Email Verification**: Require email verification before reset
5. **Two-Factor Reset**: SMS or authenticator app verification
