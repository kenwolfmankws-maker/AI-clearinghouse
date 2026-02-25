# Digest Analytics Guide

## Overview
The Digest Analytics system tracks and analyzes notification digest performance, providing insights into user engagement, delivery success, and content effectiveness.

## Features

### Metrics Tracked
- **Open Rates**: Percentage of delivered digests that were opened
- **Click-Through Rates**: Percentage of opened digests where users clicked action buttons
- **Delivery Success**: Percentage of digests successfully delivered
- **Average Notifications**: Average number of notifications per digest
- **Notification Types**: Distribution of notification types in digests
- **Frequency Distribution**: Daily vs weekly digest usage

### Analytics Dashboard
Access via: Analytics page → Digest Analytics tab

**Key Components:**
1. Summary Cards - Quick overview of key metrics
2. Engagement Trends - Line chart showing sent/opened/clicked over time
3. Frequency Distribution - Pie chart of daily vs weekly digests
4. Notification Types - Bar chart of notification types in digests

### Export Functionality
Export digest analytics to CSV for external analysis:
- Click "Export" button on dashboard
- Downloads CSV with all digest data
- Includes: date, frequency, notification count, delivery status, open/click status

## Technical Implementation

### Database Schema
```sql
CREATE TABLE digest_analytics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  digest_id UUID NOT NULL,
  sent_at TIMESTAMPTZ,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly')),
  notification_count INTEGER,
  delivered BOOLEAN,
  opened BOOLEAN,
  opened_at TIMESTAMPTZ,
  clicked BOOLEAN,
  clicked_at TIMESTAMPTZ,
  notification_types JSONB
);
```

### Tracking Mechanisms

**1. Delivery Tracking**
- Logged when digest email is sent
- Records success/failure status
- Tracks notification count and types

**2. Open Tracking**
- Invisible tracking pixel in email
- Edge function: `track-digest-open`
- Updates `opened` and `opened_at` fields

**3. Click Tracking**
- Action buttons link to app with digest ID
- App records click event when user arrives
- Updates `clicked` and `clicked_at` fields

## Setup Instructions

### 1. Database Setup
```bash
# Run the analytics schema
psql -h your-db-host -d your-db -f DATABASE_DIGEST_ANALYTICS_SETUP.sql
```

### 2. Deploy Edge Function
```bash
# Deploy tracking pixel function
supabase functions deploy track-digest-open
```

### 3. Verify Setup
- Send test digest
- Check digest_analytics table for entry
- Open email to test tracking pixel
- Click action button to test click tracking

## Usage Examples

### View Analytics
1. Navigate to Analytics page
2. Click "Digest Analytics" tab
3. Select time range (7/30/90 days)
4. View metrics and charts

### Export Data
1. On Digest Analytics dashboard
2. Click "Export" button
3. CSV file downloads automatically
4. Open in Excel/Google Sheets for analysis

### Analyze Trends
- Compare open rates across time periods
- Identify most engaging notification types
- Optimize digest timing based on engagement
- Monitor delivery success rates

## Best Practices

### Improving Open Rates
- Optimize send times based on user timezone
- Use compelling subject lines
- Keep notification count reasonable (5-15 items)
- Test daily vs weekly frequency

### Increasing Click-Through
- Ensure notifications are actionable
- Use clear call-to-action buttons
- Prioritize important notifications at top
- Group related notifications together

### Monitoring Delivery
- Track delivery rates regularly
- Investigate failed deliveries
- Verify email addresses are valid
- Check spam folder rates

## Troubleshooting

### Analytics Not Showing
- Verify DATABASE_DIGEST_ANALYTICS_SETUP.sql was run
- Check RLS policies allow user access
- Ensure digests are being sent (check last_digest_sent)

### Opens Not Tracking
- Verify track-digest-open function is deployed
- Check email client allows images (tracking pixel)
- Test with different email clients
- Review edge function logs

### Clicks Not Recording
- Verify digest_id is passed in email links
- Check app records click when user arrives
- Ensure user is authenticated
- Review browser console for errors

## API Reference

### Fetch Analytics
```typescript
const { data } = await supabase
  .from('digest_analytics')
  .select('*')
  .gte('sent_at', startDate)
  .order('sent_at', { ascending: false });
```

### Record Click Event
```typescript
await supabase
  .from('digest_analytics')
  .update({ 
    clicked: true, 
    clicked_at: new Date().toISOString() 
  })
  .eq('digest_id', digestId);
```

## Future Enhancements
- A/B testing for digest formats
- Personalized send time optimization
- Notification priority scoring
- Engagement prediction models
- Real-time analytics dashboard
