import DirectGDriveService from './direct-gdrive-service.js';

class ChatService {
  constructor() {
    this.driveService = null;
    this.conversationHistory = new Map(); // userId -> messages[]
    this.quickPrompts = [
      {
        id: 'analyze-june-reports',
        title: 'Analyze June Reports & Preview Content',
        prompt: 'Analyze the contents of the documents in the June folder and show the first 100 characters of each',
        icon: 'fas fa-file-magnifying-glass',
        description: 'Analyze content of June reports',
      },
      {
        id: 'list-recent',
        title: 'Recent Files',
        prompt: 'Show me my 10 most recently modified files',
        icon: 'fas fa-clock',
        description: 'List recent files'
      },
      {
        id: 'shared-files',
        title: 'Shared Files',
        prompt: 'Show me files shared with me',
        icon: 'fas fa-share-alt',
        description: 'View shared files'
      },
      {
        id: 'storage-usage',
        title: 'Storage Info',
        prompt: 'Analyze my Google Drive storage usage',
        icon: 'fas fa-chart-pie',
        description: 'Storage analysis'
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

  addMessage(userId, message) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    
    const history = this.conversationHistory.get(userId);
    history.push({
      ...message,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    });
    
    // Keep only last 50 messages per user
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    return message;
  }

  async processMessage(userId, userMessage) {
    // Add user message to history
    this.addMessage(userId, {
      role: 'user',
      content: userMessage,
      type: 'text'
    });

    try {
      // Process the message and determine what MCP tools to use
      const response = await this.interpretAndExecute(userMessage, userId);
      
      // Add assistant response to history
      this.addMessage(userId, {
        role: 'assistant',
        content: response.content,
        type: response.type,
        data: response.data
      });

      return response;
    } catch (error) {
      const errorResponse = {
        role: 'assistant',
        content: `I encountered an error: ${error.message}`,
        type: 'error'
      };
      
      this.addMessage(userId, errorResponse);
      return errorResponse;
    }
  }

  async interpretAndExecute(message, userId) {
    const lowerMessage = message.toLowerCase();

    // Handle specific June reports count request
    if (
      lowerMessage.includes('june') &&
      lowerMessage.includes('reports') &&
      (lowerMessage.includes('count') || lowerMessage.includes('navigate'))
    ) {
      return await this.handleJuneReportsCount(message);
    }

    if (
      lowerMessage.includes('june') &&
      (lowerMessage.includes('analyze') || lowerMessage.includes('preview'))
    ) {
      return await this.handleAnalyzeJuneDocuments(message);
    }

    // Handle shared files requests
    if (lowerMessage.includes('shared') && lowerMessage.includes('me')) {
      return await this.handleSharedFiles(message);
    }
    
    // Pattern matching for different types of requests
    if (lowerMessage.includes('list') && (lowerMessage.includes('file') || lowerMessage.includes('recent'))) {
      return await this.handleListFiles(message);
    }
    
    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
      return await this.handleSearch(message);
    }
    
    if (lowerMessage.includes('upload')) {
      return await this.handleUploadInstruction(message);
    }
    
    if (lowerMessage.includes('create') && lowerMessage.includes('folder')) {
      return await this.handleCreateFolder(message);
    }
    
    if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
      return await this.handleDeleteInstruction(message);
    }
    
    if (lowerMessage.includes('organize') || lowerMessage.includes('sort')) {
      return await this.handleOrganizeFiles(message);
    }
    
    if (lowerMessage.includes('storage') || lowerMessage.includes('space') || lowerMessage.includes('usage')) {
      return await this.handleStorageAnalysis(message);
    }
    
    // Default response for unclear requests
    return {
      content: `I understand you want to: "${message}"\n\nI can help you with:\n• **June Reports Count** - Navigate to 📁 Shared 📁 Reports 📁 June and count documents\n• **Recent Files** - List your most recent files\n• **Shared Files** - Show files shared with you\n• **Storage Analysis** - Analyze your drive usage\n\nTry using one of the quick prompts above!`,
      type: 'text'
    };
  }

