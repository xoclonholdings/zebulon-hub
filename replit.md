# Zebulon AI System

## Overview

Zebulon is a next-generation personal AI ecosystem that operates completely offline with full AI capabilities, admin controls, and real-time communication. The system features multiple AI cores (Zed, Zeta, Fantasma) with specialized functions, natural language to SQL conversion, and comprehensive security management.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### 2025-07-22 - Application Startup Fixed
- Fixed multiple package dependency version conflicts
- Resolved `tsx` not found error by installing correct versions
- Updated package.json to use stable Tailwind CSS v3 instead of v4
- Successfully initialized:
  - Storage Optimizer with caching and performance monitoring
  - Enhanced Storage search indexes
  - Zebulon Local AI Engine (100% offline intelligence active)
  - Express server on port 5000

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for replit compatibility
- **Styling**: Tailwind CSS with custom mobile-first optimizations
- **UI Components**: Shadcn/ui components with dark theme
- **State Management**: React Query for server state, local state with React hooks
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints with WebSocket support for real-time features
- **Local AI**: Custom AI engine with pattern recognition and natural language processing
- **Security**: Comprehensive middleware stack with rate limiting, input sanitization, and vulnerability scanning

## Key Components

### AI Cores
1. **Zed Core**: Primary conversational AI assistant with Oracle database management
2. **Zeta Core**: Security-focused AI for threat detection and system protection
3. **Fantasma Firewall**: Automated security scanning and anomaly detection

### Database Layer
- **Primary Database**: PostgreSQL via Neon Database service
- **ORM**: Drizzle ORM with schema-first approach
- **Connection Pool**: Managed connection pooling for performance
- **Migration System**: Drizzle Kit for database migrations

### Security System
- **Authentication**: Bcrypt password hashing with account lockout protection
- **Authorization**: Role-based access control with granular permissions
- **Input Sanitization**: Comprehensive XSS and injection prevention
- **Rate Limiting**: Multi-tier rate limiting for different endpoint types
- **Vulnerability Scanner**: Automated security assessment and remediation

### Storage and Caching
- **Enhanced Storage**: Intelligent caching with compression and access pattern analysis
- **Memory Management**: Encrypted memory service for sensitive data
- **Performance Optimization**: Query caching and batch operations

## Data Flow

1. **User Input**: Mobile-optimized interface captures user interactions
2. **Request Processing**: Express middleware handles authentication, sanitization, and rate limiting
3. **AI Processing**: Local AI engine processes requests without external dependencies
4. **Database Operations**: Drizzle ORM manages data persistence with encryption
5. **Real-time Updates**: WebSocket connections provide live updates to connected clients
6. **Response Delivery**: JSON responses with proper error handling and security headers

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL (configurable to other PostgreSQL providers)
- **UI Framework**: React ecosystem (React, React-DOM, React Query)
- **Security**: Bcrypt, Helmet, Express-rate-limit
- **Development**: TypeScript, Vite, Tailwind CSS

### Optional Extensions
- **Browser Extension**: Chrome/Firefox extension for web integration
- **Desktop App**: Electron wrapper for standalone desktop application
- **Mobile Shortcuts**: iOS Shortcuts integration for mobile workflows

## Deployment Strategy

### Production Deployment
- **Platform**: Optimized for Replit deployment with fallback to standard Node.js hosts
- **Build Process**: Vite builds client assets, esbuild bundles server code
- **Environment**: Production environment with secure session management
- **Health Monitoring**: Built-in health check endpoints and system status monitoring

### Development Setup
- **Local Development**: Hot reload with Vite dev server
- **Database**: Local PostgreSQL or cloud-hosted Neon database
- **Environment Variables**: `.env` file for local configuration

### Security Hardening
- **Rate Limiting**: 500 requests per 15 minutes with stricter limits for admin endpoints
- **Session Security**: Secure HTTP-only cookies with CSRF protection
- **Input Validation**: Multi-layer validation with sanitization and type checking
- **Vulnerability Management**: Automated scanning with real-time threat detection

### Offline Capabilities
- **Local AI Engine**: No external API dependencies for core AI functionality
- **Embedded Database**: Can operate with local SQLite for fully offline scenarios
- **Asset Management**: All static assets bundled with the application
- **Service Worker**: Optional PWA features for enhanced offline experience

## Key Features

1. **100% Offline Operation**: Works without internet connectivity after initial setup
2. **Mobile-First Design**: Responsive interface optimized for mobile devices
3. **Real-time Communication**: WebSocket-based live updates and notifications
4. **Voice Interface**: Browser-based voice recognition and processing
5. **Admin Control Panel**: Comprehensive user and system management
6. **Security Monitoring**: Real-time threat detection and vulnerability assessment
7. **Oracle Integration**: Natural language to SQL conversion with database management
8. **Extension Support**: Browser and desktop integration capabilities