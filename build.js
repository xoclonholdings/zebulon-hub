#!/usr/bin/env node

// Build script for Zebulon AI System deployment
import { execSync } from 'child_process';

console.log('🏗️  Building Zebulon AI System for deployment...');

try {
  // Use the simple build approach that works with TypeScript
  execSync('node simple-build.js', { stdio: 'inherit' });
  
  console.log('🎉 Deployment build completed successfully!');
  console.log('');
  console.log('📋 What was created:');
  console.log('   ✅ Client assets built and optimized');
  console.log('   ✅ Server files copied (TypeScript ready)');
  console.log('   ✅ Package.json configured with build/start scripts');
  console.log('   ✅ Production entry point created');
  console.log('');
  console.log('🚀 Your application is now ready for deployment!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}