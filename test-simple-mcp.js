import dotenv from 'dotenv';
import SimpleMCPGDriveClient from './simple-mcp-client.js';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Simple MCP Client');
console.log('============================');

const client = new SimpleMCPGDriveClient();

async function testMCP() {
  try {
    console.log('🔧 Testing MCP connection...');
    const connected = await client.connect();
    
    if (connected) {
      console.log('✅ MCP connection successful!');
      
      // Test getting status
      const status = await client.getStatus();
      console.log('📊 Status:', status);
      
      // Try a simple search
      try {
        console.log('🔍 Testing search functionality...');
        const searchResult = await client.searchFiles('test');
        console.log('🔍 Search result:', searchResult);
      } catch (searchError) {
        console.log('⚠️ Search test failed:', searchError.message);
      }
      
    } else {
      console.log('❌ MCP connection failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('🧹 Cleaning up...');
    await client.disconnect();
    console.log('✅ Test complete');
  }
}

testMCP();
