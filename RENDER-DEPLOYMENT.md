# Render.com Deployment Guide

## 🚀 Deploy to Render (Free)

### Step 1: Sign up for Render
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account

### Step 2: Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub account if not already connected
3. Select the `gdrive-mcp` repository
4. Configure the service:
   - **Name**: `mcp-gdrive-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### Step 3: Set Environment Variables
In the Render dashboard, go to Environment tab and add:

```
NODE_ENV=production
FRONTEND_URL=https://intisor.github.io
SESSION_SECRET=your-random-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-app-name.onrender.com/auth/google/callback
```

**Note**: Replace `your-app-name` with your actual Render app name.

### Step 4: Update Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client
4. Add to **Authorized redirect URIs**:
   ```
   https://your-app-name.onrender.com/auth/google/callback
   ```

### Step 5: Deploy
1. Click "Create Web Service"
2. Render will automatically deploy from your GitHub repo
3. Your backend URL will be: `https://your-app-name.onrender.com`

### Step 6: Update Frontend
Update your frontend to use the new backend URL:
`https://your-app-name.onrender.com`

## 📝 Notes
- Free tier: 750 hours/month, spins down after 15min inactivity
- First request after sleep may take 10-30 seconds
- Perfect for personal projects and demos
- Automatic HTTPS included
- Auto-deploys on GitHub pushes
