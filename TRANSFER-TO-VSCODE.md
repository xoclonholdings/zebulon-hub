# Transfer Zebulon AI System to VS Code

## Overview
This is a complete, clean Zebulon AI System focused exclusively on Zebulon and Zed core functionality. The project has been simplified and cleaned to contain only essential components.

## Quick Setup in VS Code

### 1. Prerequisites
- Node.js 20+ 
- PostgreSQL database (or use Neon.tech free tier)
- VS Code with recommended extensions

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="your_postgresql_connection_string"
SESSION_SECRET="your_secret_key_here"
NODE_ENV="development"
```

### 3. Installation & Run
```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development servers
npm run dev
```

### 4. Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Project Structure

```
zebulon-ai-system/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── ZebulonSimple.tsx
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── context/          # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── pages/            # Page components
│   │   └── lib/              # Utilities
├── server/                   # Express backend
│   ├── db.ts                # Database connection
│   ├── index.ts             # Main server file
│   ├── routes.ts            # API routes
│   └── storage-prisma.ts    # Database operations
├── shared/                   # Shared types
│   └── schema.ts            # Type definitions
├── prisma/                   # Database schema
│   └── schema.prisma        # Prisma schema
├── attached_assets/          # User assets
│   └── Zed-ai-logo_1753425830375.jpg
└── package.json             # Dependencies
```

## Core Features

### Authentication System
- Secure login/signup with bcrypt password hashing
- Session-based authentication
- Protected routes and API endpoints
- User context management

### Zebulon AI Interface
- Clean, focused interface with your Zed AI logo
- Real-time chat with Zed AI assistant
- User-specific message history
- System status monitoring

### Database
- PostgreSQL with Prisma ORM
- Simple schema: Users, ChatMessages, SystemStatus
- Automatic migrations with `npm run db:push`

## Key Technologies
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Sessions with bcrypt

## Development Commands
```bash
npm run dev          # Start both frontend and backend
npm run dev:client   # Start only frontend (Vite)
npm run dev:server   # Start only backend (Express)
npm run build        # Build for production
npm run db:push      # Update database schema
```

## VS Code Recommended Extensions
- TypeScript and JavaScript Language Features
- Prisma
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Bracket Pair Colorizer

## Notes
- All non-Zebulon/Zed components have been removed
- Clean, minimal codebase focused on core functionality
- User's Zed AI logo integrated throughout the interface
- Ready for immediate development in VS Code
- No external API dependencies - fully self-contained

## Troubleshooting
If you encounter issues:
1. Ensure PostgreSQL is running and DATABASE_URL is correct
2. Run `npm run db:push` to sync database schema
3. Check that all dependencies are installed with `npm install`
4. Verify Node.js version is 20+

The system is now completely clean and focused solely on Zebulon and Zed functionality, ready for VS Code development!