  async handleAnalyzeJuneDocuments(message) {
    try {
      console.log('Handling analyze June documents request...');
      
      if (!this.mcpClient || !this.mcpClient.isConnected) {
        console.log('MCP not available, using fallback method...');
        return {
          content: `⚠️ **MCP Server not connected - Using Fallback Mode**\n\n` +
                  `To analyze June documents:\n\n` +
                  `1. **Use the file browser above** to navigate manually\n` +
                  `2. **Search for "june"** in the search box\n` +
                  `3. **Look in these folders:**\n` +
                  `   📁 Shared with me\n` +
                  `   📁 Reports folder\n` +
                  `   📁 June subfolder\n\n` +
                  `📋 **Manual Steps:**\n` +
                  `• Type "june" in the search box above\n` +
                  `• Click "Search" to find related files\n` +
                  `• Open each document to view its contents\n\n` +
                  `💡 **Note:** Full MCP functionality will be available once the MCP server connects successfully.`,
          type: 'fallback_mode'
        };
      }
      
      // Use MCP to search for June documents
      console.log('Searching for June documents...');
      const result = await this.mcpClient.client.callTool({
        name: 'gdrive_search',
        arguments: {
          query: 'june',
          pageSize: 50
        }
      });
      
      if (!result.content || !result.content[0] || !result.content[0].text) {
        return {
          content: `⚠️ No June documents found or there was an issue retrieving them.`,
          type: 'text'
        };
      }
      
      // Parse search results
      const files = this.parseSearchResponse(result.content[0].text);
      
      // Filter for documents (not folders)
      const juneDocuments = files.filter(file => 
        !file.mimeType.includes('folder') && 
        file.name.toLowerCase().includes('june')
      );
      
      if (juneDocuments.length === 0) {
        return {
          content: `⚠️ No June documents found. Try searching manually for "june" in your Google Drive.`,
          type: 'text'
        };
      }
      
      // Now fetch content of each document and preview first 100 characters
      let response = `## 📄 June Documents Analysis\n\nFound **${juneDocuments.length}** documents related to June.\n\n`;
      
      // Process up to 10 documents to avoid overloading
      const documentsToAnalyze = juneDocuments.slice(0, 10);
      
      for (const doc of documentsToAnalyze) {
        try {
          // Get document content
          const contentResult = await this.mcpClient.client.callTool({
            name: 'gdrive_read_file',
            arguments: {
              fileId: doc.id
            }
          });
          
          // Extract the first 100 characters
          let preview = '';
          if (contentResult.content && contentResult.content[0] && contentResult.content[0].text) {
            preview = contentResult.content[0].text.substring(0, 100) + '...';
          } else {
            preview = '(Content preview not available)';
          }
          
          response += `### ${doc.name} (${this.getMimeTypeDisplayName(doc.mimeType)})\n`;
          response += `**Preview:** ${preview}\n\n`;
          
        } catch (readError) {
          console.error(`Error reading file ${doc.name}:`, readError);
          response += `### ${doc.name} (${this.getMimeTypeDisplayName(doc.mimeType)})\n`;
          response += `**Preview:** Unable to read content: ${readError.message}\n\n`;
        }
      }
      
      if (juneDocuments.length > 10) {
        response += `\n_...and ${juneDocuments.length - 10} more documents not shown..._\n`;
      }
      
      return {
        content: response,
        type: 'june_documents_analysis',
        data: { documents: juneDocuments }
      };
    } catch (error) {
      console.error('Error in handleAnalyzeJuneDocuments:', error);
      return {
        content: `❌ **Error analyzing June documents:**\n${error.message || 'Unknown error'}\n\n💡 **Alternative:** Try using the file browser above to manually search for "june" documents.`,
        type: 'error'
      };
    }
  }

