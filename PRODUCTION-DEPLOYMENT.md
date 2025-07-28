# 🚀 Production Deployment Checklist

## ✅ Pre-Deployment Verification

### Local Development Status
- ✅ **MCP Client Working**: Simple MCP client implemented and tested
- ✅ **Hybrid Backend**: MCP + Direct API for reliability  
- ✅ **Environment Variables**: All configs updated for production
- ✅ **CORS Configuration**: Updated for production domains
- ✅ **Package Dependencies**: MCP package installed locally
- ✅ **Git Repository**: All changes committed and pushed

### Production Configuration Files
- ✅ **render.yaml**: Updated with all required environment variables
- ✅ **package.json**: Dependencies updated (MCP package v0.2.0)
- ✅ **server.js**: CORS origins updated for production
- ✅ **simple-mcp-client.js**: Reliable MCP client for production

## 🌐 Deployment Steps

### Backend Deployment (Render.com)

1. **Create Render Service**:
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect GitHub repo: `intisor/gdrive-mcp`
   - Use settings from `render.yaml`

2. **Set Environment Variables**:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://intisor.github.io/gdrive-mcp
   SESSION_SECRET=auto-generated-by-render
   JWT_SECRET=auto-generated-by-render
   GOOGLE_CLIENT_ID=1077244177227-tg0ju9jbmvu2lhk43qi2kkaufc0ljkdm.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   GOOGLE_REDIRECT_URI=https://your-render-app.onrender.com/auth/google/callback
   CLIENT_ID=1077244177227-tg0ju9jbmvu2lhk43qi2kkaufc0ljkdm.apps.googleusercontent.com
   CLIENT_SECRET=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
   GDRIVE_CREDS_DIR=/tmp
   PORT=3000
   ```

3. **Deploy Backend**:
   - Render will auto-deploy from GitHub
   - Monitor build logs for success
   - Note your backend URL: `https://your-app.onrender.com`

### Frontend Deployment (GitHub Pages)

1. **Verify GitHub Pages Setup**:
   - Go to GitHub repo settings
   - Pages section → Source: "Deploy from a branch"
   - Branch: `main` → Folder: `/docs`
   - Custom domain (optional): Your domain

2. **Update Frontend Configuration**:
   - Frontend automatically uses localStorage for backend URL
   - Users will input: `https://your-app.onrender.com`

### Google Cloud Configuration

1. **Update OAuth Redirect URIs**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - APIs & Services → Credentials
   - Edit OAuth 2.0 Client
   - Add redirect URI: `https://your-app.onrender.com/auth/google/callback`

## 🔧 Post-Deployment Testing

### Backend Health Check
- Test: `https://your-app.onrender.com/api/health`
- Should return: `{"status":"healthy","mcpConnected":true,"driveConnected":true}`

### Frontend Access
- Visit: `https://intisor.github.io/gdrive-mcp`
- Should load login page
- Backend URL input: `https://your-app.onrender.com`

### Full Integration Test
1. Login with Google account
2. Test chat functionality (quick prompts)
3. Test file search and browsing
4. Verify MCP status in dashboard

## 🚨 Troubleshooting

### Common Issues

**MCP Connection Failed**:
- Check environment variables are set correctly
- Verify `@isaacphi/mcp-gdrive` package is installed
- Check logs for missing CLIENT_ID/CLIENT_SECRET

**CORS Errors**:
- Verify frontend URL matches CORS origins in server.js
- Check both `intisor.github.io` and `intisor.github.io/gdrive-mcp`

**Google OAuth Errors**:
- Verify redirect URI matches exactly
- Check Google Cloud console configuration
- Ensure Google Drive API is enabled

### Debug Commands
```bash
# Check MCP package
npm list @isaacphi/mcp-gdrive

# Test MCP connection locally
node test-simple-mcp.js

# Check environment variables
node -e "console.log(process.env.GOOGLE_CLIENT_ID)"
```

## 📊 Production Monitoring

### Key Metrics to Watch
- **Backend Response Time**: Should be < 2s (after cold start)
- **MCP Connection Status**: Monitor `/api/health` endpoint
- **Error Rates**: Check Render logs for errors
- **Google API Quotas**: Monitor usage in Google Cloud Console

### Cold Start Behavior
- **First Request**: 10-30 seconds (Render free tier)
- **Subsequent Requests**: < 2 seconds
- **Auto-sleep**: After 15 minutes of inactivity

## ✅ Deployment Complete!

Your MCP Google Drive webapp is now live at:
- **Frontend**: `https://intisor.github.io/gdrive-mcp`
- **Backend**: `https://your-app.onrender.com`
- **Features**: Full MCP chat functionality with Direct API fallback
