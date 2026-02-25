# Notification Digest A/B Testing Guide

## Overview
A/B testing functionality for notification digests allows you to test different email subject lines, send times, and formats to optimize engagement.

## Setup

### 1. Run Database Setup
```sql
-- Execute DATABASE_DIGEST_AB_TESTING_SETUP.sql
```

### 2. Edge Functions
The following edge functions have been updated to support A/B testing:
- `send-digest-notifications` - Assigns users to variants and sends customized emails
- `track-digest-open` - Tracks opens and updates variant metrics

## Features

### Test Types
1. **Subject Line Testing** - Test different email subjects
2. **Send Time Testing** - Test delivery time offsets
3. **Format Testing** - Test compact, detailed, or visual email layouts

### Dashboard Features
- Create and manage A/B tests
- View real-time performance metrics
- Compare variant open rates and click-through rates
- Automatic statistical significance calculation
- Declare winners when sufficient data is collected

## Usage

### Creating a Test
1. Navigate to Analytics → A/B Tests tab
2. Click "Create New Test"
3. Enter test name and select test type
4. Configure variants with different settings
5. Activate the test

### Monitoring Results
- View performance comparison charts
- Track open rates and click rates per variant
- Monitor sample size and statistical significance
- System recommends declaring winner after 100+ sends per variant

### Declaring a Winner
- Click "Declare Winner" on the leading variant
- Test status changes to "completed"
- Winner variant can be applied to all future digests

## Best Practices
- Run tests for at least 1 week to capture weekly patterns
- Ensure minimum 100 sends per variant before declaring winner
- Test one variable at a time for clear insights
- Use 50/50 traffic split for most accurate results

## Analytics Tracked
- Digests sent per variant
- Open rates
- Click-through rates
- Statistical significance (p-value)
- User assignments
- Performance trends over time
