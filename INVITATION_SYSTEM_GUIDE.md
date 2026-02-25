# Organization Invitation System Guide

## Overview
The AI Clearinghouse now includes a complete invitation system that allows organization admins to invite team members via email with unique invitation links.

## Features
- ✅ Email invitations with unique tokens
- ✅ Role-based invitations (Admin, Member, Viewer)
- ✅ Expiration tracking (7-day default)
- ✅ Pending invitations table with status
- ✅ Resend invitation functionality
- ✅ Cancel invitation option
- ✅ Accept/Decline via unique link
- ✅ Email notifications with invitation details

## Database Setup

### 1. Run the SQL Setup Script
Execute the `DATABASE_INVITATION_SETUP.sql` file in your Supabase SQL editor:

```sql
-- This creates:
-- - organization_invitations table
-- - Indexes for performance
-- - Row Level Security policies
-- - Auto-expire function
```

### 2. Verify Tables
Check that the following table exists:
- `organization_invitations`

### 3. Set Up Email Function (Required)
You need a Supabase Edge Function to send emails. Create `send-email` function:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { to, subject, html } = await req.json()
  
  // Use your email service (SendGrid, AWS SES, etc.)
  // Example with SendGrid:
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@yourdomain.com' },
      subject,
      content: [{ type: 'text/html', value: html }]
    })
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

## How It Works

### For Admins (Inviting Members)

1. **Navigate to Organization Page**
   - Go to `/organization`
   - Select your organization
   - Click on "Members" tab

2. **Send Invitation**
   - Enter the email address
   - Select role (Admin, Member, or Viewer)
   - Click "Send Invite"
   - Email is sent with unique link

3. **Manage Pending Invitations**
   - View all pending invitations in the table
   - See expiration dates
   - Resend invitations if needed
   - Cancel invitations before they're accepted

### For Invitees (Accepting Invitations)

1. **Receive Email**
   - Check email for invitation
   - Email contains organization name, role, and expiration date

2. **Click Invitation Link**
   - Link format: `https://yourdomain.com/invite/{unique-token}`
   - Must be logged in to accept

3. **Accept or Decline**
   - Review invitation details
   - Click "Accept" to join organization
   - Click "Decline" to reject invitation

4. **Access Organization**
   - After accepting, redirected to organization page
   - Can now access organization resources based on role

## Invitation Lifecycle

```
Created → Pending → Accepted/Declined/Expired/Cancelled
```

- **Pending**: Invitation sent, awaiting response
- **Accepted**: User joined the organization
- **Declined**: User rejected the invitation
- **Expired**: 7 days passed without response
- **Cancelled**: Admin cancelled before acceptance

## Role Permissions

### Admin
- Invite new members
- Manage existing members
- Resend/cancel invitations
- Full organization access

### Member
- View organization data
- Use organization features
- Cannot manage members

### Viewer
- Read-only access
- Cannot modify anything
- Cannot invite others

## API Reference

### Create Invitation
```typescript
import { createInvitation } from '@/lib/invitationService';

await createInvitation(
  organizationId,
  'user@example.com',
  'member',
  'My Organization',
  'Admin Name'
);
```

### Accept Invitation
```typescript
import { acceptInvitation } from '@/lib/invitationService';

await acceptInvitation(token);
```

### Cancel Invitation
```typescript
import { cancelInvitation } from '@/lib/invitationService';

await cancelInvitation(invitationId);
```

### Resend Invitation
```typescript
import { resendInvitation } from '@/lib/invitationService';

await resendInvitation(invitationId);
```

## Security Features

- Unique tokens (256-bit random)
- Expiration enforcement (7 days)
- Row Level Security policies
- Email verification required
- Role-based access control

## Troubleshooting

### Invitations Not Sending
- Check Supabase Edge Function is deployed
- Verify email service API key
- Check function logs in Supabase dashboard

### Invitation Link Not Working
- Ensure token is valid and not expired
- Check user is logged in
- Verify invitation status is "pending"

### Permission Errors
- Confirm user has admin role
- Check RLS policies are enabled
- Verify organization membership

## Customization

### Change Expiration Time
Edit `src/lib/invitationService.ts`:
```typescript
expiresAt.setDate(expiresAt.getDate() + 14); // 14 days instead of 7
```

### Customize Email Template
Edit `src/lib/emailTemplates.ts`:
```typescript
export const organizationInvitationEmail = (data) => {
  // Modify HTML template here
}
```

## Next Steps

1. Set up email service (SendGrid, AWS SES, etc.)
2. Deploy Supabase Edge Function
3. Test invitation flow end-to-end
4. Customize email templates
5. Adjust expiration times if needed
