#!/usr/bin/env tsx
// Start server-only script for unified port 5000
// This eliminates the dual-server setup and runs only the unified server
import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting Zebulon AI System - Unified Server Only');
console.log('🔧 Port 5000 - No separate Vite development server');

const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

serverProcess.on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`🔄 Server process exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Zebulon AI System...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating Zebulon AI System...');
  serverProcess.kill('SIGTERM');
});