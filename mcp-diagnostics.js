// Quick MCP diagnostics script
import { spawn } from 'child_process';

console.log('🔍 MCP GDrive Diagnostics');
console.log('==========================');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Check if npx is available
console.log('\n🔧 Command Availability:');
try {
  const npxCheck = spawn('npx', ['--version'], { stdio: 'pipe' });
  npxCheck.stdout.on('data', (data) => {
    console.log('npx version:', data.toString().trim());
  });
  npxCheck.on('close', (code) => {
    if (code === 0) {
      console.log('✅ npx is available');
      
      // Check if MCP package can be found
      console.log('\n📦 Checking @isaacphi/mcp-gdrive package...');
      const mcpCheck = spawn('npx', ['@isaacphi/mcp-gdrive', '--help'], { 
        stdio: 'pipe',
        timeout: 10000 
      });
      
      let hasOutput = false;
      mcpCheck.stdout.on('data', (data) => {
        hasOutput = true;
        console.log('✅ MCP package found and working');
        console.log('Package output:', data.toString().trim().substring(0, 200) + '...');
      });
      
      mcpCheck.stderr.on('data', (data) => {
        const error = data.toString().trim();
        console.log('❌ MCP package error:', error);
        
        if (error.includes('not found') || error.includes('command not found')) {
          console.log('💡 Solution: Install with "npm install -g @isaacphi/mcp-gdrive"');
        }
        
        if (error.includes('permission') || error.includes('EACCES')) {
          console.log('💡 Solution: Run with admin privileges or fix npm permissions');
        }
        
        if (error.includes('CLIENT_ID') || error.includes('CLIENT_SECRET')) {
          console.log('💡 Solution: Check your Google OAuth credentials');
        }
      });
      
      mcpCheck.on('close', (code) => {
        if (code !== 0 && !hasOutput) {
          console.log(`❌ MCP package check failed with code ${code}`);
          console.log('💡 Try installing: npm install -g @isaacphi/mcp-gdrive');
        }
      });
      
      mcpCheck.on('error', (err) => {
        console.log('❌ Error running MCP package:', err.message);
      });
      
    } else {
      console.log('❌ npx not available');
    }
  });
  
  npxCheck.on('error', (err) => {
    console.log('❌ npx not found:', err.message);
  });
  
} catch (error) {
  console.log('❌ Error checking npx:', error.message);
}

// Check Node.js version
console.log('\n🟢 Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);

setTimeout(() => {
  console.log('\n🏁 Diagnostics complete');
}, 5000);
