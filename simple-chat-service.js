class SimpleChatService {
  constructor() {
    this.driveService = null;
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

  async initialize(driveService) {
    this.driveService = driveService;
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
      timestamp: new Date().toISOString()
    });

    // Keep only last 50 messages
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  async processMessage(message, userId) {
    try {
      if (!this.driveService || !this.driveService.isConnected) {
        return {
          content: "Google Drive service is not connected. Please try refreshing the page.",
          type: 'error'
        };
      }

      // Add user message to history
      this.addToHistory(userId, 'user', message);

      const lowerMessage = message.toLowerCase();
      let response;

      if (lowerMessage.includes('june')) {
        response = await this.analyzeJuneDocuments();
      } else if (lowerMessage.includes('recent') || lowerMessage.includes('latest')) {
        response = await this.getRecentFiles();
      } else if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
        response = await this.searchFiles(message);
      } else if (lowerMessage.includes('main') || lowerMessage.includes('root') || lowerMessage.includes('drive folder')) {
        response = await this.getRootFiles();
      } else {
        response = await this.getGeneralHelp(message);
      }

      // Add assistant response to history
      this.addToHistory(userId, 'assistant', response.content, response.type);

      return response;
    } catch (error) {
      console.error('Chat processing error:', error);
      const errorResponse = {
        content: `Sorry, I encountered an error: ${error.message}`,
        type: 'error'
      };
      
      this.addToHistory(userId, 'assistant', errorResponse.content, errorResponse.type);
      return errorResponse;
    }
  }

  async analyzeJuneDocuments() {
    try {
      const response = await this.driveService.analyzeJuneDocuments();
      return {
        content: response,
        type: 'text'
      };
    } catch (error) {
      return {
        content: `Error analyzing June documents: ${error.message}`,
        type: 'error'
      };
    }
  }

  async getRecentFiles() {
    try {
      const result = await this.driveService.listFiles('root', 10);
      
      if (result.error) {
        return {
          content: `Error getting recent files: ${result.error}`,
          type: 'error'
        };
      }

      const files = result.content;
      if (files.length === 0) {
        return {
          content: "No files found in your Google Drive.",
          type: 'text'
        };
      }

      let response = `**Your Recent Files (${files.length} found):**\n\n`;
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
      return {
        content: `Error getting recent files: ${error.message}`,
        type: 'error'
      };
    }
  }

  async searchFiles(message) {
    try {
      // Extract search term from message
      const searchMatch = message.match(/search\s+(?:for\s+)?["']?([^"']+)["']?/i) ||
                         message.match(/find\s+["']?([^"']+)["']?/i);
      
      let searchTerm = 'documents';
      if (searchMatch && searchMatch[1]) {
        searchTerm = searchMatch[1].trim();
      }

      const searchQuery = `name contains '${searchTerm}' and trashed=false`;
      const result = await this.driveService.searchFiles(searchQuery, 15);
      
      if (result.error) {
        return {
          content: `Error searching files: ${result.error}`,
          type: 'error'
        };
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
        response += `   Modified: ${new Date(file.modifiedTime).toLocaleDateString()}\n`;
        response += `\n`;
      });

      return {
        content: response,
        type: 'text'
      };
    } catch (error) {
      return {
        content: `Error searching files: ${error.message}`,
        type: 'error'
      };
    }
  }

  async getRootFiles() {
    try {
      const result = await this.driveService.listFiles('root', 20);
      
      if (result.error) {
        return {
          content: `Error getting Drive files: ${result.error}`,
          type: 'error'
        };
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
      return {
        content: `Error getting Drive files: ${error.message}`,
        type: 'error'
      };
    }
  }

  async getGeneralHelp(message) {
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

export default SimpleChatService;
