@echo off
echo ===============================================
echo  MCP Google Drive Web App - Simple Start
echo ===============================================
echo.

cd /d "c:\Users\DELL\Desktop\mcp-gdrive"
echo Working in: %CD%
echo.

echo [1/4] Checking requirements...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install from https://nodejs.org/
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo ✓ Node.js found

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found! Please install Node.js from https://nodejs.org/
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo ✓ npm found
echo.

echo [2/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo ✓ Dependencies installed

echo [2.5/4] Checking MCP server availability...
call npm list -g @isaacphi/mcp-gdrive >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ MCP server not globally installed. Attempting to install...
    call npm install -g @isaacphi/mcp-gdrive
    if %errorlevel% neq 0 (
        echo ⚠️ Failed to install MCP server globally. App will run in fallback mode.
    ) else (
        echo ✓ MCP server installed globally
    )
) else (
    echo ✓ MCP server found globally
)
echo.

echo [3/4] Setting up environment...
set CLIENT_ID=1077244177227-tg0ju9jbmvu2lhk43qi2kkaufc0ljkdm.apps.googleusercontent.com
set CLIENT_SECRET=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
set GDRIVE_CREDS_DIR=%CD%
echo ✓ Environment configured
echo.

echo [4/4] Starting server...
echo.
echo 🌐 Server starting at: http://localhost:3000
echo 📁 Credentials directory: %CD%
echo.
echo ⚠️  Note: If MCP connection fails, the app will run in fallback mode
echo    with basic Google Drive functionality through the web interface.
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

call npm start

echo.
echo Server stopped. Press any key to exit...
pause >nul
