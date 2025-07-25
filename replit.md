# Zebulon AI System

## Overview

The Zebulon AI System is a next-generation personal AI ecosystem with complete offline capabilities, designed as a modular, full-stack application featuring multiple AI cores with specialized functions. The system serves as a unified platform for AI-powered database operations, security management, and personal assistance.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (2025-07-25)

**✅ SYSTEM SIMPLIFIED: Zebulon & Zed Core Only**
- ✅ Removed all external API endpoints and complex components
- ✅ Simplified to focus exclusively on Zebulon and Zed functionality
- ✅ Created ZebulonSimple.tsx - clean, minimal interface for core features
- ✅ Removed SecurityDashboard, VoiceActivation, Oracle, and other extra components
- ✅ Zero LSP diagnostics - completely clean codebase
- ✅ Streamlined API endpoints to only essential chat and system status
- ✅ Updated architecture documentation to reflect simplified system
- ✅ Maintained PostgreSQL database and React 19.1.0 foundation
- ✅ Clean, focused user experience with Zed AI assistant
- ✅ Local AI processing without external dependencies

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