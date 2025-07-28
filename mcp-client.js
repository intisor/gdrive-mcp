import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPGDriveClient {
  constructor() {
    this.client = null;
    this.transport = null;
    this.isConnected = false;
    this.serverProcess = null;
  }

  // Helper to find MCP server executable paths
  findMCPServerPaths() {
    const possiblePaths = [
      // Global npm paths
      join(process.env.APPDATA || '', 'npm', 'node_modules', '@isaacphi', 'mcp-gdrive', 'dist', 'index.js'),
      join(process.env.APPDATA || '', 'npm', 'node_modules', '@isaacphi', 'mcp-gdrive', 'index.js'),
      // Local node_modules
      join(__dirname, 'node_modules', '@isaacphi', 'mcp-gdrive', 'dist', 'index.js'),
      join(__dirname, 'node_modules', '@isaacphi', 'mcp-gdrive', 'index.js'),
      // System paths
      join(process.env.ProgramFiles || '', 'nodejs', 'node_modules', '@isaacphi', 'mcp-gdrive', 'dist', 'index.js')
    ];
    
    return possiblePaths.filter(path => existsSync(path));
  }

  async connect() {
    try {
      console.log('🔄 Connecting to MCP GDrive server...');
      
      // Check if MCP server package is installed
      console.log('📦 Checking for @isaacphi/mcp-gdrive package...');
      
      // Check if npx can find the package
      try {
        const { spawn } = await import('child_process');
        const testProcess = spawn('npx', ['@isaacphi/mcp-gdrive', '--version'], { 
          stdio: 'pipe',
          timeout: 5000 
        });
        
        let hasOutput = false;
        testProcess.stdout.on('data', (data) => {
          hasOutput = true;
          console.log('📦 MCP package found:', data.toString().trim());
        });
        
        testProcess.stderr.on('data', (data) => {
          console.log('📦 MCP package check stderr:', data.toString().trim());
        });
        
        await new Promise((resolve, reject) => {
          testProcess.on('close', (code) => {
            if (code === 0 || hasOutput) {
              console.log('✅ @isaacphi/mcp-gdrive package is available');
            } else {
              console.log('⚠️ @isaacphi/mcp-gdrive package not found or not working');
              console.log('💡 Install with: npm install -g @isaacphi/mcp-gdrive');
            }
            resolve();
          });
          
          testProcess.on('error', (err) => {
            console.log('⚠️ Could not check MCP package:', err.message);
            resolve(); // Continue anyway
          });
        });
      } catch (checkError) {
        console.log('⚠️ Package check failed:', checkError.message);
      }
      
      // Try multiple command variations for Windows compatibility
      const commands = [
        { command: 'npx.cmd', args: ['@isaacphi/mcp-gdrive'] },
        { command: 'npx', args: ['@isaacphi/mcp-gdrive'] },
        { command: 'cmd', args: ['/c', 'npx', '@isaacphi/mcp-gdrive'] },
        { command: 'powershell', args: ['-Command', 'npx @isaacphi/mcp-gdrive'] }
      ];

      // Also try direct node execution if we can find the script
      const mcpPaths = this.findMCPServerPaths();
      console.log(`🔍 Found ${mcpPaths.length} potential MCP server paths:`, mcpPaths);
      
      if (mcpPaths.length > 0) {
        mcpPaths.forEach(path => {
          commands.unshift({ command: 'node', args: [path] });
        });
      }
      
      let lastError = null;
      
      for (const cmdConfig of commands) {
        try {
          console.log(`🔄 Trying command: ${cmdConfig.command} ${cmdConfig.args.join(' ')}`);
          
          // Check environment variables
          const requiredEnvs = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
          const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
          if (missingEnvs.length > 0) {
            console.log(`⚠️ Missing environment variables: ${missingEnvs.join(', ')}`);
          }
          
          this.transport = new StdioClientTransport({
            command: cmdConfig.command,
            args: cmdConfig.args,
            env: {
              ...process.env,
              CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
              CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
              GDRIVE_CREDS_DIR: process.cwd()
            }
          });

          this.client = new Client({
            name: 'gdrive-webapp-client',
            version: '1.0.0'
          }, {
            capabilities: {
              resources: {},
              tools: {}
            }
          });

          console.log('🔗 Attempting to connect to MCP server...');
          // Connect to the server
          await this.client.connect(this.transport);
          this.isConnected = true;
          
          console.log(`✅ Successfully connected to MCP GDrive server using: ${cmdConfig.command}`);
          
          // List available tools
          try {
            console.log('📋 Listing available MCP tools...');
            const tools = await this.client.listTools();
            console.log(`✅ Available tools (${tools.tools.length}):`, tools.tools.map(t => t.name));
            return true;
          } catch (err) {
            console.log(`⚠️ Could not list tools: ${err.message}`);
            console.log('🔧 Connection established but tools unavailable');
            return false;
          }
          
        } catch (cmdError) {
          console.log(`❌ Failed with ${cmdConfig.command}: ${cmdError.message}`);
          console.log(`📝 Error details:`, cmdError.code || 'Unknown error code');
          lastError = cmdError;
          continue;
        }
      }
      
      // If all commands failed, throw the last error
      const errorMessage = lastError?.message || 'All connection methods failed';
      console.log(`❌ All MCP connection attempts failed. Last error: ${errorMessage}`);
      
      // Check if the package is installed
      console.log('💡 Troubleshooting tips:');
      console.log('   1. Install MCP GDrive: npm install -g @isaacphi/mcp-gdrive');
      console.log('   2. Check environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET');
      console.log('   3. Verify Google Drive API is enabled in your project');
      
      throw lastError || new Error('All connection methods failed');
      
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      this.isConnected = false;
      
      // Try alternative connection method
      try {
        console.log('Trying alternative connection method...');
        return await this.connectAlternative();
      } catch (altError) {
        console.error('Alternative connection also failed:', altError);
        return false;
      }
    }
  }

  async connectAlternative() {
    try {
      console.log('Trying alternative connection methods...');
      
      // Alternative approaches for Windows
      const alternatives = [
        { command: 'cmd', args: ['/c', 'npm', 'exec', '@isaacphi/mcp-gdrive'] },
        { command: 'powershell', args: ['-Command', 'npx @isaacphi/mcp-gdrive'] },
        { command: 'node', args: ['-e', 'require("@isaacphi/mcp-gdrive")'] }
      ];
      
      for (const alt of alternatives) {
        try {
          console.log(`Trying alternative: ${alt.command} ${alt.args.join(' ')}`);
          
          this.transport = new StdioClientTransport({
            command: alt.command,
            args: alt.args,
            env: {
              ...process.env,
              CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
              CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
              GDRIVE_CREDS_DIR: process.cwd()
            }
          });

          this.client = new Client({
            name: 'gdrive-webapp-client-alt',
            version: '1.0.0'
          }, {
            capabilities: {
              resources: {},
              tools: {}
            }
          });

          await this.client.connect(this.transport);
          this.isConnected = true;
          
          console.log(`✅ Alternative connection successful: ${alt.command}`);
          return true;
          
        } catch (altError) {
          console.log(`Alternative ${alt.command} failed:`, altError.message);
          continue;
        }
      }
      
      throw new Error('All alternative connection methods failed');
      
    } catch (error) {
      console.error('Alternative connection also failed:', error);
      
      // Final fallback - disable MCP and use direct Google Drive API
      console.log('⚠️ MCP connection failed completely. Running in fallback mode.');
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log('Disconnected from MCP GDrive server');
    }
  }

  async listFiles(folderId = 'root', maxResults = 10) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await this.client.callTool({
        name: 'gdrive_search',
        arguments: {
          query: `'${folderId}' in parents`,
          pageSize: maxResults,
        },
      });
      return result;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async searchFiles(query, maxResults = 10) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await this.client.callTool({
        name: 'gdrive_search',
        arguments: {
          query: query,
          pageSize: maxResults,
        },
      });
      return result;
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  async uploadFile(filePath, fileName, parentFolderId = 'root') {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }
    throw new Error(
      'Tool "gdrive_upload_file" not supported by @isaacphi/mcp-gdrive'
    );
  }

  async downloadFile(fileId, downloadPath) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await this.client.callTool({
        name: 'gdrive_read_file',
        arguments: {
          fileId: fileId,
        },
      });
      return result;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async createFolder(folderName, parentFolderId = 'root') {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }
    throw new Error(
      'Tool "gdrive_create_folder" not supported by @isaacphi/mcp-gdrive'
    );
  }

  async deleteFile(fileId) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }
    throw new Error(
      'Tool "gdrive_delete_file" not supported by @isaacphi/mcp-gdrive'
    );
  }

  async getFileInfo(fileId) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }
    throw new Error(
      'Tool "gdrive_get_file_info" not supported by @isaacphi/mcp-gdrive'
    );
  }
}

export default MCPGDriveClient;
