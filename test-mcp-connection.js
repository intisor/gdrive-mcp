import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

function findMCPServerPaths() {
  const possiblePaths = [
    // Global npm paths
    join(process.env.APPDATA || '', 'npm', 'node_modules', '@isaacphi', 'mcp-gdrive', 'dist', 'index.js'),
    join(process.env.APPDATA || '', 'npm', 'node_modules', '@isaacphi', 'mcp-gdrive', 'index.js'),
    // Local node_modules
    join(__dirname, 'node_modules', '@isaacphi', 'mcp-gdrive', 'dist', 'index.js'),
    join(__dirname, 'node_modules', '@isaacphi', 'mcp-gdrive', 'index.js'),
  ];
  
  return possiblePaths.filter(path => existsSync(path));
}

async function testMCPConnection() {
  console.log('Testing MCP GDrive connection...');
  console.log('Environment check:');
  console.log('- CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
  console.log('- CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing');
  console.log('- GDRIVE_CREDS_DIR:', process.cwd());
  console.log();
  
  // Find MCP server paths
  const mcpPaths = findMCPServerPaths();
  console.log('MCP server paths found:', mcpPaths);
  console.log();
  
  // Try different connection methods
  const commands = [
    { command: 'npx.cmd', args: ['@isaacphi/mcp-gdrive'] },
    { command: 'npx', args: ['@isaacphi/mcp-gdrive'] },
    { command: 'cmd', args: ['/c', 'npx', '@isaacphi/mcp-gdrive'] }
  ];

  // Add direct node execution if paths found
  if (mcpPaths.length > 0) {
    mcpPaths.forEach(path => {
      commands.unshift({ command: 'node', args: [path] });
    });
  }
  
  for (const cmdConfig of commands) {
    try {
      console.log(`Trying: ${cmdConfig.command} ${cmdConfig.args.join(' ')}`);
      
      const transport = new StdioClientTransport({
        command: cmdConfig.command,
        args: cmdConfig.args,
        env: {
          ...process.env,
          CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
          CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
          GDRIVE_CREDS_DIR: process.cwd()
        }
      });

      const client = new Client({
        name: 'test-client',
        version: '1.0.0'
      }, {
        capabilities: {
          resources: {},
          tools: {}
        }
      });

      await client.connect(transport);
      console.log(`✅ Successfully connected using: ${cmdConfig.command}!`);
      
      // List available tools
      const tools = await client.listTools();
      console.log('Available tools:');
      tools.tools.forEach(tool => {
        console.log(`  - ${tool.name}: ${tool.description}`);
      });
      
      await client.close();
      console.log('✅ Test completed successfully!');
      process.exit(0);
      
    } catch (error) {
      console.log(`❌ Failed with ${cmdConfig.command}:`, error.message);
      continue;
    }
  }
  
  console.log('❌ All connection methods failed. App will run in fallback mode.');
  process.exit(1);
}

testMCPConnection();
