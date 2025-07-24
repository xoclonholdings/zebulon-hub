#!/bin/bash

echo "🧹 Setting up Zebulon AI System for LOCAL development (removing ALL Replit dependencies)"

# Backup original files
echo "📦 Backing up original files..."
cp package.json package.json.replit.backup
cp vite.config.ts vite.config.ts.replit.backup
cp build.js build.js.replit.backup

# Remove Replit node_modules
echo "🗑️ Removing Replit dependencies..."
rm -rf node_modules/@replit
rm -rf node_modules/.cache

# Replace with clean configuration
echo "🔧 Installing clean configuration..."
cp package.clean.json package.json
cp vite.config.clean.ts vite.config.ts
cp build.clean.js build.js

# Make scripts executable
chmod +x build.js
chmod +x setup-clean-local.sh

# Install clean dependencies
echo "📥 Installing clean dependencies..."
npm install

# Create clean .env file
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "⚠️ IMPORTANT: Edit .env file with your database URL and secrets"
fi

# Create VS Code configuration
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.path": "./node_modules/typescript/lib",
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "tailwindCSS.experimental.configFile": "./tailwind.config.ts",
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
EOF

cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["tsx"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
EOF

echo "✅ Setup complete!"
echo ""
echo "🚀 To start development:"
echo "  1. Edit .env file with your database URL"
echo "  2. Run: npm run dev"
echo ""
echo "📁 Clean files created:"
echo "  - package.json (clean dependencies)"
echo "  - vite.config.ts (no Replit plugins)"  
echo "  - build.js (local build script)"
echo "  - .vscode/ (VS Code configuration)"
echo ""
echo "🔄 Original files backed up with .replit.backup extension"