  async handleJuneReportsCount(message) {
    try {
      console.log('Handling June reports count request...');
      
      if (!this.mcpClient || !this.mcpClient.isConnected) {
        console.log('MCP not available, using fallback method...');
        return {
          content: `⚠️ **MCP Server not connected - Using Fallback Mode**\n\n` +
                  `To count June reports documents:\n\n` +
                  `1. **Use the file browser above** to navigate manually\n` +
                  `2. **Search for "june"** or "reports" in the search box\n` +
                  `3. **Look in these folders:**\n` +
                  `   📁 Shared with me\n` +
                  `   📁 Reports folder\n` +
                  `   📁 June subfolder\n\n` +
                  `📋 **Manual Steps:**\n` +
                  `• Type "june reports" in the search box above\n` +
                  `• Click "Search" to find related files\n` +
                  `• Count the documents in the results\n\n` +
                  `💡 **Note:** Full MCP functionality will be available once the MCP server connects successfully.`,
          type: 'fallback_mode'
        };
      }

      // Use the correct MCP tool: gdrive_search with proper response parsing
      let allFiles = [];
      
      try {
        // Search for "june reports" - the tool returns plain text, not JSON
        console.log('Searching for June reports...');
        const result1 = await this.mcpClient.client.callTool({
          name: 'gdrive_search',
          arguments: {
            query: 'june reports',
            pageSize: 50
          }
        });
        
        if (result1.content && result1.content[0] && result1.content[0].text) {
          const searchText = result1.content[0].text;
          console.log('Search result 1:', searchText);
          
          // Parse the text response to extract files
          const files1 = this.parseSearchResponse(searchText);
          allFiles = allFiles.concat(files1);
        }
        
        // Also search for just "reports"
        const result2 = await this.mcpClient.client.callTool({
          name: 'gdrive_search',
          arguments: {
            query: 'reports',
            pageSize: 50
          }
        });
        
        if (result2.content && result2.content[0] && result2.content[0].text) {
          const searchText = result2.content[0].text;
          console.log('Search result 2:', searchText);
          
          const files2 = this.parseSearchResponse(searchText);
          allFiles = allFiles.concat(files2);
        }
        
        // Also search for just "june"
        const result3 = await this.mcpClient.client.callTool({
          name: 'gdrive_search',
          arguments: {
            query: 'june',
            pageSize: 50
          }
        });
        
        if (result3.content && result3.content[0] && result3.content[0].text) {
          const searchText = result3.content[0].text;
          console.log('Search result 3:', searchText);
          
          const files3 = this.parseSearchResponse(searchText);
          allFiles = allFiles.concat(files3);
        }
        
        // Remove duplicates based on file ID
        const uniqueFiles = allFiles.filter((file, index, self) => 
          index === self.findIndex(f => f.id === file.id)
        );
        
        // Filter for documents related to June reports
        const juneReports = uniqueFiles.filter(file => {
          const fileName = file.name.toLowerCase();
          const isDocument = !file.mimeType.includes('folder');
          
          return isDocument && (
            (fileName.includes('june') && fileName.includes('report')) ||
            fileName.includes('june report') ||
            fileName.includes('reports june') ||
            (fileName.includes('june') && fileName.includes('analytics')) ||
            (fileName.includes('june') && fileName.includes('summary'))
          );
        });
        
        const documentCount = juneReports.length;
        
        let response = `📊 **June Reports Analysis**\n\n`;
        response += `🔍 **Search Results:**\n`;
        response += `• Found **${documentCount} documents** related to June reports\n`;
        response += `• Total files searched: ${uniqueFiles.length}\n\n`;
        
        if (juneReports.length > 0) {
          response += `📋 **Documents found:**\n`;
          juneReports.slice(0, 10).forEach((file, index) => {
            response += `${index + 1}. **${file.name}**\n`;
            response += `   � Type: ${this.getMimeTypeDisplayName(file.mimeType)}\n`;
          });
          
          if (juneReports.length > 10) {
            response += `\n... and ${juneReports.length - 10} more documents\n`;
          }
        } else {
          response += `❌ No documents found matching "June Reports" criteria.\n\n`;
          response += `💡 **Suggestions:**\n`;
          response += `• Check if files exist in Google Drive\n`;
          response += `• Try searching manually: "june", "reports", or "june reports"\n`;
          response += `• Verify file names contain relevant keywords\n`;
          response += `• Look in these locations:\n`;
          response += `  📁 Shared with me\n`;
          response += `  📁 Reports folder\n`;
          response += `  📁 June subfolder\n`;
        }
        
        return {
          content: response,
          type: 'june_reports_count',
          data: { 
            documentCount, 
            totalFound: uniqueFiles.length,
            documents: juneReports 
          }
        };
        
      } catch (toolError) {
        console.error('Error calling gdrive_search tool:', toolError);
        return {
          content: `❌ **MCP error ${toolError.code || 'Unknown'}: ${toolError.message}**\n\n💡 **Alternative:** Try using the file browser above to manually navigate to:\n📁 Shared with me 📁 Reports 📁 June`,
          type: 'error'
        };
      }
      
    } catch (error) {
      console.error('Error in handleJuneReportsCount:', error);
      return {
        content: `❌ **Error accessing June Reports folder:**\n${error.message || 'Unknown error'}\n\n💡 **Alternative:** Try using the file browser above to manually navigate to:\n📁 Shared with me 📁 Reports 📁 June`,
        type: 'error'
      };
    }
  }

