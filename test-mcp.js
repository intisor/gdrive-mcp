import MCPGDriveClient from './mcp-client.js';

async function testMCPConnection() {
    console.log('🧪 Testing MCP GDrive connection...');
    
    const client = new MCPGDriveClient();
    
    try {
        // Test connection
        const connected = await client.connect();
        if (!connected) {
            console.error('❌ Failed to connect to MCP server');
            return;
        }
        
        console.log('✅ Successfully connected to MCP server');
        
        // Test listing files
        console.log('📁 Testing file listing...');
        const files = await client.listFiles('root', 5);
        console.log('Files result:', files);
        
        // Test search (if there are files)
        console.log('🔍 Testing file search...');
        const searchResults = await client.searchFiles('test', 3);
        console.log('Search result:', searchResults);
        
        console.log('✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await client.disconnect();
        console.log('🔌 Disconnected from MCP server');
    }
}

// Run the test
testMCPConnection();