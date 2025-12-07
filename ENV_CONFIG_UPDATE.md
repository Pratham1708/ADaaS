# Environment Configuration Update

## What Changed

The default API URL has been changed from `localhost:8000` to the production Render backend URL.

### Before:
```javascript
// next.config.js
NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

### After:
```javascript
// next.config.js
NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://adaas-backend.onrender.com'
```

## Why This Change?

Previously, if the environment variable wasn't set in Vercel, the app would fall back to `localhost:8000`, causing the deployed app to fail. Now:

- ✅ **Production (Vercel)**: Uses Render backend by default
- ✅ **Local Development**: Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local`

## For Local Development

If you want to run the frontend locally and connect to a local backend:

1. Create/update `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

2. Restart your dev server:
```bash
cd frontend
npm run dev
```

## For Production (Vercel)

No action needed! The app will automatically use the Render backend URL.

Optionally, you can still set the environment variable in Vercel dashboard for explicit configuration:
- Key: `NEXT_PUBLIC_API_URL`
- Value: `https://adaas-backend.onrender.com`

## Benefits

1. **No Vercel Configuration Required**: Works out of the box
2. **Flexible for Development**: Easy to switch to local backend
3. **Production-First**: Defaults to production backend
4. **Explicit Override**: Can still override via environment variables
