# Email Verification Setup Guide

## Overview
This guide will help you configure email verification in your Supabase project so users must verify their email addresses after signing up.

## Step 1: Configure Supabase Email Settings

1. **Go to Authentication Settings**
   - Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/url-configuration
   - Or: Dashboard → Authentication → URL Configuration

2. **Set Redirect URLs**
   - Add your verification redirect URL:
     - Development: `http://localhost:5173/verify-email`
     - Production: `https://yourdomain.com/verify-email`

3. **Enable Email Confirmation**
   - Go to: Dashboard → Authentication → Providers → Email
   - Enable "Confirm email" toggle
   - This requires users to verify their email before they can sign in

## Step 2: Configure Email Templates (Optional)

1. **Go to Email Templates**
   - Navigate to: Dashboard → Authentication → Email Templates

2. **Customize Confirmation Email**
   - Select "Confirm signup" template
   - Customize the email content
   - Make sure the confirmation link uses: `{{ .ConfirmationURL }}`

## Step 3: Database Setup

Run this SQL in your Supabase SQL Editor to add email_verified column:

```sql
-- Add email_verified column to user_profiles if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Update existing users to set email_verified based on auth.users
UPDATE user_profiles 
SET email_verified = TRUE 
WHERE id IN (
  SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL
);

-- Create function to sync email verification status
CREATE OR REPLACE FUNCTION sync_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles 
  SET email_verified = (NEW.email_confirmed_at IS NOT NULL)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-sync verification status
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_verification();
```

## Step 4: Test the Flow

1. **Sign Up**
   - Create a new account
   - You should see a message: "Check your email for verification link"

2. **Check Email**
   - Open the verification email
   - Click the verification link

3. **Verify**
   - You'll be redirected to `/verify-email`
   - The page will show verification status
   - After success, you'll be redirected to your profile

4. **Resend Email**
   - If you don't receive the email, click "Resend Email" button
   - There's a 60-second cooldown between resends

## Features Implemented

✅ **Email Verification Banner**
- Shows on main page and profile when email is not verified
- Displays warning message with yellow styling
- Includes "Resend Email" button with cooldown timer

✅ **Resend Verification Email**
- Button to resend verification email
- 60-second cooldown to prevent spam
- Uses Supabase's native `resend()` function

✅ **Verification Page**
- Handles email confirmation tokens
- Shows loading, success, and error states
- Auto-redirects to profile after successful verification

✅ **Signup Flow**
- Automatically sends verification email on signup
- Sets email_verified to false by default
- Redirects to verify-email page after clicking link

## Troubleshooting

**Emails not sending?**
- Check Supabase email settings are configured
- Verify SMTP settings (if using custom SMTP)
- Check spam folder

**Verification link not working?**
- Ensure redirect URLs are correctly configured
- Check that the URL matches your environment

**Banner not showing?**
- Verify user_profiles table has email_verified column
- Check that the column is set to false for unverified users

## Next Steps

Consider adding:
- Email change verification
- Password reset email verification
- Admin panel to manually verify users
- Email verification reminders
