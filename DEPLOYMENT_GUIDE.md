# 🚀 ADaaS Deployment Guide

**Complete guide to deploy ADaaS for FREE using Render, Upstash, and Vercel**

**Total Cost: $0/month** 🎉

---

## 📋 Prerequisites

1. **GitHub Account** - https://github.com
2. **Render Account** - https://render.com
3. **Upstash Redis** - https://upstash.com (already configured ✅)
4. **Vercel Account** - https://vercel.com
5. **Firebase Account** - https://firebase.google.com
6. **Gemini API Key** - https://makersuite.google.com/app/apikey

---

## ✅ Already Completed

- ✅ Code ready for deployment
- ✅ Upstash Redis configured and tested
- ✅ Render configuration file (`render.yaml`) created
- ✅ Environment variable templates created

---

## 🚀 Deployment Steps

### Step 1: Set Up Firebase Authentication (5 minutes)

1. Go to https://console.firebase.google.com
2. Click **"Add project"** → Enter name: **adaas**
3. Disable Google Analytics (optional) → Click **"Create project"**

4. **Enable Google Authentication:**
   - Go to **"Authentication"** → **"Sign-in method"**
   - Click **"Google"** → **"Enable"**
   - Enter support email → Click **"Save"**

5. **Get Web App Credentials:**
   - Go to **"Project settings"** (gear icon)
   - Scroll to **"Your apps"** → Click **"Web"** icon (`</>`)
   - Register app name: **adaas-web**
   - Copy the config values (you'll need these later)

---

### Step 2: Push Code to GitHub (2 minutes)

```bash
cd e:\ADAAS

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Create GitHub repository and push
# (Create a new repo on GitHub first, then:)
git remote add origin https://github.com/YOUR_USERNAME/adaas.git
git branch -M main
git push -u origin main
```

---

### Step 3: Deploy Backend to Render (10 minutes)

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` automatically
5. Click **"Apply"**

6. **Configure Environment Variables for Backend:**
   - Go to **adaas-backend** service
   - Click **"Environment"** tab
   - Add these variables:

   ```
   GEMINI_API_KEY=AIzaSyD7fg0DPtyGPwYLHAaOWXPA9rHSCA0DWVI
   REDIS_HOST=ethical-pup-39760.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=AZtQAAIncDJlYWQzMWZkNGRjOGM0YmNjOWU4ZTBjZWNlZDRhNmRmZnAyMzk3NjA
   ALLOWED_ORIGINS=http://localhost:3000
   ```

7. **Configure Environment Variables for Worker:**
   - Go to **adaas-worker** service
   - Click **"Environment"** tab
   - Add the same variables (except ALLOWED_ORIGINS)

8. **Trigger Deploy:**
   - Go to **adaas-backend** service
   - Click **"Manual Deploy"** → **"Deploy latest commit"**
   - Wait 5-10 minutes for deployment

9. **Note Your Backend URL:**
   - Example: `https://adaas-backend.onrender.com`
   - Test it: `https://adaas-backend.onrender.com/health`

---

### Step 4: Deploy Frontend to Vercel (5 minutes)

1. **Update Frontend Environment Variables:**
   
   Edit `frontend/.env.local` (create if doesn't exist):

   ```bash
   NEXT_PUBLIC_API_URL=https://adaas-backend.onrender.com
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=adaas-xxxxx.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=adaas-xxxxx
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=adaas-xxxxx.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

2. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

3. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Follow the prompts:**
   - Set up and deploy? **Y**
   - Which scope? **Your account**
   - Link to existing project? **N**
   - Project name? **adaas**
   - Directory? Press **Enter**
   - Override settings? **N**

5. **Add Environment Variables in Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Select your **adaas** project
   - Go to **"Settings"** → **"Environment Variables"**
   - Add all `NEXT_PUBLIC_*` variables
   - Click **"Redeploy"**

6. **Note Your Frontend URL:**
   - Example: `https://adaas.vercel.app`

---

### Step 5: Update CORS (2 minutes)

1. Go back to **Render Dashboard**
2. Select **adaas-backend** service
3. Go to **"Environment"** tab
4. Update `ALLOWED_ORIGINS`:

   ```
   ALLOWED_ORIGINS=https://adaas.vercel.app,http://localhost:3000
   ```

5. Click **"Save Changes"** (service will auto-redeploy)

---

### Step 6: Test Your Deployment (5 minutes)

1. **Visit Your Frontend:** `https://adaas.vercel.app`
2. **Test Authentication:** Sign in with Google
3. **Test File Upload:** Upload a sample CSV
4. **Test Analysis:** Run survival analysis
5. **Test Persistence:** Wait 15 min, verify data still there

---

## 💰 Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| Backend (Render) | Free | $0 |
| Worker (Render) | Free | $0 |
| Storage (1GB) | Free | $0 |
| Redis (Upstash) | Free | $0 |
| Frontend (Vercel) | Free | $0 |
| Firebase Auth | Free | $0 |
| Gemini API | Free | $0 |
| **TOTAL** | | **$0/month** 🎉 |

---

## ⚠️ Free Tier Limitations

### Render
- ✅ 750 hours/month (24/7 coverage)
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold start: ~30 seconds
- ✅ 1GB persistent disk

### Upstash Redis
- ✅ 10,000 commands/day
- ✅ Good for ~50-100 jobs/day

### Vercel
- ✅ Unlimited bandwidth
- ✅ No cold starts

---

## 🔧 Troubleshooting

### Backend won't start
- Check Render logs
- Verify all environment variables are set
- Test Redis connection

### Frontend can't connect
- Verify `ALLOWED_ORIGINS` includes Vercel URL
- Check `NEXT_PUBLIC_API_URL` is correct
- Test backend health endpoint

### Files not persisting
- Verify `RENDER=true` is set
- Check disk mounted at `/data`

---

## 📚 Environment Variables Reference

### Backend (Render)
```
GEMINI_API_KEY=your_gemini_key
REDIS_HOST=ethical-pup-39760.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your_upstash_password
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
RENDER=true
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## ✅ Deployment Checklist

- [ ] Firebase project created
- [ ] Google authentication enabled
- [ ] Firebase credentials obtained
- [ ] Code pushed to GitHub
- [ ] Render Blueprint deployed
- [ ] Backend environment variables configured
- [ ] Worker environment variables configured
- [ ] Backend deployed successfully
- [ ] Frontend environment variables configured
- [ ] Frontend deployed to Vercel
- [ ] CORS updated with Vercel URL
- [ ] Authentication tested
- [ ] File upload tested
- [ ] Analysis tested
- [ ] Persistence tested

---

## 🎉 Success!

Your ADaaS application is now deployed at:
- **Frontend:** https://adaas.vercel.app
- **Backend:** https://adaas-backend.onrender.com
- **Total Cost:** $0/month

---

**Last Updated:** December 7, 2025  
**Version:** 1.0 - Free Deployment
