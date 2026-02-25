# Organization-Level 2FA Policy Management Guide

## Overview

This guide covers the organization-level two-factor authentication (2FA) policy system that allows super admins to enforce 2FA requirements for all organization members, manage exemptions, track compliance, and configure trusted device policies.

## Features

- **Organization-Wide 2FA Enforcement**: Require all members to enable 2FA
- **Grace Periods**: Give new users time to set up 2FA
- **Trusted Device Management**: Allow users to mark devices as trusted
- **Exemption System**: Grant exemptions to specific users
- **Compliance Dashboard**: Track organization-wide 2FA adoption
- **Automated Reminders**: Send notifications to users without 2FA
- **Audit Trail**: Complete logging of all policy changes and exemptions

## Database Schema

### Tables Created

1. **org_two_factor_policies**: Organization 2FA policy configuration
2. **trusted_devices**: User trusted devices for 2FA bypass
3. **two_factor_exemptions**: Users exempt from 2FA requirements
4. **two_factor_compliance_log**: Audit trail for compliance events

### Key Functions

- `get_org_2fa_compliance_stats(org_id)`: Get compliance statistics
- `grant_2fa_exemption(org_id, user_id, reason, expires_at)`: Grant exemption
- `revoke_2fa_exemption(org_id, user_id)`: Revoke exemption
- `user_requires_2fa(user_id, org_id)`: Check if user needs 2FA

## Setup Instructions

### 1. Database Setup

The database tables and functions are already created. Verify by checking:

```sql
SELECT * FROM org_two_factor_policies;
SELECT * FROM trusted_devices;
SELECT * FROM two_factor_exemptions;
```

### 2. Configure Organization Policy

1. Navigate to Organization Settings
2. Go to "Security" tab
3. Find "Two-Factor Authentication Policy" section
4. Configure the following settings:

   - **Enforce for All Members**: Toggle to require 2FA
   - **Grace Period**: Days for new users to enable 2FA (default: 7)
   - **Allow Trusted Devices**: Let users skip 2FA on trusted devices
   - **Trusted Device Duration**: How long devices stay trusted (default: 30 days)
   - **Require on Sensitive Actions**: Always require 2FA for critical operations

5. Click "Save Policy"

### 3. View Compliance Dashboard

Access the compliance dashboard to see:

- Total organization members
- Overall compliance rate
- Members without 2FA
- Members in grace period
- Detailed user compliance status

### 4. Manage Exemptions

Grant exemptions for users who cannot use 2FA:

1. Go to "2FA Exemptions" section
2. Click "Grant Exemption"
3. Select user
4. Provide reason (required)
5. Set expiration (optional)
6. Click "Grant Exemption"

To revoke an exemption:
1. Find the user in exemptions list
2. Click the trash icon
3. Confirm revocation

## Usage Guide

### For Super Admins

#### Enabling Organization-Wide 2FA

```typescript
// In your Organization settings component
import OrgTwoFactorPolicy from '@/components/OrgTwoFactorPolicy';

<OrgTwoFactorPolicy />
```

#### Viewing Compliance

```typescript
import TwoFactorComplianceDashboard from '@/components/TwoFactorComplianceDashboard';

<TwoFactorComplianceDashboard />
```

#### Managing Exemptions

```typescript
import TwoFactorExemptionManager from '@/components/TwoFactorExemptionManager';

<TwoFactorExemptionManager />
```

### For Regular Users

#### Setting Up 2FA (When Required)

1. Log in to your account
2. If 2FA is required, you'll see a setup wizard
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes securely
6. Complete setup

#### Managing Trusted Devices

1. Go to Profile > Security
2. View "Trusted Devices" section
3. Remove devices you no longer use
4. Mark current device as trusted (if policy allows)

### Grace Period Behavior

When a new user joins:
1. User has X days (configured grace period) to enable 2FA
2. User can access all features during grace period
3. Reminders are sent at intervals
4. After grace period expires, access is restricted until 2FA is enabled

