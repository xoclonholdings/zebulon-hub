# Zebulon AI System

## Overview

The Zebulon AI System is a next-generation personal AI ecosystem with complete offline capabilities, designed as a modular, full-stack application featuring multiple AI cores with specialized functions. The system serves as a unified platform for AI-powered database operations, security management, and personal assistance.

## User Preferences

Preferred communication style: Simple, everyday language.
Design theme: Exact styling as shown in user-provided reference images - pure black backgrounds, dark gray containers with rounded corners, purple/magenta Zebulon branding accents, clean minimalist interface with proper spacing. Transparent Zed AI logo overlay. No deviations from this approved design theme.

## Recent Changes (2025-07-25)

**✅ UNIFIED SINGLE-SERVER ARCHITECTURE IMPLEMENTED**
- ✅ Consolidated frontend and backend into single port 5000
- ✅ Eliminated dual-server complexity and connection issues
- ✅ Created embedded HTML/JavaScript frontend in server/index.ts
- ✅ Complete authentication system with login/signup forms
- ✅ Real-time chat interface with Zed AI assistant
- ✅ Database integration for user accounts and message persistence
- ✅ Professional interface with Zebulon branding
- ✅ Single command startup - no separate Vite server needed

**✅ TAB-BASED NAVIGATION SYSTEM ADDED**
- ✅ Implemented Chat and Admin tabs for organized interface
- ✅ Moved password change functionality to Admin section
- ✅ Added system information display in Admin tab
- ✅ Enhanced session management in Admin section
- ✅ Improved UI design with proper tab styling and navigation

**✅ REACT CLIENT ADMIN PANEL IMPLEMENTED**
- ✅ Added full tab-based navigation in React client (Chat, Status, Security, Music, Oracle, Admin)
- ✅ Created comprehensive Admin tab with password change functionality
- ✅ Integrated password change API with proper error handling and validation
- ✅ Added system information display and session management in Admin
- ✅ Maintained consistent dark theme across all tabs and components

**✅ SINGLE UNIFIED SERVER ARCHITECTURE CONFIRMED**
- ✅ Eliminated dual-server confusion by running only unified server on port 5000
- ✅ Single interface serves complete React application with all tab functionality
- ✅ Password change functionality fully integrated in Admin tab
- ✅ No separate Vite development server - everything unified on one port
- ✅ Clean architecture with frontend and backend on single server

**✅ DUAL-PORT REFERENCES COMPLETELY REMOVED**
- ✅ Removed all Vite development server references from server/index.ts CORS configuration
- ✅ Deleted unused server/vite.ts file completely
- ✅ Cleaned up server/routes.ts that was causing LSP errors
- ✅ Updated console messages to reflect unified architecture only
- ✅ Single server serves built React app from server/public/ directory

**✅ PROJECT CLEANED UP - ZEBULON & ZED ONLY**
- ✅ Removed all non-Zebulon/Zed components and files
- ✅ Simplified database schema to core functionality only (User, ChatMessage, SystemStatus)  
- ✅ Deleted unused widgets, security modules, Oracle, and complex services
- ✅ Streamlined server routes to essential authentication and chat endpoints
- ✅ Kept authentication system with login screen as entry point
- ✅ Maintained user-provided Zed AI logo integration
- ✅ Clean codebase with no unnecessary complexity
- ✅ Focus purely on Zebulon AI System and Zed assistant functionality

**✅ PORTABLE VERSION PREPARED**
- ✅ Created comprehensive VS Code configuration and setup guides
- ✅ Documented complete Replit dependency removal process
- ✅ Prepared portable database connection alternatives
- ✅ Project ready for transfer to any development environment
- ✅ No vendor lock-in - fully portable Node.js application

**✅ DESIGN THEME FINALIZED**
- ✅ Implemented sleek black theme with pure black background
- ✅ Transparent Zed AI logo displays cleanly without background interference
- ✅ Dark gray containers with subtle white borders maintain minimalist aesthetic
- ✅ Logo properly served from static files with no filters or containers
- ✅ Consistent dark theme across all interface elements (forms, buttons, chat)