  // Helper method to parse gdrive_search text response
  parseSearchResponse(searchText) {
    const files = [];
    
    try {
      // The response format is: "Found X files:\nfileId fileName (mimeType)\nfileId fileName (mimeType)"
      const lines = searchText.split('\n');
      
      for (const line of lines) {
        // Skip header lines and empty lines
        if (line.includes('Found ') || line.includes('files:') || line.trim() === '' || line.includes('More results')) {
          continue;
        }
        
        // Parse line format: "fileId fileName (mimeType)"
        const match = line.match(/^([^\s]+)\s+(.+?)\s+\(([^)]+)\)$/);
        if (match) {
          const [, id, name, mimeType] = match;
          files.push({
            id: id.trim(),
            name: name.trim(),
            mimeType: mimeType.trim()
          });
        }
      }
    } catch (parseError) {
      console.error('Error parsing search response:', parseError);
    }
    
    return files;
  }

  // Helper method to get display name for MIME types
  getMimeTypeDisplayName(mimeType) {
    if (mimeType.includes('document')) return 'Google Doc';
    if (mimeType.includes('spreadsheet')) return 'Google Sheet';
    if (mimeType.includes('presentation')) return 'Google Slides';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('image')) return 'Image';
    if (mimeType.includes('video')) return 'Video';
    if (mimeType.includes('audio')) return 'Audio';
    if (mimeType.includes('folder')) return 'Folder';
    return 'Document';
  }

  async handleSharedFiles(message) {
    try {
      // Search for shared files
      const result = await this.mcpClient.searchFiles('sharedWithMe', 20);

      if (result.content && result.content[0] && result.content[0].text) {
        const files = this.parseSearchResponse(result.content[0].text);

        let response = `📤 **Files Shared With Me**\n\n`;
        if (files.length > 0) {
          response += `Found **${files.length}** shared files:\n\n`;

          files.forEach((file) => {
            const isFolder = file.mimeType.includes('folder');
            const icon = isFolder ? '📁' : '📄';
            response += `${icon} **${file.name}** (${this.getMimeTypeDisplayName(
              file.mimeType
            )})\n`;
          });
        } else {
          response += 'No files are currently shared with you.';
        }

        return {
          content: response,
          type: 'shared_files',
          data: files,
        };
      } else {
        return {
          content:
            'No shared files found or there was an issue retrieving them.',
          type: 'text',
        };
      }
    } catch (error) {
      return {
        content: `❌ Error accessing shared files: ${error.message}`,
        type: 'error',
      };
    }
  }

  async handleListFiles(message) {
    try {
      const maxResults = this.extractNumber(message) || 10;
      const result = await this.mcpClient.listFiles('root', maxResults);

      if (result.content && result.content[0] && result.content[0].text) {
        const files = this.parseSearchResponse(result.content[0].text);
        if (files.length > 0) {
          const fileList = files
            .map(
              (file) =>
                `📄 **${file.name}** (${
                  file.mimeType.includes('folder')
                    ? 'Folder'
                    : this.getMimeTypeDisplayName(file.mimeType)
                })`
            )
            .join('\n');

          return {
            content: `Here are your ${files.length} most recent files:\n\n${fileList}`,
            type: 'file_list',
            data: files,
          };
        } else {
          return {
            content: 'No files found in your Google Drive.',
            type: 'text',
          };
        }
      } else {
        return {
          content: 'Could not retrieve files. The response was empty.',
          type: 'text',
        };
      }
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async handleSearch(message) {
    try {
      // Extract search query from message
      const searchQuery = this.extractSearchQuery(message);
      if (!searchQuery) {
        return {
          content:
            'Please specify what you want to search for. For example: "search for documents" or "find images"',
          type: 'text',
        };
      }

      const result = await this.mcpClient.searchFiles(searchQuery, 20);

      if (result.content && result.content[0] && result.content[0].text) {
        const files = this.parseSearchResponse(result.content[0].text);
        if (files.length === 0) {
          return {
            content: `No files found matching "${searchQuery}"`,
            type: 'text',
          };
        }

        const fileList = files
          .map(
            (file) =>
              `📄 **${file.name}** (${
                file.mimeType.includes('folder')
                  ? 'Folder'
                  : this.getMimeTypeDisplayName(file.mimeType)
              })`
          )
          .join('\n');

        return {
          content: `Found ${files.length} files matching "${searchQuery}":\n\n${fileList}`,
          type: 'search_results',
          data: files,
        };
      } else {
        return {
          content: `No files found matching "${searchQuery}" or the response was empty.`,
          type: 'text',
        };
      }
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async handleCreateFolder(message) {
    const folderName = this.extractFolderName(message);
    if (!folderName) {
      return {
        content:
          'Please specify the folder name. For example: "create a folder called Documents"',
        type: 'text',
      };
    }

    try {
      return {
        content: `I'm sorry, I cannot create folders with the current tools.`,
        type: 'text',
      };
    } catch (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  async handleStorageAnalysis(message) {
    return {
      content:
        "I'm sorry, I cannot analyze storage usage with the current tools. I can only search for and read files.",
      type: 'text',
    };
  }

  // Helper methods
  extractNumber(text) {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  extractSearchQuery(message) {
    const patterns = [
      /search for (.+)/i,
      /find (.+)/i,
      /search (.+)/i,
    ];
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  extractFolderName(message) {
    const match = message.match(/(?:folder|directory) (?:called|named) (.+)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    const match2 = message.match(/create (?:a|an) (.+) (?:folder|directory)/i);
    if (match2 && match2[1]) {
      return match2[1].trim();
    }
    return null;
  }

  async handleOrganizeFiles(message) {
    return {
      content: `🗂️ **File Organization Assistant**\n\nI can help you organize your files by:\n\n• Creating folders by file type (Documents, Images, Videos, etc.)\n• Moving files to appropriate folders\n• Cleaning up duplicate files\n• Creating date-based organization\n\nWhich organization method would you prefer? You can also upload files first and I'll help organize them.`,
      type: 'organize_suggestion'
    };
  }

  handleUploadInstruction(message) {
    return {
      content: `📤 **File Upload**\n\nTo upload files:\n1. Use the upload button in the file manager above\n2. Select your files\n3. Choose the destination folder\n4. Click upload\n\nI'll help you organize them once they're uploaded!`,
      type: 'upload_instruction'
    };
  }

  handleDeleteInstruction(message) {
    return {
      content: `🗑️ **File Deletion**\n\n⚠️ **Important**: File deletion is permanent!\n\nTo delete files:\n1. Find the file in the list above\n2. Click the delete button (🗑️)\n3. Confirm the deletion\n\nWhich specific file would you like me to help you find and delete?`,
      type: 'delete_instruction'
    };
  }

  // Helper methods
  extractNumber(text) {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  extractSearchQuery(text) {
    // Extract search terms from common patterns
    const patterns = [
      /search for (.+)/i,
      /find (.+)/i,
      /look for (.+)/i,
      /show me (.+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // Handle specific file type searches
    if (text.includes('document')) return 'type:document';
    if (text.includes('image')) return 'type:image';
    if (text.includes('video')) return 'type:video';
    if (text.includes('pdf')) return 'type:pdf';
    
    return null;
  }

  extractFolderName(text) {
    const patterns = [
      /create.*folder.*called (.+)/i,
      /create.*folder.*named (.+)/i,
      /make.*folder.*called (.+)/i,
      /new folder (.+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().replace(/['"]/g, '');
      }
    }
    
    return null;
  }

  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return 'Unknown size';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default ChatService;
