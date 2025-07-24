import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';

import MCPGDriveClient from './mcp-client.js';
import ChatService from './chat-service.js';
import passport, { verifyToken, generateToken, getUserById } from './auth.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://intisor.github.io",
      process.env.FRONTEND_URL || 'https://intisor.github.io'
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// Initialize services
const mcpClient = new MCPGDriveClient();
const chatService = new ChatService();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://intisor.github.io',
    process.env.FRONTEND_URL || 'https://intisor.github.io'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Initialize MCP connection on server start
async function initializeMCP() {
  try {
    console.log('🔄 Initializing MCP connection...');
    const connected = await mcpClient.connect();
    if (connected) {
      console.log('✅ MCP GDrive server connected successfully');
      await chatService.initialize(mcpClient);
      console.log('✅ Chat service initialized with MCP support');
    } else {
      console.log('⚠️ MCP GDrive server connection failed - running in fallback mode');
      await chatService.initialize(null); // Initialize without MCP
      console.log('✅ Chat service initialized in fallback mode');
    }
  } catch (error) {
    console.error('❌ Error initializing MCP:', error.message);
    console.log('⚠️ Continuing in fallback mode...');
    try {
      await chatService.initialize(null); // Initialize without MCP
      console.log('✅ Chat service initialized in fallback mode');
    } catch (fallbackError) {
      console.error('❌ Failed to initialize chat service:', fallbackError);
    }
  }
}

// Authentication Routes
app.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = generateToken(req.user.id);
    
    // Set token as cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.redirect('/dashboard');
  }
);

app.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/auth/me', verifyToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture
    }
  });
});

// Health check endpoint for Cloud Run
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mcpConnected: mcpClient.isConnected(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Chat Routes
app.get('/api/chat/prompts', verifyToken, (req, res) => {
  res.json({ prompts: chatService.getQuickPrompts() });
});

app.get('/api/chat/history', verifyToken, (req, res) => {
  const history = chatService.getConversationHistory(req.user.id);
  res.json({ history });
});

app.post('/api/chat/message', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatService.processMessage(req.user.id, message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes

// Health check
app.get('/api/health', verifyToken, (req, res) => {
  res.json({ 
    status: 'ok', 
    mcpConnected: mcpClient.isConnected,
    user: req.user.email,
    timestamp: new Date().toISOString()
  });
});

// List files in Google Drive
app.get('/api/files', verifyToken, async (req, res) => {
  try {
    const { folderId = 'root', maxResults = 10 } = req.query;
    const result = await mcpClient.listFiles(folderId, parseInt(maxResults));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search files in Google Drive
app.get('/api/search', verifyToken, async (req, res) => {
  try {
    const { q: query, maxResults = 10 } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const result = await mcpClient.searchFiles(query, parseInt(maxResults));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file to Google Drive
app.post('/api/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { parentFolderId = 'root' } = req.body;
    const result = await mcpClient.uploadFile(
      req.file.path,
      req.file.originalname,
      parentFolderId
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download file from Google Drive
app.get('/api/download/:fileId', verifyToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const downloadPath = `downloads/${fileId}`;
    
    const result = await mcpClient.downloadFile(fileId, downloadPath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create folder in Google Drive
app.post('/api/folders', verifyToken, async (req, res) => {
  try {
    const { folderName, parentFolderId = 'root' } = req.body;
    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const result = await mcpClient.createFolder(folderName, parentFolderId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file from Google Drive
app.delete('/api/files/:fileId', verifyToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const result = await mcpClient.deleteFile(fileId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file information
app.get('/api/files/:fileId', verifyToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const result = await mcpClient.getFileInfo(fileId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve different pages based on authentication
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Socket.IO for real-time chat
io.on('connection', (socket) => {
  console.log('User connected to chat:', socket.id);
  
  socket.on('join_chat', (userData) => {
    socket.userData = userData;
    console.log(`${userData.name} joined chat`);
  });
  
  socket.on('chat_message', async (data) => {
    try {
      const { message, userId } = data;
      const response = await chatService.processMessage(userId, message);
      
      // Send response back to the user
      socket.emit('chat_response', {
        message: response,
        timestamp: new Date()
      });
    } catch (error) {
      socket.emit('chat_error', { error: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected from chat:', socket.id);
  });
});

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await initializeMCP();
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await mcpClient.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await mcpClient.disconnect();
  process.exit(0);
});

export default app;
