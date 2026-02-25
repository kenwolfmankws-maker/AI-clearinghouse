# Mandatory Two-Factor Authentication for Admin Users

This guide explains the mandatory 2FA system for admin users, including setup, backup codes, and enforcement policies.

## Overview

All admin users are **required** to enable two-factor authentication (2FA) before accessing administrative features. This adds an extra layer of security to protect sensitive admin functions.

## Features

### 1. Mandatory 2FA Enforcement
- Admin users without 2FA are automatically redirected to setup wizard
- Cannot access admin dashboard until 2FA is configured
- Database function `admin_has_required_2fa()` checks compliance

### 2. Setup Wizard
- QR code generation for authenticator apps (Google Authenticator, Authy, etc.)
- Manual secret key entry option
- Automatic backup code generation after setup
- User-friendly step-by-step process

### 3. Backup Recovery Codes
- 10 single-use backup codes generated during setup
- Can be regenerated at any time from profile settings
- Stored as SHA-256 hashes for security
- Download or copy to secure location

### 4. Verification Flow
- Required on each admin dashboard access
- 6-digit TOTP code from authenticator app
- Alternative: 8-digit backup code
- Failed attempts logged for security monitoring

## Database Schema

### Tables Created

```sql
-- 2FA settings per user
user_two_factor (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Backup recovery codes
two_factor_backup_codes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  code_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)

-- Verification attempt logs
two_factor_verification_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  success BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ
)
```

## Key Functions

### Check if User Has 2FA Enabled
```sql
SELECT has_two_factor_enabled(user_id);
```

### Check if Admin Has Required 2FA
```sql
SELECT admin_has_required_2fa(user_id);
-- Returns true if:
-- - User is not an admin (2FA not required)
-- - User is admin AND has 2FA enabled
```

### Generate Backup Codes
```sql
SELECT generate_backup_codes(
  user_id,
  ARRAY['hash1', 'hash2', ...] -- SHA-256 hashes
);
```

### Verify Backup Code
```sql
SELECT verify_backup_code(user_id, code_hash);
-- Returns true if code is valid and unused
-- Marks code as used automatically
```

## Admin Dashboard Flow

### 1. Access Attempt
```
User visits /admin/password-reset
  ↓
Check if user is admin (useAdminCheck hook)
  ↓
If not admin → Redirect to /forbidden
  ↓
If admin → Check 2FA status
```

### 2. 2FA Status Check
```
Call admin_has_required_2fa(user_id)
  ↓
If false (no 2FA) → Show setup wizard
  ↓
If true (has 2FA) → Show verification modal
```

### 3. Setup Flow (First Time)
```
Display QR code + manual secret
  ↓
User scans with authenticator app
  ↓
Click "Enable 2FA"
  ↓
Generate 10 backup codes
  ↓
Display backup codes modal
  ↓
User saves codes → Access granted
```

### 4. Verification Flow (Subsequent Access)
```
Display verification modal
  ↓
User enters 6-digit code OR 8-digit backup code
  ↓
Verify code
  ↓
If valid → Grant access to dashboard
If invalid → Show error, allow retry
```

## User Experience

### For New Admins
1. First admin dashboard access triggers setup wizard
2. Scan QR code with authenticator app
3. Save 10 backup codes securely
4. Access granted to dashboard

### For Existing Admins
1. Each dashboard access requires verification
2. Enter code from authenticator app
3. Alternative: Use backup code if device unavailable
4. Immediate access after successful verification

## Security Features

### Code Storage
- TOTP secrets stored encrypted in database
- Backup codes stored as SHA-256 hashes
- Never stored in plain text

### Verification Logging
- All verification attempts logged
- Success/failure status tracked
- IP address and user agent recorded
- Useful for security auditing

### Backup Code Management
- Single-use codes prevent replay attacks
- Automatic marking as used after verification
- Can regenerate new set anytime
- Old unused codes deleted on regeneration

## Managing 2FA

### From Profile Page
Users can manage their 2FA settings from `/profile`:

1. **View Status**: See if 2FA is enabled
2. **Backup Codes**: View remaining unused codes
3. **Regenerate Codes**: Create new backup codes
4. **Disable 2FA**: Turn off 2FA (with confirmation)

### Admin Management
Admins can:
- View their own 2FA status
- Regenerate backup codes if lost
- Cannot disable 2FA while admin (enforcement)

## Troubleshooting

### Lost Authenticator Device
1. Use one of the 10 backup codes
2. After access, regenerate new backup codes
3. Set up 2FA on new device

### Lost Backup Codes
1. Contact another admin to temporarily revoke admin status
2. Re-grant admin status
3. Set up 2FA again with new codes

### Verification Failures
- Check time sync on device (TOTP requires accurate time)
- Ensure 6-digit code is current (30-second window)
- Try backup code if authenticator not working
- Check verification log for failed attempts

## Best Practices

### For Admins
1. **Save Backup Codes**: Store in password manager or secure location
2. **Multiple Devices**: Set up authenticator on multiple devices
3. **Regular Testing**: Verify backup codes work periodically
4. **Time Sync**: Keep device time synchronized

### For Organizations
1. **Backup Admin**: Have multiple admins with 2FA
2. **Recovery Process**: Document backup code recovery procedure
3. **Regular Audits**: Review verification logs for suspicious activity
4. **Training**: Educate admins on 2FA importance

## API Integration

### Check 2FA Status (Frontend)
```typescript
const { data, error } = await supabase.rpc('admin_has_required_2fa', {
  check_user_id: user.id
});

if (!data) {
  // Show 2FA setup wizard
}
```

### Verify TOTP Code (Frontend)
```typescript
// Note: Use proper TOTP library in production (e.g., otplib)
import { authenticator } from 'otplib';

const isValid = authenticator.verify({
  token: userCode,
  secret: storedSecret
});
```

### Generate Backup Codes (Frontend)
```typescript
// Generate 10 random 8-digit codes
const codes = Array.from({ length: 10 }, () =>
  Array.from({ length: 8 }, () => 
    Math.floor(Math.random() * 10)
  ).join('')
);

// Hash codes before storing
const hashes = await Promise.all(
  codes.map(async (code) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  })
);

// Store hashes
await supabase.rpc('generate_backup_codes', {
  p_user_id: user.id,
  p_code_hashes: hashes
});
```

## Security Considerations

1. **TOTP Implementation**: The demo uses simplified TOTP. Production should use `otplib` or similar
2. **Rate Limiting**: Add rate limiting to verification attempts
3. **Session Management**: Consider 2FA verification timeout
4. **Audit Trail**: Regularly review verification logs
5. **Backup Security**: Educate users on secure backup code storage

## Future Enhancements

- SMS/Email backup verification
- Hardware security key support (WebAuthn)
- Trusted device management
- 2FA grace period for new admins
- Organization-wide 2FA policies
- Recovery code regeneration reminders