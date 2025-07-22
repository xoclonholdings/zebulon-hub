#!/usr/bin/env node

// Script to fix npm package imports that got .js extensions incorrectly added
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Fixing npm package imports...');

const distDir = path.join(__dirname, 'dist');

function findJSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findJSFiles(fullPath));
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixNpmImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // List of npm packages that should not have .js extension
  const npmPackages = [
    'drizzle-orm', 'drizzle-zod', 'zod', 'bcrypt', 'express', 'ws', 'helmet',
    'express-rate-limit', 'sanitize-html', 'validator', 'openai', 'nanoid',
    'vite', '@vitejs/plugin-react', '@replit/vite-plugin-runtime-error-modal',
    '@replit/vite-plugin-cartographer'
  ];
  
  // Fix npm package imports that incorrectly have .js extensions
  for (const pkg of npmPackages) {
    // Fix basic package imports
    const regex1 = new RegExp(`from ["']${pkg}\\.js["']`, 'g');
    if (content.match(regex1)) {
      content = content.replace(regex1, `from "${pkg}"`);
      modified = true;
    }
    
    // Fix package subpath imports
    const regex2 = new RegExp(`from ["']${pkg}/([^"']+)\\.js["']`, 'g');
    if (content.match(regex2)) {
      content = content.replace(regex2, `from "${pkg}/$1"`);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed npm imports in: ${path.relative(distDir, filePath)}`);
  }
}

try {
  const jsFiles = findJSFiles(distDir);
  console.log(`📂 Found ${jsFiles.length} JavaScript files to process`);
  
  for (const file of jsFiles) {
    fixNpmImportsInFile(file);
  }
  
  console.log('🎉 NPM import fixing completed successfully!');
} catch (error) {
  console.error('❌ Error fixing npm imports:', error.message);
  process.exit(1);
}