## API Reference

### Check if User Requires 2FA

```typescript
const { data, error } = await supabase.rpc('user_requires_2fa', {
  p_user_id: userId,
  p_organization_id: orgId
});
```

### Get Compliance Statistics

```typescript
const { data, error } = await supabase.rpc('get_org_2fa_compliance_stats', {
  org_id: organizationId
});
```

### Grant Exemption

```typescript
const { data, error } = await supabase.rpc('grant_2fa_exemption', {
  p_organization_id: orgId,
  p_user_id: userId,
  p_reason: 'Medical device incompatibility',
  p_expires_at: '2025-12-31T23:59:59Z' // or null for permanent
});
```

### Revoke Exemption

```typescript
const { data, error } = await supabase.rpc('revoke_2fa_exemption', {
  p_organization_id: orgId,
  p_user_id: userId
});
```

## Best Practices

### Policy Configuration

1. **Start with Grace Period**: Give users 7-14 days to set up 2FA
2. **Enable Trusted Devices**: Reduces friction for regular users
3. **Set Reasonable Duration**: 30 days for trusted devices balances security and UX
4. **Require on Sensitive Actions**: Always enforce for critical operations

### Exemption Management

1. **Document Reasons**: Always provide clear reason for exemptions
2. **Use Expiration Dates**: Review exemptions periodically
3. **Minimize Exemptions**: Only grant when absolutely necessary
4. **Regular Audits**: Review exemption list quarterly

### Compliance Monitoring

1. **Check Dashboard Weekly**: Monitor compliance trends
2. **Send Reminders**: Use automated reminders for non-compliant users
3. **Follow Up**: Contact users approaching grace period end
4. **Track Metrics**: Monitor compliance rate over time

## Troubleshooting

### Users Can't Enable 2FA

1. Check if user has exemption
2. Verify grace period hasn't expired
3. Ensure user has access to authenticator app
4. Provide backup codes for recovery

### Compliance Rate Not Updating

1. Refresh compliance dashboard
2. Check if users have actually enabled 2FA
3. Verify database functions are working
4. Check for exemptions affecting calculations

### Trusted Devices Not Working

1. Verify policy allows trusted devices
2. Check device hasn't expired
3. Ensure device fingerprint is being captured
3. Clear browser cache and re-trust device

## Security Considerations

1. **Backup Codes**: Ensure users save backup codes securely
2. **Device Trust**: Limit trusted device duration
3. **Exemptions**: Audit exemptions regularly
4. **Sensitive Actions**: Always require 2FA regardless of trusted devices
5. **Logging**: Monitor compliance logs for suspicious patterns

## Integration with Existing Features

### Admin Dashboard

The 2FA policy integrates with the existing admin dashboard:
- Admins must have 2FA enabled (mandatory)
- Organization members follow org policy
- Super admins can manage all policies

### User Profile

Users can manage their 2FA settings from profile:
- Enable/disable 2FA (if not required)
- View trusted devices
- Regenerate backup codes
- Check compliance status

## Monitoring and Reporting

### Compliance Metrics

Track these key metrics:
- Overall compliance rate
- Users in grace period
- Exemptions granted
- Reminders sent
- Time to compliance

### Audit Trail

All events are logged:
- Policy changes
- Exemptions granted/revoked
- Reminders sent
- Compliance achieved
- Grace periods started

## Support and Maintenance

### Regular Tasks

1. **Weekly**: Review compliance dashboard
2. **Monthly**: Audit exemptions
3. **Quarterly**: Review and update policies
4. **Annually**: Security audit of 2FA implementation

### User Support

Provide users with:
- Setup guides
- Authenticator app recommendations
- Backup code storage instructions
- Troubleshooting documentation

## Conclusion

The organization-level 2FA policy system provides comprehensive control over security requirements while maintaining flexibility for different user needs. Regular monitoring and proper configuration ensure maximum security with minimal friction.
