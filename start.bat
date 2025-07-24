@echo off
echo Starting MCP Google Drive Web Application...
echo.
cd /d "c:\Users\DELL\Desktop\mcp-gdrive"
echo Current directory: %CD%
echo.

echo Checking Node.js and npm...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found in PATH. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found in PATH. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js and npm found! ✓
echo.

echo Installing dependencies (if needed)...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo Installing MCP Google Drive server globally...
call npm install -g @isaacphi/mcp-gdrive
if %errorlevel% neq 0 (
    echo WARNING: Failed to install MCP server globally. App will run in fallback mode.
)
echo.

echo Setting up environment variables...
set CLIENT_ID=1077244177227-tg0ju9jbmvu2lhk43qi2kkaufc0ljkdm.apps.googleusercontent.com
set CLIENT_SECRET=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
set GDRIVE_CREDS_DIR=%CD%
set PATH=%PATH%;%APPDATA%\npm
echo Environment variables set ✓
echo.

echo Starting the server...
echo Server will be available at: http://localhost:3000
echo MCP server credentials directory: %CD%
echo.
echo If MCP connection fails, the app will run in fallback mode with basic functionality.
echo.
call npm start
pause
