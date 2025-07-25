# Zebulon AI System

## Overview

The Zebulon AI System is a next-generation personal AI ecosystem with complete offline capabilities, designed as a modular, full-stack application featuring multiple AI cores with specialized functions. The system serves as a unified platform for AI-powered database operations, security management, and personal assistance.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (2025-01-25)

**✅ EXPORT-READY: Full Stack Integration & Unified Deployment**
- ✅ PostgreSQL 17.5 confirmed via Neon.tech with 13 production tables seeded
- ✅ TypeScript compilation: server/index.ts → dist/server/index.js working flawlessly
- ✅ Development: Port 5173 (Vite) ↔ Port 5000 (Express) via clean API proxy
- ✅ Production: Unified port 5000 serving both frontend assets and backend API
- ✅ Build system: npm run build creates optimized 441.49 kB JS, 87.52 kB CSS
- ✅ Configuration: Clean vite.config.clean.ts with zero crypto.hash dependencies (all crypto uses modern createHash API)
- ✅ Zero Replit dependencies: All packages, dev banners, and backup files removed
- ✅ Security: CORS configured for both dev (5173) and production (5000) modes
- ✅ Database: 5 active system components confirmed via /api/system/status
- ✅ Ready for immediate ZIP export with EXPORT-README.md and export-package.sh script

## System Architecture

The Zebulon system follows a modern full-stack architecture with the following key components:

- **Frontend**: React with TypeScript, using Vite for bundling and development
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
The system implements three specialized AI cores:

1. **Zed Core**: Primary conversational AI assistant
   - Natural language processing and conversation handling
   - Oracle database query generation and optimization
   - Context awareness and memory management
   - Task and workflow assistance

2. **Zeta Core**: Security and monitoring AI
   - Security threat detection and analysis
   - System monitoring and audit logging
   - Access control and permission management
   - Behavioral analysis and anomaly detection

3. **Fantasma Firewall**: Autonomous security system
   - Background scanning and threat detection
   - Automated security responses
   - Log management and purging
   - Real-time traffic analysis

### Database Schema
- **Users**: Authentication, profiles, and permissions
- **Chat Messages**: Conversation history with AI cores
- **Oracle Queries**: Database operation history and results
- **System Status**: Real-time system health monitoring
- **Tasks & Notes**: Personal productivity features
- **Configuration**: User preferences and system settings

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