# Google Drive MCP Web App

A web application that uses the `@isaacphi/mcp-gdrive` MCP server to interact with Google Drive in the background.

## Features

- 📁 Browse Google Drive files and folders
- 🔍 Search files by name or content
- ⬆️ Upload files to Google Drive
- ⬇️ Download files from Google Drive
- 📂 Create new folders
- 🗑️ Delete files and folders
- 🔄 Real-time status monitoring of MCP server connection

## Architecture

This application demonstrates how to build a web app that uses an MCP (Model Context Protocol) server in the background:

```
Web Browser (Frontend) 
    ↕ HTTP/REST API
Express.js Server (Backend)
    ↕ MCP Protocol
@isaacphi/mcp-gdrive (MCP Server)
    ↕ Google Drive API
Google Drive
```

### How it works:

1. **MCP Server**: The `@isaacphi/mcp-gdrive` server runs as a separate process and handles all Google Drive API interactions
2. **MCP Client**: Our Express.js server includes an MCP client that communicates with the MCP server using the Model Context Protocol
3. **Web API**: The Express.js server exposes REST API endpoints that the frontend can call
4. **Frontend**: A modern HTML/CSS/JavaScript interface that provides a user-friendly way to interact with Google Drive

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Google Drive API credentials** (Client ID and Secret)
3. **MCP GDrive Server**: Install globally with `npm install -g @isaacphi/mcp-gdrive`

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Install the MCP GDrive Server

```bash
npm install -g @isaacphi/mcp-gdrive
```

### 3. Google Drive API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create credentials (OAuth 2.0 Client ID)
5. Add `http://localhost:3000/auth/callback` to the authorized redirect URIs

### 4. Configure Environment Variables

Edit the `.env` file and add your Google Drive API credentials:

```env
# Google Drive API Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# MCP Server Configuration
MCP_SERVER_PATH=@isaacphi/mcp-gdrive
MCP_SERVER_ARGS=

# Web App Configuration
PORT=3000
NODE_ENV=development
```

### 5. Run the Application

```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

The application will be available at `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check server and MCP connection status |
| GET | `/api/files` | List files in Google Drive |
| GET | `/api/search` | Search files by query |
| POST | `/api/upload` | Upload a file to Google Drive |
| GET | `/api/download/:fileId` | Download a file from Google Drive |
| POST | `/api/folders` | Create a new folder |
| DELETE | `/api/files/:fileId` | Delete a file or folder |
| GET | `/api/files/:fileId` | Get file information |

## File Structure

```
mcp-gdrive-webapp/
├── server.js              # Main Express.js server
├── mcp-client.js          # MCP client wrapper
├── package.json           # Node.js dependencies
├── .env                   # Environment variables
├── public/
│   └── index.html         # Frontend interface
├── uploads/               # Temporary upload directory
└── downloads/             # Downloaded files directory
```

## Key Components

### MCP Client (`mcp-client.js`)
- Handles connection to the MCP server
- Wraps MCP tool calls in easy-to-use methods
- Manages connection state and error handling

### Express Server (`server.js`)
- Provides REST API endpoints
- Handles file uploads with multer
- Serves the frontend HTML
- Manages MCP client lifecycle

### Frontend (`public/index.html`)
- Modern, responsive interface
- Real-time status monitoring
- File upload/download functionality
- Search and folder management

## Development Tips

1. **MCP Server Logs**: Check the console for MCP server connection status and errors
2. **File Uploads**: Files are temporarily stored in the `uploads/` directory before being sent to Google Drive
3. **Error Handling**: All API calls include proper error handling and user feedback
4. **Status Monitoring**: The frontend displays real-time connection status in the top-right corner

## Troubleshooting

### MCP Server Connection Issues
- Ensure `@isaacphi/mcp-gdrive` is installed globally
- Check that your Google Drive API credentials are valid
- Verify the MCP server process is running

### Upload/Download Issues
- Check file permissions in the `uploads/` and `downloads/` directories
- Ensure sufficient disk space
- Verify Google Drive API quotas

### Authentication Issues
- Double-check your Google Drive API credentials
- Ensure the redirect URI is correctly configured in Google Cloud Console
- Check that the Google Drive API is enabled for your project

## License

MIT License - feel free to modify and distribute as needed.
