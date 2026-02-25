# ⚡ Quick Fix Checklist

## 🔴 CRITICAL (Fix Now)

### 1. Supabase API Key - INCOMPLETE
**Problem**: Your key in `src/lib/supabase.ts` is too short
**Current**: `sb_publishable_k0_JYM8dFDjHgwOtbzuNUg_Pk8mGuPH` (44 chars)
**Should be**: ~200+ characters starting with `eyJhbGciOiJIUzI1NiI...`

**How to Fix**:
```bash
1. Go to: https://supabase.com/dashboard/project/renuhdmxolunjqjbslga/settings/api
2. Copy the FULL "anon public" key
3. Replace line 7 in src/lib/supabase.ts
```

---

## 🟡 IMPORTANT (Fix Soon)

### 2. Database Tables Missing
**Problem**: App expects tables that don't exist yet
**Impact**: Sign up and favorites won't work

**How to Fix**:
```sql
-- Go to Supabase SQL Editor and run:

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  tier TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  model_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, model_id)
);

-- Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 🟢 OPTIONAL (Works Without)

### 3. Email Configuration
**Status**: Not critical for affiliate use
**Impact**: Welcome emails won't send (app still works)
**Fix Later**: Set up Resend when you want email features

---

## 🎯 For Affiliate Marketing (No Domain)

### Deploy to Vercel FREE:
1. `git init` (if not done)
2. `git add .`
3. `git commit -m "Initial commit"`
4. Push to GitHub
5. Import to Vercel
6. Get free URL: `your-app.vercel.app`

### Share on Social:
- Facebook posts
- Instagram bio link
- Instagram stories
- Facebook groups
- Comments with value

---

## ✅ Testing Checklist

After fixes:
- [ ] App loads without errors
- [ ] Can browse AI models
- [ ] Search works
- [ ] Filters work
- [ ] Can sign up (creates account)
- [ ] Can sign in
- [ ] Can favorite models (if signed in)
- [ ] Comparison tool works

---

## 🆘 Still Having Issues?

1. Check browser console (F12) for errors
2. Check Supabase logs
3. Verify API key is complete
4. Confirm tables exist in Supabase
