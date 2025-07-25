#!/usr/bin/env node

import { spawn } from 'child_process';
import process from 'process';

console.log('🔮 Starting Zebulon Oracle Database System (Single Server Mode)');
console.log('🌍 Running on port 5000 with unified frontend and backend');

// Start only the Oracle server
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '5000'
  }
});

server.on('close', (code) => {
  console.log(`Oracle server exited with code ${code}`);
  process.exit(code);
});

server.on('error', (err) => {
  console.error('Failed to start Oracle server:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Oracle server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down Oracle server...');
  server.kill('SIGTERM');
});