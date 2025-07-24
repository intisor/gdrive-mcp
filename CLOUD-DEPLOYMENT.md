# 🚀 **Deployment Guide: Google Cloud Run + GitHub Pages**

## 📋 **Architecture Overview**

```
📱 Frontend (GitHub Pages)     →     ☁️ Backend (Cloud Run)
   Static Website                     Node.js MCP Server
   intisor.github.io/gdrive-mcp  →    your-app.run.app
```

## 🎯 **FREE Tier Limits**
- **GitHub Pages**: Unlimited for public repos
- **Google Cloud Run**: 2 million requests/month, 400,000 GB-seconds FREE

---

## 🏗️ **Step 1: Deploy Backend to Google Cloud Run**

### **1.1 Install Google Cloud CLI**
```bash
# Download from: https://cloud.google.com/sdk/docs/install
# Or use PowerShell (Windows):
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

### **1.2 Setup Google Cloud Project**
```bash
# Login to Google Cloud
gcloud auth login

# Set your project (or create one)
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### **1.3 Deploy Your App**
```bash
# Deploy from your project directory
npm run deploy

# OR manually:
gcloud run deploy mcp-gdrive \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10 \
  --min-instances=0
```

### **1.4 Get Your Service URL**
After deployment, you'll get a URL like:
```
https://mcp-gdrive-xxxxx-uc.a.run.app
```
**💾 SAVE THIS URL** - you'll need it for the frontend!

---

## 🌐 **Step 2: Setup GitHub Pages**

### **2.1 Enable GitHub Pages**
1. Go to your GitHub repo: `https://github.com/intisor/gdrive-mcp`
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**

Your frontend will be available at:
```
https://intisor.github.io/gdrive-mcp/docs/
```

### **2.2 Update Frontend Configuration**
Edit `docs/index.html` and set your Cloud Run URL:
```javascript
// Line ~120, update the default endpoint:
document.getElementById('apiEndpoint').value = 'https://your-service.run.app';
```

---

## 🔐 **Step 3: Update Google OAuth Settings**

### **3.1 Add Redirect URIs**
In Google Cloud Console → APIs & Credentials → OAuth 2.0 Client IDs:

**Add these Authorized Redirect URIs:**
```
https://your-service.run.app/auth/google/callback
https://intisor.github.io/gdrive-mcp/docs/
```

### **3.2 Update Environment Variables**
Set these in Cloud Run:
```bash
# Set environment variables for your Cloud Run service
gcloud run services update mcp-gdrive \
  --set-env-vars="FRONTEND_URL=https://intisor.github.io" \
  --set-env-vars="SESSION_SECRET=your-random-secret-here" \
  --set-env-vars="GOOGLE_CLIENT_ID=your-client-id" \
  --set-env-vars="GOOGLE_CLIENT_SECRET=your-client-secret" \
  --region=us-central1
```

---

## ✅ **Step 4: Test Your Deployment**

### **4.1 Test Backend Health**
```bash
curl https://your-service.run.app/api/health
```
Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 120.5,
  "mcpConnected": false,
  "environment": "production"
}
```

### **4.2 Test Frontend**
1. Open: `https://intisor.github.io/gdrive-mcp/docs/`
2. Enter your Cloud Run URL
3. Click "Connect to Backend"
4. Should show "Connected!" message

---

## 🚨 **Troubleshooting**

### **Common Issues:**

**❌ CORS Error:**
```
Access to fetch at 'https://your-service.run.app' from origin 'https://intisor.github.io' has been blocked by CORS policy
```
**✅ Solution:** Check that your Cloud Run service has the correct CORS settings in `server.js`

**❌ OAuth Error:**
```
redirect_uri_mismatch
```
**✅ Solution:** Make sure all redirect URIs are added to Google Cloud Console

**❌ Cloud Run Error:**
```
Service not found
```
**✅ Solution:** Check your project ID and region in deployment commands

### **Debugging Commands:**
```bash
# Check Cloud Run logs
gcloud run services logs read mcp-gdrive --region=us-central1

# Check service details
gcloud run services describe mcp-gdrive --region=us-central1

# Update environment variables
gcloud run services update mcp-gdrive --set-env-vars="KEY=value" --region=us-central1
```

---

## 💰 **Cost Optimization**

### **Cloud Run Settings:**
- **Min instances**: 0 (scales to zero when not used)
- **Max instances**: 10 (adjust based on usage)
- **Memory**: 512Mi (sufficient for Node.js app)
- **CPU**: 1 (default)

### **Expected Costs:**
- **10 friends × 3 times/month = 30 requests/month**
- **Cost**: ~$0.00 (well within free tier)

---

## 🎯 **Quick Commands Summary**

```bash
# Deploy to Cloud Run
npm run deploy

# Set environment variables
gcloud run services update mcp-gdrive \
  --set-env-vars="FRONTEND_URL=https://intisor.github.io,SESSION_SECRET=your-secret" \
  --region=us-central1

# View logs
gcloud run services logs read mcp-gdrive --region=us-central1

# Test health
curl https://your-service.run.app/api/health
```

## 🔗 **Final URLs**
- **Frontend**: `https://intisor.github.io/gdrive-mcp/docs/`
- **Backend**: `https://your-service.run.app`
- **Health Check**: `https://your-service.run.app/api/health`

---

🎉 **Your MCP Google Drive app is now deployed and completely FREE!**
