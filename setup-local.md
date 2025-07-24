# Local Development Setup (VS Code/Non-Replit)

This guide helps you set up Zebulon AI System in VS Code or any local development environment without Replit dependencies.

## Quick Setup

### 1. Replace package.json
```bash
cp package-local.json package.json
npm install
```

### 2. Use clean Vite config
The project includes `vite.config.local.ts` with no Replit dependencies.

### 3. Start development
```bash
npm run dev  # Uses local configuration
```

## Files Included for Local Development

### Essential Files (Keep these)
- `client/` - React frontend source code
- `server/` - Express backend source code  
- `shared/` - Shared TypeScript schemas
- `package-local.json` - Clean package.json without Replit deps
- `vite.config.local.ts` - Clean Vite config
- `build.js` - Standard build script
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `drizzle.config.ts` - Database configuration
- `components.json` - shadcn/ui configuration

### Files You Can Remove (Replit-specific)
- `replit.md` ❌
- Any files with `replit` in the name ❌
- `browser-extension/` ❌ 
- `desktop-app/` ❌
- `mobile-shortcuts/` ❌
- `deployment-scripts/` ❌
- `attached_assets/` ❌
- Various deployment markdown files ❌

## Local Development Commands

```bash
# Install dependencies
npm install

# Start development (both frontend and backend)
npm run dev

# Start only backend server
npm run dev:server

# Start only frontend dev server  
npm run dev:client

# Build for production
npm run build

# Run production build
npm start

# Database operations
npm run db:push    # Apply schema changes
npm run db:studio  # Open Drizzle Studio
```

## Environment Setup

Create `.env` file:
```env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/zebulon
SESSION_SECRET=your-secret-key-here
PORT=5000
```

## VS Code Extensions (Recommended)

- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense  
- PostCSS Language Support
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Bracket Pair Colorizer

## Port Configuration

- Backend API: `http://localhost:5000`
- Frontend Dev: `http://localhost:5173`
- Production: `http://localhost:5000` (serves both)

## Database Setup

1. Install PostgreSQL locally or use a cloud provider
2. Create database: `createdb zebulon`  
3. Update `DATABASE_URL` in `.env`
4. Push schema: `npm run db:push`

## Development Workflow

1. Run `npm run dev` to start both servers
2. Frontend hot-reloads on file changes
3. Backend restarts automatically with tsx
4. API available at localhost:5000/api/*
5. WebSocket connection for real-time features

## Production Deployment

```bash
npm run build  # Creates dist/ folder
npm start      # Runs production server
```

The build creates:
- `dist/public/` - Frontend assets
- `dist/server/` - Backend code
- `dist/index.js` - Production entry point