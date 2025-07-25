# Google Drive API Setup for Production

## Issue: MCP Server Authentication

The MCP Google Drive server needs proper authentication to access the Google Drive API.

## Solution Options:

### Option 1: Service Account (Recommended for Production)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Create Service Account:
   - Name: `mcp-gdrive-service`
   - Role: `Editor` or `Google Drive API` permissions
4. Download JSON key file
5. Convert to base64 and add as environment variable

### Option 2: Use OAuth Tokens (Simpler)
The current setup uses OAuth, but we need to ensure the MCP server gets the access tokens.

## Quick Fix for Render:

Add these environment variables to your Render service:

```
CLIENT_ID=1077244177227-tg0ju9jbmvu2lhk43qi2kkaufc0ljkdm.apps.googleusercontent.com
CLIENT_SECRET=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
JWT_SECRET=gdrive-mcp-jwt-secret-2025-very-long-and-secure
```

## Alternative: Simplified Version

If the MCP server continues to have auth issues, we can modify the backend to use the Google Drive API directly instead of through MCP, which would be more reliable for production.
