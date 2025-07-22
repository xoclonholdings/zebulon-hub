#!/usr/bin/env node

// Script to fix ES module import paths in the compiled dist directory
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Fixing ES module import paths...');

const distDir = path.join(__dirname, 'dist');

// Function to recursively find all .js files
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

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix relative imports without .js extension (for paths starting with ./)
  content = content.replace(/from ["']([.][^"']*?)["']/g, (match, importPath) => {
    if (!importPath.endsWith('.js') && (!importPath.includes('.') || importPath.endsWith('.'))) {
      modified = true;
      return match.replace(importPath, importPath + '.js');
    }
    return match;
  });
  
  // Fix local imports without .js extension (not starting with . but also not npm packages)
  content = content.replace(/from ["']([^./][^"']*?)["']/g, (match, importPath) => {
    // Skip npm packages (no slash or starts with @)
    if (!importPath.includes('/') || importPath.startsWith('@')) {
      return match;
    }
    if (!importPath.endsWith('.js')) {
      modified = true;
      return match.replace(importPath, './' + importPath + '.js');
    }
    return match;
  });
  
  // Fix @shared imports to use relative paths
  const relativePath = path.relative(path.dirname(filePath), path.join(distDir, 'shared'));
  const relativeImportPath = relativePath.split(path.sep).join('/');
  
  content = content.replace(/from ["']@shared\/([^"']*?)["']/g, (match, subPath) => {
    modified = true;
    return `from "${relativeImportPath}/${subPath}.js"`;
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
  
  console.log('🎉 Import fixing completed successfully!');
} catch (error) {
  console.error('❌ Error fixing imports:', error.message);
  process.exit(1);
}