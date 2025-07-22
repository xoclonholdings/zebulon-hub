#!/usr/bin/env node

// Comprehensive script to fix all ES module import paths in the compiled dist directory
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Comprehensively fixing all ES module import paths...');

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

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const originalContent = content;
  
  // List of npm packages that should not be modified
  const npmPackages = [
    'express', 'http', 'ws', 'drizzle-orm', 'bcrypt', 'openai', 'sanitize-html',
    'validator', 'helmet', 'express-rate-limit', 'nanoid', 'vite', 'fs', 'path'
  ];
  
  // Fix all import statements
  content = content.replace(/import\s+([^'"]*?)\s+from\s+["']([^"']+)["']/g, (match, importPart, importPath) => {
    const originalImportPath = importPath;
    
    // Skip npm packages
    if (npmPackages.some(pkg => importPath === pkg || importPath.startsWith(pkg + '/'))) {
      return match;
    }
    
    // Skip already correctly formatted paths
    if (importPath.endsWith('.js')) {
      return match;
    }
    
    // Handle @shared imports
    if (importPath.startsWith('@shared/')) {
      const subPath = importPath.replace('@shared/', '');
      const relativePath = path.relative(path.dirname(filePath), path.join(distDir, 'shared'));
      const relativeImportPath = relativePath.split(path.sep).join('/');
      const newPath = `${relativeImportPath}/${subPath}.js`;
      modified = true;
      return match.replace(originalImportPath, newPath);
    }
    
    // Handle relative imports starting with ./
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const newPath = importPath + '.js';
      modified = true;
      return match.replace(originalImportPath, newPath);
    }
    
    // Handle local imports that don't start with . but should be relative
    // Check if the file exists relative to current file
    const currentDir = path.dirname(filePath);
    const possiblePaths = [
      path.join(currentDir, importPath + '.js'),
      path.join(currentDir, importPath, 'index.js')
    ];
    
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        const newPath = './' + importPath + '.js';
        modified = true;
        return match.replace(originalImportPath, newPath);
      }
    }
    
    return match;
  });
  
  // Fix dynamic imports too
  content = content.replace(/import\s*\(\s*["']([^"']+)["']\s*\)/g, (match, importPath) => {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      if (!importPath.endsWith('.js')) {
        modified = true;
        return match.replace(importPath, importPath + '.js');
      }
    }
    return match;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed imports in: ${path.relative(distDir, filePath)}`);
  }
}

try {
  const jsFiles = findJSFiles(distDir);
  console.log(`📂 Found ${jsFiles.length} JavaScript files to process`);
  
  for (const file of jsFiles) {
    fixImportsInFile(file);
  }
  
  console.log('🎉 Comprehensive import fixing completed successfully!');
} catch (error) {
  console.error('❌ Error fixing imports:', error.message);
  process.exit(1);
}