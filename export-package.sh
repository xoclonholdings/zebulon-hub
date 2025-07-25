#!/bin/bash

# Zebulon AI System - Export Package Script
echo "🔄 Preparing Zebulon AI System for export..."

# Clean build
echo "📦 Building production assets..."
npm run build

# Verify package
echo "✅ Verifying package integrity..."
npm list --depth=0

# Show export structure
echo "📁 Export package structure:"
echo "├── client/          # React frontend"
echo "├── server/          # Express backend"  
echo "├── prisma/          # Database schema"
echo "├── shared/          # Shared types"
echo "├── dist/            # Built assets"
echo "├── package.json     # Dependencies"
echo "├── EXPORT-README.md # Setup instructions"
echo "└── .env.example     # Environment template"

echo ""
echo "🎉 Package ready for ZIP export!"
echo "📋 Next steps after export:"
echo "   1. Extract ZIP file"
echo "   2. Run: npm install"
echo "   3. Copy .env.example to .env and configure DATABASE_URL"
echo "   4. Run: npm run db:generate && npm run db:push"
echo "   5. Start: npm run dev (development) or npm run build && npm start (production)"