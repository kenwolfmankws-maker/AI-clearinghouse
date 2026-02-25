# 🤖 AI Clearinghouse - AI Model Comparison Platform

A comprehensive platform for discovering, comparing, and tracking AI models. Perfect for affiliate marketing on social media!

## 🚀 Quick Start (For Affiliates - No Domain Needed!)

### ⚠️ CRITICAL FIXES NEEDED

**Before deploying, you MUST fix these issues:**

1. **Incomplete Supabase API Key** 
   - Go to: https://supabase.com/dashboard/project/renuhdmxolunjqjbslga/settings/api
   - Copy your FULL "anon public" key (~200+ characters)
   - Create `.env` file and add: `VITE_SUPABASE_ANON_KEY=your_full_key_here`

2. **Missing Database Tables**
   - Open Supabase SQL Editor
   - Run the SQL in `DATABASE_SETUP.sql`
   - Takes ~30 seconds

### 📋 Setup Checklist

- [ ] Fix Supabase key (see `QUICK_FIX_CHECKLIST.md`)
- [ ] Create database tables (run `DATABASE_SETUP.sql`)
- [ ] Test locally: `npm install && npm run dev`
- [ ] Deploy to Vercel (free)
- [ ] Share your Vercel URL on social media!

## 📚 Documentation

- **`QUICK_FIX_CHECKLIST.md`** - Fix critical issues (START HERE!)
- **`SETUP_GUIDE.md`** - Complete setup walkthrough
- **`AFFILIATE_MARKETING_GUIDE.md`** - How to promote on social media
- **`DATABASE_SETUP.sql`** - Database creation script

## ✨ Features

- 🔍 Search & filter 100+ AI models
- 📊 Side-by-side comparison tool
- ⭐ Save favorites (requires login)
- 📱 Fully responsive design
- 🎯 Perfect for social media sharing
- 🆓 Free to use and deploy

## 🛠️ Tech Stack

- React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth + database)
- Vite (build tool)
- Vercel (hosting)

## 📱 For Social Media Affiliates

### Why This Works:
✅ No domain purchase needed
✅ Free Vercel hosting
✅ Professional appearance
✅ Fast loading times
✅ Mobile-optimized
✅ Easy to share

### Your Vercel URL:
After deploying, you'll get: `your-app.vercel.app`

**Share this on:**
- Facebook posts & groups
- Instagram bio & stories
- LinkedIn
- Twitter/X
- Reddit (where allowed)

## 🎯 Current Status

### ✅ Working Features:
- Browse AI models
- Search functionality
- Advanced filters
- Model comparison
- Responsive design

### ⚠️ Needs Setup:
- User authentication (fix Supabase key)
- Favorites system (create database tables)
- User profiles (create database tables)

### 🔜 Optional (Add Later):
- Email notifications
- Custom domain
- Analytics tracking
- Affiliate links

## 🚀 Deployment

### Option 1: Vercel (Recommended)
```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# Then import to Vercel
# Add environment variables in Vercel dashboard
```

### Option 2: Other Platforms
- Netlify
- Railway
- Render
- Any static host

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env

# Add your Supabase key to .env

# Start dev server
npm run dev

# Build for production
npm run build
```

## 📊 What's Included

- 100+ AI models with detailed info
- Advanced filtering system
- Comparison tool (up to 4 models)
- User authentication
- Favorites & collections
- Responsive design
- Dark theme

## 🆘 Need Help?

1. Check `QUICK_FIX_CHECKLIST.md` for common issues
2. Read `SETUP_GUIDE.md` for detailed instructions
3. Review `AFFILIATE_MARKETING_GUIDE.md` for marketing tips

## 📈 Next Steps

1. **Fix critical issues** (Supabase key + database)
2. **Deploy to Vercel** (get your free URL)
3. **Test everything** (sign up, favorites, comparison)
4. **Start sharing** on social media!

## 🎓 Learning Resources

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

**Ready to launch?** Start with `QUICK_FIX_CHECKLIST.md` → Fix issues → Deploy → Share! 🚀
