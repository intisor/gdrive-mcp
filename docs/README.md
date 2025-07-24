# 🌐 **Frontend - GitHub Pages**

This folder contains the frontend for the MCP Google Drive Manager, designed to be hosted on GitHub Pages.

## 📁 **Files:**

- **`index.html`** - Landing page with backend configuration
- **`login.html`** - Google OAuth login page  
- **`dashboard.html`** - Main application dashboard

## 🚀 **How it works:**

1. **User visits**: `https://intisor.github.io/gdrive-mcp/docs/`
2. **Configures backend**: Enters their Cloud Run URL
3. **Authenticates**: Logs in with Google OAuth via the backend
4. **Uses app**: Manages Google Drive files with AI assistance

## 🔗 **Backend Integration:**

The frontend dynamically connects to your Google Cloud Run backend by:
- Storing the backend URL in localStorage
- Prefixing all API calls with the backend URL
- Using CORS for cross-origin requests
- Maintaining authentication state

## 🛠️ **Development:**

To test locally:
```bash
# Serve the files locally
python -m http.server 8000

# Visit: http://localhost:8000
```

## 🌍 **Live URLs:**

- **Frontend**: `https://intisor.github.io/gdrive-mcp/docs/`
- **Backend**: `https://your-service.run.app` (after deployment)

## 💡 **Features:**

- 📱 Responsive design with Tailwind CSS
- 🔄 Real-time chat with Socket.IO
- 📁 File management (upload, download, delete, create folders)
- 🔍 Smart search functionality
- 🤖 AI-powered Google Drive assistance
- 🔐 Secure Google OAuth authentication

---

**Note**: This frontend is designed to work with the Node.js backend deployed on Google Cloud Run.
