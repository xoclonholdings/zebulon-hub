#!/usr/bin/env node

// Production start script for Zebulon AI System
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';

// Start the production server
try {
  // Import and start the built server
  await import('./dist/server/index.js');
} catch (error) {
  console.error('Failed to start production server:', error);
  
  // Fallback to development mode if build doesn't exist
  console.log('Falling back to development mode...');
  await import('./server/index.ts');
}