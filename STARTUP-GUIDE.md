# MCP Google Drive Web Application

## 🚀 Quick Start - FIXED FOR WINDOWS

### Method 1: Simple Start (RECOMMENDED)
```bash
# Double-click this file:
start-simple.bat
```

### Method 2: Enhanced Start  
```bash
# Double-click this file:
start.bat
```

### Method 3: Manual Start
```bash
npm install
npm start
```

## 🔧 NPXENOENT Error - SOLVED!

### ✅ What was fixed:
- **Multiple command attempts**: Tries `npx.cmd`, `npx`, `cmd /c npx`, `powershell`
- **PATH detection**: Automatically adds npm global path
- **Fallback mode**: App works even if MCP server fails to connect
- **Error handling**: Graceful degradation to basic Google Drive functionality

### ✅ Fallback Mode Features:
When MCP connection fails, the app still provides:
- ✅ **Google OAuth login**
- ✅ **File upload/download/delete**
- ✅ **Search functionality**
- ✅ **Folder creation**
- ✅ **Manual navigation guides** for June reports

## 📱 Access the Application

Once started, open your browser and go to:
**http://localhost:3000**

## � Connection Status Indicators

- 🟢 **Connected**: Full MCP functionality + AI chat
- 🟡 **Fallback Mode**: Basic functionality + manual guidance
- 🔴 **Error**: Check server logs

## 🎯 June Reports Count

### If MCP Connected:
- AI automatically searches for "june reports" files
- Counts and lists all matching documents
- Provides detailed analysis

### If Fallback Mode:
- Provides step-by-step manual instructions
- Guides you to search for "june" or "reports"
- Shows how to navigate to the correct folders

## 🛠️ Troubleshooting

### Windows ENOENT Error (FIXED):
1. ✅ **Detection**: Script checks for Node.js and npm
2. ✅ **PATH fix**: Automatically adds npm global directory
3. ✅ **Multiple attempts**: Tries different command variations
4. ✅ **Fallback**: Works even if npx completely fails

### If server still won't start:
1. **Check Node.js**: `node --version` (should be v16+)
2. **Check npm**: `npm --version`
3. **Try manual**: `npm install` then `npm start`
4. **Use simple start**: `start-simple.bat`

### If browser doesn't open:
- Manually go to: **http://localhost:3000**
- Check console for port conflicts
- Try different port in `.env` file

## � What's Working Now

✅ **Windows compatibility** - Fixed npx spawn issues  
✅ **Graceful fallback** - Works without MCP server  
✅ **Multiple connection methods** - Tries various command formats  
✅ **Clear error messages** - Shows what's happening  
✅ **Manual guidance** - Helps with June reports when MCP fails  

## 🎉 Ready to Use!

The application now handles Windows environment issues gracefully and provides a smooth experience regardless of MCP server connection status!
