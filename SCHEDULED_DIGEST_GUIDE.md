# Scheduled A/B Test System Guide

## Overview
The Scheduled Test System allows you to automate A/B test execution by scheduling tests to start at specific dates and times, with support for recurring patterns and timezone handling.

## Features

### 1. Test Scheduling
- Schedule tests to start at specific dates/times
- Timezone support (automatically detects user timezone)
- One-time or recurring schedules (daily, weekly, monthly)
- Set end dates for recurring tests

### 2. Automatic Execution
- Tests start automatically at scheduled time
- Variant distribution applied automatically
- Notifications sent when tests start
- Progress monitoring for active tests

### 3. Recurring Patterns
- **Daily**: Test runs every day at the same time
- **Weekly**: Test runs once per week
- **Monthly**: Test runs once per month
- Set optional end dates for recurring tests

### 4. Status Tracking
- **Scheduled**: Waiting to start
- **Running**: Currently active
- **Completed**: Finished execution
- **Cancelled**: Manually stopped

## Setup

### 1. Database Setup
```sql
-- Run the setup script
\i DATABASE_SCHEDULED_TESTS_SETUP.sql
```

### 2. Edge Function Deployment
Deploy the `process-scheduled-tests` function to run on a cron schedule:

```bash
supabase functions deploy process-scheduled-tests
```

### 3. Configure Cron Job
Set up a cron trigger in Supabase to run every minute:
- Function: `process-scheduled-tests`
- Schedule: `* * * * *` (every minute)

## Usage

### Creating a Scheduled Test

1. Navigate to Analytics > Scheduled Tests
2. Click "Schedule New Test"
3. Fill in test details:
   - Test name and description
   - Start date and time
   - Timezone (auto-detected)
   - Recurrence pattern
   - Number of variants
   - Algorithm choice
4. Click "Schedule Test"

### Managing Scheduled Tests

**View Upcoming Tests**: See all scheduled tests with next run times

**Monitor Active Tests**: Track currently running tests

**Delete Tests**: Remove scheduled tests before they start

**Recurring Tests**: Automatically reschedule after completion

## Timezone Support

The system automatically detects your browser timezone and converts all scheduled times accordingly. Times are stored in UTC in the database but displayed in your local timezone.

## Notifications

You'll receive notifications when:
- A scheduled test starts automatically
- A test completes execution
- A recurring test is rescheduled

## Best Practices

1. **Schedule in Advance**: Create schedules at least 1 hour before start time
2. **Test Timing**: Schedule tests during peak user activity hours
3. **Recurring Tests**: Use for regular newsletter testing
4. **Monitor Progress**: Check test status regularly
5. **End Dates**: Set end dates for recurring tests to avoid indefinite execution

## API Reference

### Database Function
```sql
SELECT * FROM process_scheduled_tests();
-- Returns: started_count, message
```

### Edge Function
```typescript
const { data } = await supabase.functions.invoke('process-scheduled-tests');
// Returns: { started_count, message, notifications_sent }
```

## Troubleshooting

**Test didn't start**: Check that the cron job is configured and running

**Wrong timezone**: Verify timezone setting in test configuration

**Recurring test stopped**: Check if end date was reached

**Notifications not received**: Verify notification preferences are enabled
