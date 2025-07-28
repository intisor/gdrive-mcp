import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SimpleMCPGDriveClient {
  constructor() {
    this.client = null;
    this.transport = null;
    this.isConnected = false;
    this.serverProcess = null;
  }

  async connect() {
    try {
      console.log('🔄 Connecting to MCP GDrive server...');
      
      // Check environment variables
      console.log('📋 Checking Environment Variables:');
      const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
      let missingVars = [];
      
      for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
          missingVars.push(varName);
          console.log(`❌ ${varName}: Missing`);
        } else {
          console.log(`✅ ${varName}: Set`);
        }
      }
      
      if (missingVars.length > 0) {
        console.log(`\n⚠️ Missing required environment variables: ${missingVars.join(', ')}`);
        console.log('💡 Check your .env file and make sure it contains all required variables');
        return false;
      }
      
      // Find the local MCP package
      const mcpPackagePath = join(__dirname, 'node_modules', '@isaacphi', 'mcp-gdrive', 'dist', 'index.js');
      
      if (!existsSync(mcpPackagePath)) {
        console.log('❌ @isaacphi/mcp-gdrive package not found locally');
        console.log('💡 Install with: npm install @isaacphi/mcp-gdrive');
        return false;
      }
      
      console.log('✅ Found MCP package at:', mcpPackagePath);
      
      // Create transport using node directly
      console.log('🚀 Starting MCP server...');
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [mcpPackagePath],
        env: {
          ...process.env,
          CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
          CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
          GDRIVE_CREDS_DIR: process.env.GDRIVE_CREDS_DIR || '.'
        }
      });

      this.client = new Client(
        {
          name: 'mcp-gdrive-webapp',
          version: '1.0.0'
        },
        {
          capabilities: {}
        }
      );

      // Connect to the transport
      await this.client.connect(this.transport);
      
      // Test the connection
      console.log('🔗 Testing MCP connection...');
      const result = await this.client.listTools();
      console.log('✅ MCP connection successful!');
      console.log(`📚 Available tools: ${result.tools.length}`);
      result.tools.forEach(tool => {
        console.log(`  - ${tool.name}: ${tool.description}`);
      });
      
      this.isConnected = true;
      return true;

    } catch (error) {
      console.error('❌ MCP connection failed:', error.message);
      console.log('💡 Troubleshooting tips:');
      console.log('  1. Make sure @isaacphi/mcp-gdrive is installed: npm install @isaacphi/mcp-gdrive');
      console.log('  2. Check your .env file has GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
      console.log('  3. Make sure your Google OAuth credentials are valid');
      console.log('  4. Verify Google Drive API is enabled in your Google Cloud project');
      
      if (this.transport) {
        try {
          await this.transport.close();
        } catch (closeError) {
          console.log('⚠️ Error closing transport:', closeError.message);
        }
      }
      
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.transport) {
      try {
        await this.transport.close();
      } catch (error) {
        console.log('⚠️ Error during disconnect:', error.message);
      }
    }
    
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
    
    this.isConnected = false;
    this.client = null;
    this.transport = null;
    this.serverProcess = null;
  }

  async searchFiles(query) {
    if (!this.isConnected || !this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await this.client.callTool({
        name: 'gdrive_search',
        arguments: { query }
      });

      return result.content;
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  async readFile(fileId) {
    if (!this.isConnected || !this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await this.client.callTool({
        name: 'gdrive_read_file',
        arguments: { fileId }
      });

      return result.content;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  async getStatus() {
    return {
      connected: this.isConnected,
      clientName: this.client ? 'SimpleMCPGDriveClient' : null,
      timestamp: new Date().toISOString()
    };
  }
}

export default SimpleMCPGDriveClient;
