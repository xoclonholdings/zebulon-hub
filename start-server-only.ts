#!/usr/bin/env tsx
/**
 * Server-Only Startup Script for Zebulon AI System
 * 
 * This script starts ONLY the unified server on port 5000.
 * No Vite development server on port 5173 is started.
 * 
 * Usage: npx tsx start-server-only.ts
 */

import { exec } from 'child_process';

console.log('🚀 Starting Zebulon AI System - Server Only Mode');
console.log('📍 Single unified interface on port 5000');
console.log('❌ No Vite development server (port 5173 eliminated)');
console.log('');

// Start only the server
const serverProcess = exec('NODE_ENV=development tsx server/index.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Server error: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`Server stderr: ${stderr}`);
  }
  console.log(`Server stdout: ${stdout}`);
});

// Forward server output
if (serverProcess.stdout) {
  serverProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
}

if (serverProcess.stderr) {
  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server-only mode...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});