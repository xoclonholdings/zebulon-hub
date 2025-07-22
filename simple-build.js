#!/usr/bin/env node

// Simple build approach that works with existing development setup
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🏗️  Building Zebulon AI System for deployment...');

try {
  // Build client assets
  console.log('📦 Building client assets...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Create deployment directory structure
  console.log('📁 Creating deployment structure...');
  if (!fs.existsSync('dist/server')) {
    fs.mkdirSync('dist/server', { recursive: true });
  }
  
  // Copy server files directly (they work fine as TypeScript in development)
  console.log('📄 Copying server files...');
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
  
  // Copy all necessary files
  copyRecursively('server', 'dist/server');
  copyRecursively('shared', 'dist/shared');
  
  // Copy configuration files
  fs.copyFileSync('package.json', 'dist/package.json');
  fs.copyFileSync('vite.config.ts', 'dist/vite.config.ts');
  if (fs.existsSync('drizzle.config.ts')) {
    fs.copyFileSync('drizzle.config.ts', 'dist/drizzle.config.ts');
  }
  if (fs.existsSync('tsconfig.json')) {
    fs.copyFileSync('tsconfig.json', 'dist/tsconfig.json');
  }
  
  // Create production server entry point that uses tsx
  const serverEntryContent = `#!/usr/bin/env node
// Production server entry point for Zebulon AI System
// Uses tsx to handle TypeScript files directly
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';

// Start the server using tsx
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
});`;

  fs.writeFileSync('dist/index.js', serverEntryContent);
  
  // Update package.json with correct scripts and add tsx as dependency
  console.log('📄 Updating package configuration...');
  const packageJsonPath = 'dist/package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.scripts = {
    ...packageJson.scripts,
    "build": "echo 'Build already completed'",
    "start": "node index.js",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  };
  
  // Ensure tsx is available in production
  if (!packageJson.dependencies.tsx) {
    packageJson.dependencies.tsx = packageJson.dependencies.tsx || "^4.20.3";
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  console.log('✅ Build completed successfully!');
  console.log('📋 Deployment Summary:');
  console.log('   - Client assets: dist/public/');
  console.log('   - Server files: dist/server/ (TypeScript)');
  console.log('   - Entry point: dist/index.js');
  console.log('   - Package config: dist/package.json');
  console.log('🚀 Ready for deployment!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}