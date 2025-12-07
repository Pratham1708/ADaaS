# 🚨 URGENT: Set Environment Variable in Vercel

## The Problem
Your Vercel deployment is using `localhost:8000` because the environment variable `NEXT_PUBLIC_API_URL` is **NOT SET** in Vercel's dashboard.

## ✅ SOLUTION: Add Environment Variable in Vercel Dashboard

### Step-by-Step Instructions:

#### 1. Go to Vercel Dashboard
- Open: https://vercel.com/dashboard
- Or: https://vercel.com/team_YWTffpoPK2bC6VuWlJSeiL3Y/adaas/settings/environment-variables

#### 2. Navigate to Your Project
- Click on your **"adaas"** project
- Click on the **"Settings"** tab at the top

#### 3. Go to Environment Variables
- In the left sidebar, click **"Environment Variables"**

#### 4. Add the Environment Variable
Click the **"Add New"** button and enter:

```
Key:    NEXT_PUBLIC_API_URL
Value:  https://adaas-backend.onrender.com
```

**Important**: Check ALL THREE environment checkboxes:
- ✅ Production
- ✅ Preview  
- ✅ Development

#### 5. Save
- Click **"Save"** button

#### 6. Redeploy Your Application
After saving the environment variable:
- Go to the **"Deployments"** tab
- Find the latest deployment
- Click the **⋯** (three dots) menu
- Select **"Redeploy"**
- Wait for deployment to complete (2-5 minutes)

#### 7. Verify the Fix
After redeployment:
- Open your Vercel app URL
- Press `Ctrl + Shift + R` to hard refresh
- Try generating a report
- Open DevTools (F12) → Network tab
- Verify the request URL now shows: `https://adaas-backend.onrender.com`

---

## 🔍 Why This Happened

Your local `.env.local` file has the correct value, but **Vercel doesn't read local `.env` files**. You must set environment variables through Vercel's dashboard for them to be available in production.

## 📝 Current Configuration

- **Project ID**: `prj_elLuLSOwYPERtPbHl7VcD4Y1BsLm`
- **Project Name**: `adaas`
- **Required Variable**: `NEXT_PUBLIC_API_URL`
- **Required Value**: `https://adaas-backend.onrender.com`

## ⚠️ Important Notes

1. **Environment variables in Next.js** that start with `NEXT_PUBLIC_` are exposed to the browser
2. **Vercel requires** you to set them in the dashboard for production deployments
3. **After adding/changing** environment variables, you MUST redeploy
4. **Hard refresh** your browser after redeployment to clear cache

---

## Alternative: Use Vercel CLI (Advanced)

If you prefer using the command line:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variable
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter: https://adaas-backend.onrender.com

# Redeploy
vercel --prod
```

---

## ✅ Verification Checklist

After completing the steps above:

- [ ] Environment variable `NEXT_PUBLIC_API_URL` is visible in Vercel Settings
- [ ] Variable is set to `https://adaas-backend.onrender.com`
- [ ] Variable is enabled for Production environment
- [ ] Redeployment is complete (shows "Ready" status)
- [ ] Browser cache cleared (hard refresh)
- [ ] Report generation uses Render URL (not localhost)
- [ ] Reports download successfully

---

## 🆘 Still Not Working?

If after following all steps it still shows localhost:

1. **Check Vercel build logs** for any errors
2. **Verify the environment variable** is spelled exactly: `NEXT_PUBLIC_API_URL`
3. **Try redeploying WITHOUT cache**: In redeploy options, uncheck "Use existing Build Cache"
4. **Check browser console** for any errors
5. **Try a different browser** or incognito mode to rule out caching issues