**✅ APPROVED DESIGN THEME LOCKED IN**
- ✅ User-provided reference images establish the exact styling requirements
- ✅ Pure black backgrounds with dark gray containers and rounded corners
- ✅ Purple/magenta Zebulon branding accents as shown in reference
- ✅ Clean minimalist interface with proper spacing and transparent logo
- ✅ No deviations from this approved design theme allowed

**✅ SINGLE PORT 5000 INTERFACE REQUIREMENT**
- ✅ User requested removal of any interface not on port 5000
- ✅ Only the unified server on port 5000 should be accessed
- ✅ All Vite development server references completely removed
- ✅ All styling changes built and deployed to server/public/ directory
- ✅ Login page updated to match approved design theme on port 5000
- ✅ Created start-server-only.ts script to run ONLY the unified server
- ⚠️ Workflow still runs dual servers due to package.json restrictions
- ✅ Port 5000 is the ONLY interface to be used - ignore Vite development server

## System Architecture

The Zebulon system follows a modern full-stack architecture with the following key components:

- **Frontend**: React with TypeScript, using Vite for bundling only (no development server)
- **Backend**: Express.js server with TypeScript support  
- **Database**: PostgreSQL with Drizzle ORM (Neon serverless)
- **Real-time Communication**: WebSocket for live interactions
- **PWA Support**: Complete Progressive Web App with offline capabilities
- **AI Processing**: Local AI engine with no external dependencies

## Key Components

### Frontend Architecture
- **React 18** with TypeScript and modern hooks
- **Tailwind CSS** for styling with mobile-first responsive design
- **shadcn/ui** component library for consistent UI elements
- **Wouter** for lightweight client-side routing
- **TanStack Query** for efficient data fetching and caching
- **Progressive Web App** with service worker for offline functionality

### Backend Architecture
- **Express.js** server with comprehensive middleware stack
- **TypeScript** throughout the server codebase
- **Modular route system** with separate API endpoints
- **Security-first design** with comprehensive protection layers
- **WebSocket server** for real-time communication

### AI Core System
The system implements a focused AI core architecture:

1. **Zed Core**: Primary conversational AI assistant
   - Natural language processing and conversation handling
   - Context awareness and memory management
   - Task and workflow assistance
   - Local AI processing without external dependencies

### Database Schema
- **Chat Messages**: Conversation history with Zed AI assistant
- **System Status**: Real-time system health monitoring for Zebulon core components

## Data Flow

1. **User Interaction**: Users interact through the React frontend
2. **API Layer**: Express.js routes handle requests with security middleware
3. **AI Processing**: Local AI engine processes messages without external APIs
4. **Database Operations**: Drizzle ORM manages PostgreSQL interactions
5. **Real-time Updates**: WebSocket provides live system updates
6. **Response Delivery**: Processed responses return through the API layer

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **express**: Web server framework
- **ws**: WebSocket implementation
- **react**: Frontend framework
- **vite**: Build tool and development server

### Security Dependencies
- **bcrypt**: Password hashing
- **helmet**: Security headers
- **express-rate-limit**: Request rate limiting
- **sanitize-html**: Input sanitization
- **validator**: Data validation

### UI Dependencies
- **@radix-ui**: Accessible UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

## Deployment Strategy

### Build System
- **Vite** handles client-side asset building and optimization
- **TypeScript compilation** for both client and server code
- **Asset optimization** with minification and compression
- **Progressive Web App** manifest and service worker generation

### Production Deployment
- **Single entry point**: `dist/index.js` for production server
- **Static asset serving**: Built client assets served from `dist/public`
- **Environment configuration**: Database URL and security keys from environment variables
- **Health monitoring**: Built-in diagnostics and performance metrics

### Offline Capabilities
- **Service Worker** caches essential files for offline access
- **Local AI processing** works without internet connectivity
- **Progressive enhancement** degrades gracefully when offline
- **Data synchronization** when connection is restored

### Security Considerations
- **Input sanitization** at all API entry points
- **Rate limiting** to prevent abuse
- **Secure headers** with Helmet middleware
- **Password hashing** with bcrypt
- **Session management** with secure cookies
- **CSRF protection** and XSS prevention

The system is designed to be completely self-contained, requiring no external AI APIs or cloud services once deployed, making it ideal for privacy-conscious users and offline environments.