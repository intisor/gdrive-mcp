import DirectGDriveService from './direct-gdrive-service.js';
import SimpleMCPGDriveClient from './simple-mcp-client.js';

class HybridChatService {
  constructor() {
    this.driveService = null;
    this.mcpClient = null;
    this.useMCP = false;
    this.conversationHistory = new Map(); // userId -> messages[]
    this.quickPrompts = [
      {
        id: 'analyze-june-reports',
        title: 'June Reports Count',
        prompt: 'Show me all documents containing "June" in the name',
        icon: 'fas fa-calendar-alt',
        description: 'Find June-related documents',
      },
      {
        id: 'list-recent',
        title: 'Recent Files',
        prompt: 'Show me my 10 most recently modified files',
        icon: 'fas fa-clock',
        description: 'List recent files'
      },
      {
        id: 'search-files',
        title: 'Search Files',
        prompt: 'Search for files by name',
        icon: 'fas fa-search',
        description: 'Find specific files'
      },
      {
        id: 'root-folder',
        title: 'My Drive',
        prompt: 'Show me files in my main Drive folder',
        icon: 'fas fa-folder',
        description: 'Browse main folder'
      }
    ];
  }

  async initialize(driveService, mcpClient = null) {
    this.driveService = driveService;
    this.mcpClient = mcpClient;
    
    // Try to use MCP first, fall back to direct API
    if (mcpClient && mcpClient.isConnected) {
      this.useMCP = true;
      console.log('✅ Chat service using MCP client');
    } else if (driveService && driveService.isConnected) {
      this.useMCP = false;
      console.log('✅ Chat service using direct Google Drive API');
    } else {
      console.log('⚠️ Chat service initialized without working backend');
    }
  }

  getQuickPrompts() {
    return this.quickPrompts;
  }

  getConversationHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }

  addToHistory(userId, role, content, type = 'text') {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    
    const history = this.conversationHistory.get(userId);
    history.push({
      role,
      content,
      type,
      timestamp: new Date().toISOString(),
      backend: this.useMCP ? 'MCP' : 'Direct API'
    });

    // Keep only last 50 messages
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  async processMessage(message, userId) {
    try {
      console.log(`Processing message: "${message}" for user ${userId} using ${this.useMCP ? 'MCP' : 'Direct API'}`);
      
      // Add user message to history
      this.addToHistory(userId, 'user', message);

      const lowerMessage = message.toLowerCase();
      let response;

      // Try MCP first if available, then fall back to direct API
      if (this.useMCP && this.mcpClient) {
        try {
          response = await this.processMCPMessage(message, lowerMessage);
        } catch (mcpError) {
          console.error('MCP processing failed, falling back to direct API:', mcpError);
          this.useMCP = false;
          response = await this.processDirectMessage(message, lowerMessage);
        }
      } else {
        response = await this.processDirectMessage(message, lowerMessage);
      }

      // Add assistant response to history
      this.addToHistory(userId, 'assistant', response.content, response.type);

      return response;
    } catch (error) {
      console.error('Chat processing error:', error);
      const errorResponse = {
        content: `Sorry, I encountered an error: ${error.message}\n\n**Backend:** ${this.useMCP ? 'MCP Client' : 'Direct API'}\n**Error Details:** ${error.stack?.split('\n')[0] || 'No additional details'}`,
        type: 'error'
      };
      
      this.addToHistory(userId, 'assistant', errorResponse.content, errorResponse.type);
      return errorResponse;
    }
  }

  async processMCPMessage(message, lowerMessage) {
    if (lowerMessage.includes('june')) {
      return await this.analyzeMCPJuneDocuments();
    } else if (lowerMessage.includes('recent') || lowerMessage.includes('latest')) {
      return await this.getMCPRecentFiles();
    } else {
      return await this.getMCPGeneralHelp(message);
    }
  }

  async processDirectMessage(message, lowerMessage) {
    if (lowerMessage.includes('june')) {
      return await this.analyzeDirectJuneDocuments();
    } else if (lowerMessage.includes('recent') || lowerMessage.includes('latest')) {
      return await this.getDirectRecentFiles();
    } else if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
      return await this.searchDirectFiles(message);
    } else if (lowerMessage.includes('main') || lowerMessage.includes('root') || lowerMessage.includes('drive folder')) {
      return await this.getDirectRootFiles();
    } else {
      return await this.getDirectGeneralHelp(message);
    }
  }

  // MCP Methods
  async analyzeMCPJuneDocuments() {
    try {
      if (!this.mcpClient || !this.mcpClient.isConnected) {
        throw new Error('MCP client not connected');
      }

      const result = await this.mcpClient.client.callTool({
        name: 'search',
        arguments: {
          query: 'june OR June',
          maxResults: 20
        }
      });

      if (result.content && result.content[0] && result.content[0].text) {
        const searchResult = JSON.parse(result.content[0].text);
        const files = searchResult.files || [];
        
        if (files.length === 0) {
          return {
            content: "No documents containing 'June' found in your Google Drive using MCP.",
            type: 'text'
          };
        }

        let response = `**Found ${files.length} June documents using MCP:**\n\n`;
        files.forEach((file, index) => {
          response += `${index + 1}. **${file.name}**\n`;
          response += `   Modified: ${new Date(file.modifiedTime).toLocaleDateString()}\n\n`;
        });

        return {
          content: response,
          type: 'text'
        };
      } else {
        throw new Error('Invalid MCP response format');
      }
    } catch (error) {
      console.error('MCP June analysis error:', error);
      throw error;
    }
  }

  async getMCPRecentFiles() {
    try {
      if (!this.mcpClient || !this.mcpClient.isConnected) {
        throw new Error('MCP client not connected');
      }

      const result = await this.mcpClient.listFiles('root', 10);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const files = result.content || [];
      if (files.length === 0) {
        return {
          content: "No files found in your Google Drive using MCP.",
          type: 'text'
        };
      }

      let response = `**Your Recent Files (${files.length} found via MCP):**\n\n`;
      files.forEach((file, index) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const icon = isFolder ? '📁' : '📄';
        response += `${index + 1}. ${icon} **${file.name}**\n`;
        response += `   Modified: ${new Date(file.modifiedTime).toLocaleDateString()}\n\n`;
      });

      return {
        content: response,
        type: 'text'
      };
    } catch (error) {
      console.error('MCP recent files error:', error);
      throw error;
    }
  }

  async getMCPGeneralHelp(message) {
    return {
      content: `I can help you with your Google Drive using MCP! Here's what I can do:

**🔍 Available Commands:**
• "Show me June documents" - Find files with "June" in the name
• "Show recent files" - List your most recent files

**💡 Note:** Currently using MCP backend for enhanced capabilities.

**Example:** "Find June reports" or "Show me recent documents"`,
      type: 'text'
    };
  }

  // Direct API Methods (from the previous simplified version)
  async analyzeDirectJuneDocuments() {
    try {
      const response = await this.driveService.analyzeJuneDocuments();
      return {
        content: response + '\n\n**(Using Direct Google Drive API)**',
        type: 'text'
      };
    } catch (error) {
      console.error('Direct June analysis error:', error);
      throw error;
    }
  }

  async getDirectRecentFiles() {
    try {
      const result = await this.driveService.listFiles('root', 10);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const files = result.content;
      if (files.length === 0) {
        return {
          content: "No files found in your Google Drive.",
          type: 'text'
        };
      }

      let response = `**Your Recent Files (${files.length} found via Direct API):**\n\n`;
      files.forEach((file, index) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const icon = isFolder ? '📁' : '📄';
        response += `${index + 1}. ${icon} **${file.name}**\n`;
        response += `   Modified: ${new Date(file.modifiedTime).toLocaleDateString()}\n`;
        if (file.size) {
          response += `   Size: ${this.formatFileSize(file.size)}\n`;
        }
        response += `\n`;
      });

      return {
        content: response,
        type: 'text'
      };
    } catch (error) {
      console.error('Direct recent files error:', error);
      throw error;
    }
  }

  async searchDirectFiles(message) {
    try {
      const searchMatch = message.match(/search\\s+(?:for\\s+)?["']?([^"']+)["']?/i) ||
                         message.match(/find\\s+["']?([^"']+)["']?/i);
      
      let searchTerm = 'documents';
      if (searchMatch && searchMatch[1]) {
        searchTerm = searchMatch[1].trim();
      }

      const searchQuery = `name contains '${searchTerm}' and trashed=false`;
      const result = await this.driveService.searchFiles(searchQuery, 15);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const files = result.content;
      if (files.length === 0) {
        return {
          content: `No files found matching "${searchTerm}".`,
          type: 'text'
        };
      }

      let response = `**Search Results for "${searchTerm}" (${files.length} found):**\n\n`;
      files.forEach((file, index) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const icon = isFolder ? '📁' : '📄';
        response += `${index + 1}. ${icon} **${file.name}**\n`;
        response += `   Modified: ${new Date(file.modifiedTime).toLocaleDateString()}\n\n`;
      });

      return {
        content: response,
        type: 'text'
      };
    } catch (error) {
      console.error('Direct search error:', error);
      throw error;
    }
  }

  async getDirectRootFiles() {
    try {
      const result = await this.driveService.listFiles('root', 20);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const files = result.content;
      if (files.length === 0) {
        return {
          content: "Your Google Drive appears to be empty.",
          type: 'text'
        };
      }

      const folders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
      const regularFiles = files.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');

      let response = `**Your Google Drive (${files.length} items):**\n\n`;
      
      if (folders.length > 0) {
        response += `**📁 Folders (${folders.length}):**\n`;
        folders.forEach((folder, index) => {
          response += `${index + 1}. **${folder.name}**\n`;
        });
        response += `\n`;
      }

      if (regularFiles.length > 0) {
        response += `**📄 Files (${regularFiles.length}):**\n`;
        regularFiles.slice(0, 10).forEach((file, index) => {
          response += `${index + 1}. **${file.name}**\n`;
          response += `   Modified: ${new Date(file.modifiedTime).toLocaleDateString()}\n`;
        });
        
        if (regularFiles.length > 10) {
          response += `\n... and ${regularFiles.length - 10} more files\n`;
        }
      }

      return {
        content: response,
        type: 'text'
      };
    } catch (error) {
      console.error('Direct root files error:', error);
      throw error;
    }
  }

  async getDirectGeneralHelp(message) {
    return {
      content: `I can help you with your Google Drive! Here's what I can do:

**🔍 Search & Find:**
• "Show me June documents" - Find files with "June" in the name
• "Search for reports" - Find files matching your search
• "Find presentation files" - Search for specific file types

**📁 Browse Files:**
• "Show recent files" - List your most recent files
• "Show my Drive folder" - Browse your main Drive folder

**💡 Quick Actions:**
Use the buttons above for common tasks, or just ask me naturally!

**Backend Status:** ${this.useMCP ? 'Using MCP Client' : 'Using Direct Google Drive API'}

**Example:** "Find all my project files" or "Show me recent documents"`,
      type: 'text'
    };
  }

  formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default HybridChatService;
