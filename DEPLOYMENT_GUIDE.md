# Vercel Deployment Guide for Beginners 🚀

## Quick Start (5 minutes)

### Step 1: Connect to Vercel
1. Go to **[vercel.com](https://vercel.com)** 
2. Click **"Sign Up"** (or "Log In" if you have an account)
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repositories

### Step 2: Import Your Repository
1. Click **"Add New..."** → **"Project"**
2. Find **`AI-clearinghouse`** in your repository list
3. Click **"Import"**

### Step 3: Configure (Already Done!)
Vercel will auto-detect settings. You can just click **"Deploy"** without changing anything.

- ✅ Framework: None (static files)
- ✅ Build Command: (none needed)
- ✅ Output Directory: (auto-detected)

### Step 4: Deploy
1. Click **"Deploy"** button
2. Wait ~30 seconds while Vercel builds
3. 🎉 **Done!** You'll get a live URL

---

## Your Live URLs

After deployment, you'll have:

- **Main Hub**: `https://your-project.vercel.app/hub`
- **Rosie's Garden**: `https://your-project.vercel.app/rosies-garden`
- **Dashboard**: `https://your-project.vercel.app` (redirects to Rosie's Garden)

---

## Adding a Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Add your domain (e.g., `rosies-garden.com`)
4. Follow DNS instructions provided by Vercel
5. Wait 5-10 minutes for propagation

---

## Environment Variables Setup

If you need to add API keys or secrets:

1. In Vercel, go to **"Settings"** → **"Environment Variables"**
2. Add variables from your `.env` file:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` (if used)
3. Click **"Save"**
4. Redeploy (Vercel → "Deployments" → "..." → "Redeploy")

---

## Auto-Deployments

Every time you push to GitHub:
- Vercel automatically deploys your changes
- You get a preview URL for each commit
- Production updates when you push to `main` branch

---

## Testing Before Deploy

Run locally first:
```bash
cd "C:\Users\kensm\OneDrive\Documents\GitHub\AI-clearinghouse-fresh"
node server.js 8082
```

Then open: `http://localhost:8082/rosies-garden`

---

## Troubleshooting

### "Build Failed" Error
- Check Vercel build logs
- Make sure `package.json` is valid
- Remove `node_modules` and try again

### "404 Not Found"
- Check your file paths in `vercel.json`
- Make sure files aren't in `.gitignore`

### "Module Not Found"
- Add missing modules to `package.json`
- Run `npm install` locally first

---

## Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Issues**: Create an issue in your repo
- **Vercel Discord**: [vercel.com/discord](https://vercel.com/discord)

---

## What the Config Does

The `vercel.json` file sets up:

✅ **Route `/rosies-garden`** → Serves the preview interface  
✅ **Route `/hub`** → Serves the main Hub HTML  
✅ **Security headers** → Protects against common attacks  
✅ **Caching** → Makes assets load faster  
✅ **Clean URLs** → No `.html` extensions needed  

You don't need to understand all this now - it just works! 🎯
