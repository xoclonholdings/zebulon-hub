#!/usr/bin/env node

// Standard build script for Zebulon AI System
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🏗️  Building Zebulon AI System...');

try {
  // Clean previous build
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  
  // Build client assets using Vite
  console.log('📦 Building client assets...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Create server build directory
  console.log('📄 Preparing server files...');
  fs.mkdirSync('dist/server', { recursive: true });
  
  // Copy server files
  const copyRecursively = (src, dest) => {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const files = fs.readdirSync(src);
      for (const file of files) {
        copyRecursively(path.join(src, file), path.join(dest, file));
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  };
  
  // Copy necessary files for production
  copyRecursively('server', 'dist/server');
  copyRecursively('shared', 'dist/shared');
  
  // Copy configuration files
  ['package.json', 'tsconfig.json'].forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, `dist/${file}`);
    }
  });
  
  // Create production entry point
  const serverEntry = `#!/usr/bin/env node
// Production server for Zebulon AI System
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';

// Start the server using tsx to handle TypeScript
const serverPath = join(__dirname, 'server', 'index.ts');
const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  process.exit(code);
});
`;
  
  fs.writeFileSync('dist/index.js', serverEntry);
  
  console.log('✅ Build completed successfully!');
  console.log('📋 Built files:');
  console.log('   - Client: dist/public/');
  console.log('   - Server: dist/server/');
  console.log('   - Entry: dist/index.js');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}