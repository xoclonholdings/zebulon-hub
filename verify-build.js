#!/usr/bin/env node

// Build verification script for Zebulon AI System
import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying deployment build...');

const requiredPaths = [
  { path: 'dist/public/index.html', description: 'Client entry point' },
  { path: 'dist/public/assets', description: 'Client assets directory' },
  { path: 'server/public/index.html', description: 'Server static files' },
  { path: 'dist/server/public/index.html', description: 'Production static files' },
  { path: 'dist/server/index.ts', description: 'Server entry point' },
  { path: 'dist/index.js', description: 'Production entry script' },
  { path: 'dist/package.json', description: 'Production package configuration' },
];

let allValid = true;

for (const { path: filePath, description } of requiredPaths) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
  } else {
    console.log(`❌ Missing ${description}: ${filePath}`);
    allValid = false;
  }
}

// Check if the build has the correct structure
if (fs.existsSync('dist/public/assets')) {
  const assets = fs.readdirSync('dist/public/assets');
  const hasJS = assets.some(file => file.endsWith('.js'));
  const hasCSS = assets.some(file => file.endsWith('.css'));
  
  console.log(`📦 Assets found: ${assets.length} files`);
  if (hasJS) console.log('✅ JavaScript bundle found');
  if (hasCSS) console.log('✅ CSS bundle found');
  
  if (!hasJS || !hasCSS) {
    console.log('⚠️  Missing essential asset bundles');
    allValid = false;
  }
}

console.log('');

if (allValid) {
  console.log('🎉 Build verification passed! All required files are present.');
  console.log('🚀 Ready for deployment');
} else {
  console.log('❌ Build verification failed. Run "npm run build" to fix issues.');
  process.exit(1);
}