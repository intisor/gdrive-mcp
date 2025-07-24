#!/usr/bin/env pwsh
Write-Host "Starting MCP Google Drive Web Application..." -ForegroundColor Green
Write-Host ""

# Change to the project directory
Set-Location "c:\Users\DELL\Desktop\mcp-gdrive"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Install dependencies if needed
Write-Host "Installing dependencies (if needed)..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "Installing MCP Google Drive server globally..." -ForegroundColor Cyan
npm install -g @isaacphi/mcp-gdrive

Write-Host ""
Write-Host "Setting up environment variables..." -ForegroundColor Cyan
$env:CLIENT_ID = "1077244177227-tg0ju9jbmvu2lhk43qi2kkaufc0ljkdm.apps.googleusercontent.com"
$env:CLIENT_SECRET = "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"
$env:GDRIVE_CREDS_DIR = Get-Location

Write-Host ""
Write-Host "Starting the server..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Yellow
Write-Host "MCP server credentials directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Start the application
npm start
