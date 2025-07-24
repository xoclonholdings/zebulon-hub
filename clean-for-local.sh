#!/bin/bash

# Script to clean Zebulon AI System for local development (VS Code, etc.)
# Removes all Replit-specific files and configurations

echo "🧹 Cleaning Zebulon AI System for local development..."

# Remove Replit-specific files
echo "📁 Removing Replit-specific files..."
rm -rf replit.md
rm -rf .replit replit.nix 2>/dev/null || true
rm -rf DEPLOYMENT-SUMMARY.md README-DEPLOYMENT.md INSTALL.md
rm -rf deployment-scripts deployment-config.json deployment-verification.md
rm -rf browser-extension desktop-app mobile-shortcuts
rm -rf attached_assets
rm -rf dist public

# Remove build and deployment scripts
echo "🔧 Removing build scripts..."
rm -f build.js simple-build.js deploy.js start.js
rm -f comprehensive-fix-imports.js fix-imports.js fix-npm-imports.js verify-build.js
rm -f package-*.json install.sh install.bat xoclon.md
rm -f dev-local.js

# Replace with clean configurations
echo "⚙️ Setting up clean configuration..."
if [ -f "package-local.json" ]; then
    cp package-local.json package.json
    echo "✅ Replaced package.json with clean version"
fi

# Create .env template if it doesn't exist
if [ ! -f ".env" ]; then
    cat > .env << EOF
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/zebulon
SESSION_SECRET=your-random-secret-key-here
PORT=5000
EOF
    echo "✅ Created .env template"
fi

# Create VS Code settings
mkdir -p .vscode
cat > .vscode/settings.json << EOF
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  }
}
EOF

echo "✅ Created VS Code settings"

# Create VS Code launch configuration
cat > .vscode/launch.json << EOF
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Server",
      "type": "node",
      "request": "launch",
      "program": "\${workspaceFolder}/server/index.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "tsx/esm"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
EOF

echo "✅ Created VS Code debug configuration"

echo ""
echo "🎉 Cleanup complete! Your project is now ready for local development."
echo ""
echo "📝 Next steps:"
echo "   1. npm install"
echo "   2. Update .env with your database URL"
echo "   3. npm run db:push"
echo "   4. npm run dev"
echo ""
echo "🚀 Access your app at: http://localhost:5000"