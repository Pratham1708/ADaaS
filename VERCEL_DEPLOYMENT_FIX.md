# Vercel Deployment Fix - Report Generation Issue

## Problem
The deployed Vercel app is still using `localhost:8000` instead of the Render backend URL (`https://adaas-backend.onrender.com`) when generating reports.

## Root Cause
The `ExportReportButton.tsx` component was using the wrong environment variable name (`NEXT_PUBLIC_API_BASE_URL` instead of `NEXT_PUBLIC_API_URL`), which has been fixed in commit `106542c`.

## Solution Steps

### Step 1: Verify Environment Variable in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (ADaaS frontend)
3. Go to **Settings** → **Environment Variables**
4. Verify that `NEXT_PUBLIC_API_URL` is set to: `https://adaas-backend.onrender.com`
5. Make sure it's enabled for **Production**, **Preview**, and **Development** environments

### Step 2: Trigger a New Deployment

Since the code fix has been pushed (commit `106542c`), Vercel should automatically redeploy. However, if it hasn't:

**Option A: Wait for Auto-Deploy**
- Vercel should automatically detect the new commit and redeploy
- Check your Vercel dashboard for the deployment status
- Wait for the deployment to complete (usually 2-5 minutes)

**Option B: Force Redeploy**
1. Go to your Vercel project dashboard
2. Click on the **Deployments** tab
3. Find the latest deployment
4. Click the **⋯** (three dots) menu
5. Select **Redeploy**
6. Choose **Use existing Build Cache** or **Redeploy without cache** (recommended)

**Option C: Push a New Commit**
If auto-deploy isn't working, push a small change:
```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```

### Step 3: Clear Browser Cache

After Vercel redeploys:
1. Hard refresh your browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or clear your browser cache for the Vercel domain
3. Or open the app in an incognito/private window

### Step 4: Verify the Fix

1. Open your deployed Vercel app
2. Open browser DevTools (F12)
3. Go to the **Network** tab
4. Try to generate a report
5. Check the request URL - it should now be:
   ```
   https://adaas-backend.onrender.com/api/v1/analysis/survival/report?dataset_id=...&format=pdf
   ```
   Instead of:
   ```
   http://localhost:8000/api/v1/analysis/survival/report?dataset_id=...&format=pdf
   ```

## Verification Checklist

- [ ] Environment variable `NEXT_PUBLIC_API_URL` is set in Vercel
- [ ] Latest commit `106542c` is deployed on Vercel
- [ ] Browser cache is cleared
- [ ] Report generation uses Render backend URL
- [ ] Reports download successfully

## Troubleshooting

### If still using localhost:
1. Check Vercel deployment logs for any build errors
2. Verify the environment variable is spelled exactly: `NEXT_PUBLIC_API_URL`
3. Make sure the environment variable is set for the correct environment (Production)
4. Try redeploying without build cache

### If getting CORS errors:
The backend needs to allow your Vercel domain. Check `backend/.env` on Render:
```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
```

## Current Status

- ✅ Code fix pushed (commit `106542c`)
- ✅ Environment variable exists in Vercel
- ⏳ Waiting for Vercel to redeploy
- ⏳ Need to verify deployment is complete
