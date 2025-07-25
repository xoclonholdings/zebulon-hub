#!/usr/bin/env tsx
/**
 * Unified Zebulon AI System Startup Script
 * This script starts ONLY the unified server on port 5000
 * No separate Vite development server - everything is served from one port
 */

import { spawn } from 'child_process';

console.log('🚀 Starting Unified Zebulon AI System...');
console.log('📍 Single server architecture - ONE interface on ONE port');

const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code || 0);
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down Zebulon AI System...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Shutting down Zebulon AI System...');
  server.kill('SIGINT');
});