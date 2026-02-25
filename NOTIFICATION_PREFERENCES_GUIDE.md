# Notification Preferences System Guide

## Overview
The notification preferences system allows users to customize which approval workflow events trigger in-app notifications and/or email notifications. Users can configure preferences for each event type independently.

## Database Setup

### 1. Run the SQL Setup
Execute the SQL in `DATABASE_NOTIFICATION_PREFERENCES_SETUP.sql`:

```sql
-- Creates notification_preferences table
-- Enables Row Level Security
-- Sets up user-specific policies
```

## Event Types

The system supports the following approval workflow event types:

1. **approval_request** - When a template change request needs your approval
2. **approval_granted** - When your change request is approved
3. **approval_rejected** - When your change request is rejected
4. **approval_escalated** - When a request is escalated to you
5. **delegation_activated** - When you delegate approval authority
6. **delegation_received** - When someone delegates authority to you

## Features

### In-App Notifications
- Real-time notifications displayed in the notification center
- Badge count in header showing unread notifications
- Optional sound alerts (can be toggled on/off)
- Action buttons for quick navigation to relevant pages

### Email Notifications
- HTML email templates sent via Resend API
- Includes action buttons linking to relevant pages
- Respects user preferences (can be disabled per event type)

### User Preferences Interface
Located in Profile page under "Notification Preferences":
- Toggle in-app notifications per event type
- Toggle email notifications per event type
- Sound on/off button for audio alerts
- Test notification button to preview appearance

## How It Works

### 1. Preference Storage
```typescript
// Each preference record stores:
{
  user_id: UUID,
  event_type: string,
  in_app_enabled: boolean,
  email_enabled: boolean
}
```

### 2. Preference Checking
When creating a notification, the system:
1. Checks if user has a preference for that event type
2. Defaults to enabled if no preference exists
3. Creates in-app notification only if in_app_enabled is true
4. Sends email only if email_enabled is true

### 3. Sound Alerts
- Sound preference stored in localStorage
- Plays embedded audio on new notifications
- Can be toggled in notification preferences

## Usage Examples

### For Users

#### Configure Preferences
1. Go to Profile page
2. Scroll to "Notification Preferences" section
3. Toggle switches for each event type:
   - Left column: In-App notifications
   - Right column: Email notifications
4. Click sound button to enable/disable audio alerts
5. Click "Test Notification" to preview

#### Test Notifications
Click the "Test Notification" button to see:
- How notifications appear in the notification center
- Toast notification style
- Action button functionality

### For Developers

#### Sending Notifications
```typescript
import { notifyApprovalRequest } from '@/lib/approvalNotifications';

// Send notification (automatically respects user preferences)
await notifyApprovalRequest(
  approverId,
  'Monthly Report Template',
  'John Doe',
  requestId
);
```

#### Custom Notification Types
To add new event types:

1. Update `approvalEventTypes` in `NotificationPreferences.tsx`
2. Add type to `ApprovalNotificationType` in `approvalNotifications.ts`
3. Create notification function in `approvalNotifications.ts`
4. Update database triggers if needed

## Default Behavior

- **New Users**: All notifications enabled by default
- **No Preference Set**: Defaults to enabled
- **Preference Exists**: Respects user's choice

## Best Practices

1. **Always provide actionUrl**: Help users navigate to relevant content
2. **Clear, concise messages**: Keep notification text brief and actionable
3. **Respect preferences**: System automatically checks preferences
4. **Test notifications**: Use test button before deploying new types
5. **Email sparingly**: Don't overwhelm users with emails

## Troubleshooting

### Notifications Not Appearing
1. Check if user has disabled that event type in preferences
2. Verify notification_preferences table exists
3. Check browser console for errors
4. Ensure Supabase Realtime is enabled

### Emails Not Sending
1. Verify VITE_RESEND_API_KEY is set in edge function secrets
2. Check user has email_enabled = true for that event type
3. Verify send-approval-notification edge function is deployed
4. Check edge function logs for errors

### Sound Not Playing
1. Check if sound is enabled in preferences
2. Verify browser allows audio autoplay
3. Check browser console for audio errors
4. Try clicking "Test Notification" button

## Integration with Existing Systems

The notification preferences system integrates with:
- **NotificationContext**: Provides sound toggle and notification state
- **NotificationCenter**: Displays notifications with action buttons
- **Approval Workflows**: Automatically sends notifications on events
- **Email Service**: Sends HTML emails via Resend API

## Security

- Row Level Security ensures users can only manage their own preferences
- Email addresses are never exposed to frontend
- Edge functions handle email sending server-side
- Preferences are user-specific and private
