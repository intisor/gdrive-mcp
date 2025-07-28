class MCPOnlyChatService {
  constructor(mcpClient) {
    this.mcpClient = mcpClient;
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
    // Check if MCP is connected first
    if (!this.mcpClient || !this.mcpClient.isConnected) {
      const errorResponse = {
        role: 'assistant',
        content: `🚨 **MCP Server Not Connected**\n\n` +
                `The MCP server is currently disconnected. Chat functionality is temporarily unavailable.\n\n` +
                `**Troubleshooting Steps:**\n` +
                `1. Check server logs for MCP connection errors\n` +
                `2. Restart the application\n` +
                `3. Verify MCP server configuration\n\n` +
                `**Available Actions:**\n` +
                `• Use the file browser above for manual navigation\n` +
                `• Check the MCP Tools section to see connection status\n` +
                `• Contact administrator if issue persists`,
        type: 'error'
      };
      
      this.addMessage(userId, errorResponse);
      return errorResponse;
    }

    // Add user message to history
    this.addMessage(userId, {
      role: 'user',
      content: userMessage,
      type: 'text'
    });

    try {
      // Process the message using only MCP tools
      const response = await this.interpretAndExecuteWithMCP(userMessage, userId);
      
      // Add assistant response to history
      this.addMessage(userId, {
        role: 'assistant',
        content: response.content,
        type: response.type,
        data: response.data
      });

      return response;
    } catch (error) {
      console.error('MCP Chat Error:', error);
      const errorResponse = {
        role: 'assistant',
        content: `❌ **MCP Error**: ${error.message}\n\n` +
                `This request could not be processed using MCP tools. ` +
                `Please check the MCP Tools section for available tools and connection status.`,
        type: 'error'
      };
      
      this.addMessage(userId, errorResponse);
      return errorResponse;
    }
  }

  async interpretAndExecuteWithMCP(message, userId) {
    const lowerMessage = message.toLowerCase();

    // Handle June reports analysis
    if (lowerMessage.includes('june') && 
        (lowerMessage.includes('analyze') || lowerMessage.includes('preview') || lowerMessage.includes('reports'))) {
      return await this.handleJuneAnalysisWithMCP(message);
    }

    // Handle recent files
    if (lowerMessage.includes('recent') || (lowerMessage.includes('list') && lowerMessage.includes('file'))) {
      return await this.handleRecentFilesWithMCP(message);
    }

    // Handle shared files
    if (lowerMessage.includes('shared') && lowerMessage.includes('me')) {
      return await this.handleSharedFilesWithMCP(message);
    }

    // Handle search requests
    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
      return await this.handleSearchWithMCP(message);
    }

    // Handle storage analysis
    if (lowerMessage.includes('storage') || lowerMessage.includes('space') || lowerMessage.includes('usage')) {
      return await this.handleStorageWithMCP(message);
    }

    // Default: Show available MCP capabilities
    return {
      content: `🤖 **MCP-Powered Chat**\n\n` +
              `I can help you using these MCP tools:\n\n` +
              `**Available Commands:**\n` +
              `• **"analyze june reports"** - Find and preview June documents\n` +
              `• **"list recent files"** - Show recently modified files\n` +
              `• **"show shared files"** - Files shared with you\n` +
              `• **"search for [term]"** - Search your Google Drive\n` +
              `• **"storage usage"** - Analyze drive storage\n\n` +
              `**Your message:** "${message}"\n\n` +
              `💡 Try one of the quick prompts above or be more specific about what you'd like to do!`,
      type: 'text'
    };
  }

  async handleJuneAnalysisWithMCP(message) {
    try {
      console.log('🔍 Searching for June documents via MCP...');
      
      // Use MCP to search for June documents
      const searchResult = await this.mcpClient.client.callTool({
        name: 'mcp__isaacphi_mcp_gdrive_search',
        arguments: {
          query: 'june'
        }
      });

      let response = `## 📄 June Documents Analysis (via MCP)\n\n`;
      response += `🔧 **Using MCP Tool:** \`mcp__isaacphi_mcp_gdrive_search\`\n`;
      response += `📋 **Search Query:** "june"\n\n`;

      if (!searchResult.content || !searchResult.content[0]) {
        return {
          content: response + `⚠️ No search results returned from MCP. The search may have failed or returned no matches.`,
          type: 'text'
        };
      }

      // Parse the search results
      const searchData = JSON.parse(searchResult.content[0].text);
      const files = searchData.files || [];
      
      // Filter for June-related documents (not folders)
      const juneDocuments = files.filter(file => 
        file.name.toLowerCase().includes('june') && 
        !file.mimeType.includes('folder')
      );

      if (juneDocuments.length === 0) {
        return {
          content: response + `📭 **No June Documents Found**\n\n` +
                  `The MCP search didn't find any documents with "june" in the name.\n\n` +
                  `**Suggestions:**\n` +
                  `• Try searching for "report" or "2024"\n` +
                  `• Use the file browser to navigate manually\n` +
                  `• Check if documents are in shared folders`,
          type: 'text'
        };
      }

      response += `Found **${juneDocuments.length}** June documents.\n\n`;

      // Analyze up to 5 documents to avoid overwhelming the response
      const documentsToAnalyze = juneDocuments.slice(0, 5);

      for (const doc of documentsToAnalyze) {
        try {
          response += `🔧 **Reading file with MCP Tool:** \`mcp__isaacphi_mcp_gdrive_read_file\`\n`;
          
          // Read file content via MCP
          const contentResult = await this.mcpClient.client.callTool({
            name: 'mcp__isaacphi_mcp_gdrive_read_file',
            arguments: {
              fileId: doc.id
            }
          });

          let preview = '(Content not available)';
          if (contentResult.content && contentResult.content[0]) {
            const content = contentResult.content[0].text;
            preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
          }

          response += `### 📄 ${doc.name}\n`;
          response += `**Type:** ${this.getMimeTypeDisplayName(doc.mimeType)}\n`;
          response += `**Preview:** ${preview}\n\n`;

        } catch (readError) {
          console.error(`Error reading ${doc.name}:`, readError);
          response += `### 📄 ${doc.name}\n`;
          response += `**Type:** ${this.getMimeTypeDisplayName(doc.mimeType)}\n`;
          response += `**Preview:** (Error reading content)\n\n`;
        }
      }

      if (juneDocuments.length > 5) {
        response += `*...and ${juneDocuments.length - 5} more documents*\n\n`;
      }

      response += `✅ **Analysis Complete** - All data retrieved via MCP tools\n`;
      response += `📊 **MCP Tools Used:** \`gdrive_search\`, \`gdrive_read_file\``;

      return {
        content: response,
        type: 'text',
        data: { fileCount: juneDocuments.length }
      };

    } catch (error) {
      console.error('June analysis MCP error:', error);
      return {
        content: `❌ **MCP Error during June analysis**: ${error.message}\n\n` +
                `The MCP search or file reading failed. Please check the MCP connection.`,
        type: 'error'
      };
    }
  }

  async handleRecentFilesWithMCP(message) {
    try {
      console.log('🔍 Getting recent files via MCP...');
      
      let response = `## 🕒 Recent Files (via MCP)\n\n`;
      response += `🔧 **Using MCP Tool:** \`mcp__isaacphi_mcp_gdrive_search\`\n`;
      response += `📋 **Query:** Recent files (default order)\n\n`;
      
      // Use MCP to search with orderBy recent
      const searchResult = await this.mcpClient.client.callTool({
        name: 'mcp__isaacphi_mcp_gdrive_search',
        arguments: {
          query: '',
          pageSize: 10
        }
      });

      if (!searchResult.content || !searchResult.content[0]) {
        return {
          content: response + `⚠️ Unable to retrieve recent files via MCP.`,
          type: 'text'
        };
      }

      const searchData = JSON.parse(searchResult.content[0].text);
      const files = searchData.files || [];

      if (files.length === 0) {
        return {
          content: response + `📭 **No Recent Files Found**\n\nMCP search returned no results.`,
          type: 'text'
        };
      }

      files.slice(0, 10).forEach((file, index) => {
        const modifiedTime = file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Unknown';
        response += `${index + 1}. **${file.name}**\n`;
        response += `   Type: ${this.getMimeTypeDisplayName(file.mimeType)} | Modified: ${modifiedTime}\n\n`;
      });

      response += `✅ **Retrieved via MCP tools**\n`;
      response += `📊 **MCP Tool Used:** \`gdrive_search\``;

      return {
        content: response,
        type: 'text',
        data: { fileCount: files.length }
      };

    } catch (error) {
      console.error('Recent files MCP error:', error);
      return {
        content: `❌ **MCP Error getting recent files**: ${error.message}`,
        type: 'error'
      };
    }
  }

  async handleSharedFilesWithMCP(message) {
    try {
      console.log('🔍 Getting shared files via MCP...');
      
      let response = `## 🤝 Shared Files (via MCP)\n\n`;
      response += `🔧 **Using MCP Tool:** \`mcp__isaacphi_mcp_gdrive_search\`\n`;
      response += `📋 **Query:** Files shared with me\n\n`;
      
      // Search for files shared with me
      const searchResult = await this.mcpClient.client.callTool({
        name: 'mcp__isaacphi_mcp_gdrive_search',
        arguments: {
          query: 'sharedWithMe'
        }
      });

      if (!searchResult.content || !searchResult.content[0]) {
        return {
          content: response + `⚠️ Unable to retrieve shared files via MCP.`,
          type: 'text'
        };
      }

      const searchData = JSON.parse(searchResult.content[0].text);
      const files = searchData.files || [];

      if (files.length === 0) {
        response += `📭 No files are currently shared with you.`;
      } else {
        files.slice(0, 15).forEach((file, index) => {
          response += `${index + 1}. **${file.name}**\n`;
          response += `   Type: ${this.getMimeTypeDisplayName(file.mimeType)}\n\n`;
        });
        
        if (files.length > 15) {
          response += `*...and ${files.length - 15} more shared files*\n\n`;
        }
      }

      response += `✅ **Retrieved via MCP tools**\n`;
      response += `📊 **MCP Tool Used:** \`gdrive_search\``;

      return {
        content: response,
        type: 'text',
        data: { fileCount: files.length }
      };

    } catch (error) {
      console.error('Shared files MCP error:', error);
      return {
        content: `❌ **MCP Error getting shared files**: ${error.message}`,
        type: 'error'
      };
    }
  }

  async handleSearchWithMCP(message) {
    // Extract search term from message
    const searchTermMatch = message.match(/search\s+(?:for\s+)?(.+)/i) || 
                           message.match(/find\s+(.+)/i);
    
    if (!searchTermMatch) {
      return {
        content: `❓ **Search Query Unclear**\n\nPlease specify what to search for.\n\n**Example:** "search for reports" or "find june documents"`,
        type: 'text'
      };
    }

    const searchTerm = searchTermMatch[1].trim();

    try {
      console.log(`🔍 Searching for "${searchTerm}" via MCP...`);
      
      let response = `## 🔍 Search Results for "${searchTerm}" (via MCP)\n\n`;
      response += `🔧 **Using MCP Tool:** \`mcp__isaacphi_mcp_gdrive_search\`\n`;
      response += `📋 **Search Query:** "${searchTerm}"\n\n`;
      
      const searchResult = await this.mcpClient.client.callTool({
        name: 'mcp__isaacphi_mcp_gdrive_search',
        arguments: {
          query: searchTerm,
          pageSize: 20
        }
      });

      if (!searchResult.content || !searchResult.content[0]) {
        return {
          content: response + `⚠️ Search via MCP returned no results.`,
          type: 'text'
        };
      }

      const searchData = JSON.parse(searchResult.content[0].text);
      const files = searchData.files || [];

      if (files.length === 0) {
        response += `📭 No files found matching "${searchTerm}".`;
      } else {
        response += `Found **${files.length}** files:\n\n`;
        
        files.slice(0, 15).forEach((file, index) => {
          response += `${index + 1}. **${file.name}**\n`;
          response += `   Type: ${this.getMimeTypeDisplayName(file.mimeType)}\n\n`;
        });

        if (files.length > 15) {
          response += `*...and ${files.length - 15} more results*\n\n`;
        }
      }

      response += `✅ **Retrieved via MCP tools**\n`;
      response += `📊 **MCP Tool Used:** \`gdrive_search\``;

      return {
        content: response,
        type: 'text',
        data: { fileCount: files.length, searchTerm }
      };

    } catch (error) {
      console.error('Search MCP error:', error);
      return {
        content: `❌ **MCP Search Error**: ${error.message}`,
        type: 'error'
      };
    }
  }

  async handleStorageWithMCP(message) {
    return {
      content: `📊 **Storage Analysis**\n\n` +
              `⚠️ Storage analysis via MCP is not currently implemented.\n\n` +
              `**Available MCP Operations:**\n` +
              `• Search files\n` +
              `• Read file contents\n` +
              `• List recent files\n\n` +
              `For storage information, please check your Google Drive directly.`,
      type: 'text'
    };
  }

  getMimeTypeDisplayName(mimeType) {
    const mimeTypeMap = {
      'application/vnd.google-apps.document': 'Google Doc',
      'application/vnd.google-apps.spreadsheet': 'Google Sheets',
      'application/vnd.google-apps.presentation': 'Google Slides',
      'application/vnd.google-apps.folder': 'Folder',
      'application/pdf': 'PDF',
      'text/plain': 'Text File',
      'image/jpeg': 'JPEG Image',
      'image/png': 'PNG Image'
    };
    
    return mimeTypeMap[mimeType] || 'File';
  }
}

export default MCPOnlyChatService;
