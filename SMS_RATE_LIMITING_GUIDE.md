# SMS Rate Limiting Per Recipient Guide

## Overview
Control SMS costs and prevent spam by setting rate limits per phone number with automatic blocking and cooldown periods.

## Features
- **Hourly Limits**: Max messages per hour per recipient
- **Daily Limits**: Max messages per day per recipient
- **Cooldown Periods**: Time to wait after limit exceeded
- **Automatic Blocking**: Auto-block recipients when limits hit
- **Real-time Monitoring**: Track usage for each phone number
- **Manual Unblock**: Override blocks when needed

## Setup

### 1. Run Database Setup
Execute `DATABASE_SMS_RATE_LIMITING_SETUP.sql` to create:
- `sms_rate_limit_config` - Rate limit settings
- `sms_rate_limit_tracking` - Per-recipient usage tracking

### 2. Configure Rate Limits
Navigate to **Organization → SMS Rate Limits** tab:
- Set max messages per hour (default: 10)
- Set max messages per day (default: 50)
- Configure cooldown period in minutes (default: 60)
- Enable/disable automatic blocking

### 3. Monitor Recipients
View **Rate Limit Status** tab to see:
- Current usage for each phone number
- Progress bars showing hourly/daily limits
- Blocked recipients with unblock option
- Near-limit warnings

## Configuration Examples

### Conservative (Low Volume)
```
Max per hour: 5
Max per day: 20
Cooldown: 120 minutes
Auto-block: Enabled
```

### Standard (Medium Volume)
```
Max per hour: 10
Max per day: 50
Cooldown: 60 minutes
Auto-block: Enabled
```

### High Volume
```
Max per hour: 30
Max per day: 100
Cooldown: 30 minutes
Auto-block: Enabled
```

## Best Practices

1. **Start Conservative**: Begin with lower limits and increase as needed
2. **Monitor Regularly**: Check rate limit status daily
3. **Set Appropriate Cooldowns**: Balance between spam prevention and legitimate use
4. **Review Blocked Recipients**: Periodically review and unblock legitimate users
5. **Combine with Budgets**: Use alongside SMS cost budgets for comprehensive control

## Automatic Reset
- Hourly counters reset every 60 minutes
- Daily counters reset every 24 hours
- Blocked status expires after cooldown period

## Manual Intervention
Admins can manually unblock recipients from the Rate Limit Status dashboard when needed.
