# Password Reset Admin Dashboard Guide

## Overview
The Password Reset Admin Dashboard provides comprehensive monitoring and management of password reset attempts, including real-time analytics, suspicious activity detection, and IP blocklist management.

## Access
Navigate to `/admin/password-reset` to access the dashboard.

**Note:** In production, you should add authentication checks to ensure only admin users can access this page.

## Features

### 1. Real-Time Statistics
- **Total Attempts**: Count of all password reset attempts in the last 24 hours
- **Blocked Attempts**: Number of attempts blocked by rate limiting
- **Unique Emails**: Distinct email addresses targeted
- **Blocked IPs**: Currently blocked IP addresses

### 2. Trend Analysis Chart
- Visual representation of attempts over time
- Separate lines for total attempts and blocked attempts
- Hourly granularity for the last 7 days
- Helps identify attack patterns and peak times

### 3. Suspicious Activity Alerts
Real-time detection of suspicious patterns:
- **High Frequency Email**: Multiple reset attempts for the same email
- **High Frequency IP**: Multiple attempts from the same IP address
- Risk levels: Low, Medium, High, Critical
- Automatic detection based on configurable thresholds

### 4. IP Blocklist Management
Manual IP blocking and unblocking:
- Add IPs to blocklist with custom duration
- Specify reason for blocking
- View all currently blocked IPs with expiration times
- One-click unblock functionality

## Database Functions

### get_suspicious_reset_patterns()
Returns suspicious activity patterns detected in the last 24 hours.

**Risk Thresholds:**
- Email-based:
  - Critical: >20 attempts
  - High: >10 attempts
  - Medium: >5 attempts
- IP-based:
  - Critical: >50 attempts
  - High: >20 attempts
  - Medium: >10 attempts

### manage_ip_block(ip_address, action, reason, duration_hours)
Manually block or unblock IP addresses.

**Parameters:**
- `ip_address`: The IP to block/unblock
- `action`: 'block' or 'unblock'
- `reason`: Optional reason for blocking
- `duration_hours`: Block duration (default: 24 hours)

## Auto-Refresh
The dashboard automatically refreshes every 30 seconds to show the latest data.

## Security Recommendations

1. **Admin Authentication**: Add role-based access control
2. **Audit Logging**: Log all manual IP block/unblock actions
3. **Alert Notifications**: Set up email/SMS alerts for critical patterns
4. **Regular Review**: Monitor the dashboard daily for unusual activity
5. **Adjust Thresholds**: Customize detection thresholds based on your traffic

## Customization

### Adjust Detection Thresholds
Edit the `get_suspicious_reset_patterns()` function in your database to modify risk level thresholds.

### Change Auto-Refresh Interval
In `PasswordResetAdmin.tsx`, modify the interval:
```typescript
const interval = setInterval(fetchData, 30000); // 30 seconds
```

### Add Geographic Distribution
Integrate with a GeoIP service to show attack origins on a map.

## Monitoring Best Practices

1. **Daily Review**: Check the dashboard daily for suspicious patterns
2. **Investigate Spikes**: Look into sudden increases in attempts
3. **Block Proactively**: Block IPs showing suspicious behavior before they cause issues
4. **Review Blocked IPs**: Regularly review and remove expired blocks
5. **Track Trends**: Monitor long-term trends to identify evolving attack patterns
