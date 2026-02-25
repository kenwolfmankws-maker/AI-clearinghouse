# 🚀 AI Clearinghouse Setup Guide for Affiliates

## ✅ Quick Start (No Domain Required!)

### Step 1: Fix Supabase Configuration

**CRITICAL ISSUE FOUND**: Your Supabase key appears incomplete.

1. Go to https://supabase.com/dashboard
2. Select your project: `renuhdmxolunjqjbslga`
3. Click Settings → API
4. Copy the **full** `anon/public` key (it should be ~200+ characters)
5. Update `src/lib/supabase.ts` with the complete key

**Current key looks truncated** - it should look like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlbnVoZG14b2x1bmpxamJzbGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTg4NjQwMDAsImV4cCI6MjAxNDQ0MDAwMH0...
```

### Step 2: Create Database Tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- User Profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Favorites
CREATE TABLE user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  model_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
```

### Step 3: Deploy to Vercel (FREE)

1. Push code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Deploy (you'll get a free URL like: `your-app.vercel.app`)
5. **Use this URL for your Facebook/Instagram links!**

### Step 4: Share on Social Media

Your Vercel URL is perfect for affiliate marketing:
- ✅ Professional looking
- ✅ Fast loading
- ✅ No domain purchase needed
- ✅ Works immediately

**Example Posts**:
- "Check out this AI model comparison tool: your-app.vercel.app"
- "Find the perfect AI for your needs: your-app.vercel.app"

---

## 🔧 Optional: Email Features

The app tries to send emails but needs Supabase Edge Functions. For now:
- **Emails will fail silently** (won't break the app)
- Users can still sign up and use the platform
- Add email later when you're ready

---

## ⚠️ Current Issues & Fixes

### Issue 1: Incomplete Supabase Key
**Status**: CRITICAL - Fix this first
**Solution**: Get full anon key from Supabase dashboard

### Issue 2: Missing Database Tables
**Status**: Important
**Solution**: Run SQL commands above

### Issue 3: Email Functions Not Set Up
**Status**: Optional for now
**Solution**: App works without it, emails just won't send

---

## 📱 Perfect for Social Media Affiliates

✅ No domain needed
✅ Free hosting on Vercel
✅ Professional appearance
✅ Fast and responsive
✅ Share directly on Facebook/Instagram
✅ Track users through analytics later

---

## 🎯 Next Steps

1. Fix Supabase key (5 minutes)
2. Create database tables (5 minutes)
3. Deploy to Vercel (10 minutes)
4. Start sharing on social media!

**Total setup time: ~20 minutes**
