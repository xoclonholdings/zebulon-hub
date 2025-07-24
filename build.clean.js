#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🚀 Building Zebulon AI System for production...');

try {
  // Clean previous build
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
    console.log('✅ Cleaned previous build');
  }

  // Create dist directory
  fs.mkdirSync('dist', { recursive: true });

  // Build client
  console.log('📦 Building client...');
  await execAsync('npm run build:client');
  console.log('✅ Client built successfully');

  // Build server  
  console.log('🔧 Building server...');
  await execAsync('npm run build:server');
  console.log('✅ Server built successfully');

  // Copy server files to dist
  const serverFiles = ['server', 'shared'];
  serverFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.cpSync(file, `dist/${file}`, { recursive: true });
      console.log(`✅ Copied ${file} to dist/`);
    }
  });

  // Copy package.json and other necessary files
  const rootFiles = ['package.json', 'drizzle.config.ts'];
  rootFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, `dist/${file}`);
      console.log(`✅ Copied ${file} to dist/`);
    }
  });
  
  // Create production entry point
  const serverEntry = `#!/usr/bin/env node
// Production server for Zebulon AI System
import './server/index.js';
`;

  fs.writeFileSync('dist/index.js', serverEntry);
  fs.chmodSync('dist/index.js', '755');
  console.log('✅ Production entry point created');

  console.log('🎉 Build completed successfully!');
  console.log('📁 Production files are in the dist/ directory');
  console.log('🚀 Run "npm start" to start the production server');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}