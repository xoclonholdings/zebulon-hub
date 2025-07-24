#!/usr/bin/env node

// Local development server without Replit dependencies
import { spawn } from 'child_process';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clean Vite config without Replit plugins
const viteConfig = {
  plugins: [
    (await import('@vitejs/plugin-react')).default(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
};

async function startDev() {
  try {
    console.log('🚀 Starting Zebulon AI System in local development mode...');
    
    // Start the backend server
    console.log('📡 Starting backend server...');
    const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    // Start Vite dev server with clean config
    console.log('⚡ Starting frontend dev server...');
    const vite = await createServer(viteConfig);
    await vite.listen();
    
    console.log('✅ Development servers started!');
    console.log('📱 Frontend: http://localhost:5173');
    console.log('🔧 Backend: http://localhost:5000');
    
    // Handle cleanup
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development servers...');
      serverProcess.kill();
      vite.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start development servers:', error);
    process.exit(1);
  }
}

startDev();