# Password Reset Setup Guide

This guide explains how to configure and use the complete password reset flow with email verification.

## Overview

The password reset system includes:
- **Forgot Password Modal**: Request password reset link
- **Email Delivery**: Automated reset email with secure token
- **Reset Password Page**: Secure password update form
- **Validation**: Password strength requirements and confirmation
- **Success Flow**: Automatic redirect after successful reset

## Features

### 1. Forgot Password Request
- Accessible from login modal via "Forgot password?" link
- Email validation before sending
- Loading states during request
- Success confirmation message
- Error handling for invalid emails

### 2. Password Reset Email
- Secure token-based authentication
- Configurable redirect URL
- Automatic expiration (default: 1 hour)
- Professional email template

### 3. Reset Password Page
- Token validation on page load
- Real-time password strength indicator
- Password confirmation matching
- Requirements checklist:
  - At least 8 characters
  - Contains uppercase letter
  - Contains lowercase letter
  - Contains number
- Loading states during submission
- Success confirmation with auto-redirect

## Setup Instructions

### Step 1: Configure Email Templates in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Email Templates**
3. Find the **Reset Password** template
4. Update the template with your branding:

```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>We received a request to reset your password. Click the button below to create a new password:</p>
<a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

### Step 2: Configure Site URL

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Set your **Site URL**: `https://yourdomain.com` (or `http://localhost:5173` for development)
3. Add to **Redirect URLs**:
   - `https://yourdomain.com/reset-password`
   - `http://localhost:5173/reset-password` (for development)

### Step 3: Test the Flow

1. **Request Reset**:
   - Click "Sign In" button
   - Click "Forgot password?" link
   - Enter your email address
   - Click "Send Reset Link"

2. **Check Email**:
   - Open the reset email in your inbox
   - Click the "Reset Password" button

3. **Reset Password**:
   - Enter your new password
   - Confirm the password
   - Ensure all requirements are met (green checkmarks)
   - Click "Reset Password"

4. **Login**:
   - You'll be redirected to the home page
   - Click "Sign In" and use your new password

## User Flow

```
Login Modal
    ↓
Click "Forgot password?"
    ↓
Enter Email → Send Reset Link
    ↓
Check Email Inbox
    ↓
Click Reset Link in Email
    ↓
Reset Password Page (with token)
    ↓
Enter New Password + Confirm
    ↓
Submit → Success Message
    ↓
Auto-redirect to Home (3 seconds)
    ↓
Login with New Password
```

## Security Features

### Token-Based Authentication
- Secure, single-use tokens
- Automatic expiration (1 hour)
- Server-side validation

### Password Requirements
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Real-time validation feedback

### Error Handling
- Invalid/expired token detection
- Network error handling
- User-friendly error messages
- Graceful degradation

## Customization

### Change Password Requirements

Edit `src/pages/ResetPassword.tsx`:

```typescript
const passwordRequirements = [
  { label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
  { label: 'Contains special character', test: (p: string) => /[!@#$%^&*]/.test(p) },
  // Add more requirements...
];
```

### Change Token Expiration

In Supabase Dashboard:
1. Go to **Authentication** > **Settings**
2. Find **Email Auth**
3. Adjust **Email Link Expiry** (default: 3600 seconds)

### Customize Email Template

1. Go to **Authentication** > **Email Templates**
2. Edit the **Reset Password** template
3. Customize HTML, styling, and content
4. Use variables:
   - `{{ .ConfirmationURL }}` - Reset link
   - `{{ .SiteURL }}` - Your site URL
   - `{{ .Email }}` - User's email

## Troubleshooting

### "Invalid or expired reset link"
- Token may have expired (default: 1 hour)
- Request a new reset link
- Check that redirect URL is configured correctly

### Email not received
- Check spam/junk folder
- Verify email configuration in Supabase
- Ensure SMTP settings are correct
- Check Supabase logs for delivery errors

### Password requirements not met
- Ensure password meets all criteria
- Check for green checkmarks next to each requirement
- Password must match in both fields

### Redirect not working
- Verify redirect URLs in Supabase settings
- Check that Site URL is configured correctly
- Ensure URL matches exactly (including protocol)

## API Reference

### Request Password Reset

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

### Update Password

```typescript
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

## Best Practices

1. **Always use HTTPS** in production for secure token transmission
2. **Keep tokens short-lived** (1 hour or less)
3. **Log password reset attempts** for security monitoring
4. **Rate limit reset requests** to prevent abuse
5. **Send confirmation email** after successful password change
6. **Implement CAPTCHA** for public-facing reset forms
7. **Validate passwords** on both client and server side

## Related Files

- `src/components/ForgotPasswordModal.tsx` - Password reset request modal
- `src/pages/ResetPassword.tsx` - Password reset form page
- `src/components/AuthModal.tsx` - Login modal with forgot password link
- `src/contexts/AuthContext.tsx` - Authentication context

## Support

For issues or questions:
1. Check Supabase Dashboard logs
2. Review browser console for errors
3. Verify email configuration
4. Test with different email providers
5. Check Supabase status page for service issues
