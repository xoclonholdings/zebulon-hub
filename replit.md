# Zebulon Oracle AI System

## Overview

Zebulon is a next-generation personal AI ecosystem designed as a modular, full-stack application featuring multiple AI cores with specialized functions. The system serves as a unified platform for Oracle database management, security monitoring, and AI-powered assistance through a sophisticated web interface.

**Recent Update (July 22, 2025):** Comprehensive mobile-first responsive design implementation:
- Complete mobile-first UI restructuring with header, navigation, and content areas
- Touch-optimized navigation with 44px minimum touch targets
- Mobile viewport handling with safe area support for notched devices
- Responsive typography and spacing optimized for mobile screens
- Bottom tab navigation for easy thumb access on mobile devices
- Optimized chat interface and command center for mobile interaction
- Dynamic viewport height support for mobile browsers
- Touch manipulation optimization for all interactive elements

**Previous Update:** Implemented comprehensive security manager:
- Secure password hashing with bcrypt, account lockout protection
- Input sanitization, XSS prevention, SQL injection protection
- Rate limiting, security headers, encrypted data storage
- Complete admin control system with user management

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom Zebulon theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live updates

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (via Neon Database serverless)
- **Real-time**: WebSocket server for bidirectional communication
- **API Integration**: OpenAI GPT-4o for AI processing

### Build System
- **Bundler**: Vite for frontend development and building
- **Build Target**: ESBuild for production server bundling
- **Development**: Hot module replacement with Vite middleware
- **Production**: Static file serving with Express

## Key Components

### Admin Control System (NEW)
- **Complete User Management**: Create, suspend, delete users with granular permission controls
- **NO Autonomous Operations**: All system operations require explicit admin or user approval
- **Admin Login Interface**: Secure access through logo click with default credentials (admin/zebulon2025)
- **Emergency Controls**: Immediate system shutdown and maximum security activation
- **Permission Management**: Granular control over file access, Oracle operations, voice commands, system updates
- **User Access Limitations**: Per-user file size limits, storage quotas, feature access controls
- **Audit Logging**: Complete activity tracking for all admin actions and user operations
- **System Settings**: Global controls for autonomous operations, self-updates, security levels

### AI Cores
1. **Zed Core (cZED)**: Primary conversational AI assistant with strict authorization system
   - Handles user interactions, task management, and productivity guidance
   - Processes natural language queries for Oracle database operations
   - **CRITICAL**: All operations require explicit permission - NO autonomous actions
   - Complete Oracle administration capabilities with secure query execution
   - Real-time database connection management and monitoring
   - Fully configurable permission system with mandatory user authorization workflow
   - All authorization requests require admin or user approval
   - No auto-approval - all operations gated by permission system
   - Provides contextual responses and recommendations only when authorized

2. **Zeta Core (cZETA)**: Security-focused AI sentinel with real-time monitoring
   - Advanced Oracle query security analysis and threat detection
   - Real-time SQL injection prevention and risk assessment
   - Database access auditing with automatic blocking of dangerous operations
   - **CRITICAL**: All security operations require admin approval
   - Memory protection and pattern auditing
   - Behavioral cloaking and metadata vaulting
   - Configurable security monitoring levels with admin-only access
   - Real-time threat detection with admin-controlled alerts
   - Security monitoring and threat detection with permission gates

3. **Fantasma Firewall**: Native security subsystem with advanced protection
   - Background scanning and anomaly detection
   - Configurable scan intervals and deep scan options
   - Stealth mode with behavior cloaking and traffic obfuscation
   - Automated log purging ("Fanflux")
   - System-triggered security events (airplane mode, dark mode, device events)

### Database Schema
- **Users**: Authentication and user profiles with codenames and roles
- **Chat Messages**: Conversation history with AI cores
- **Oracle Queries**: Natural language to SQL translation history
- **System Status**: Real-time monitoring of all system components
- **User Tasks & Notes**: Personal productivity management
- **Audio Processing**: Voice authentication and command processing
- **NEW**: **Oracle Administration Tables**:
  - **Oracle Connections**: Secure database connection management with encrypted credentials
  - **Oracle Schemas**: Schema discovery and metadata with privilege tracking
  - **Oracle Objects**: Database object catalog (tables, views, procedures, functions)
  - **Oracle Query History**: Complete query execution history with performance metrics
  - **Oracle Security Audits**: Zeta Core security analysis and threat detection logs
  - **Oracle Performance Metrics**: Real-time database performance monitoring

### UI Components
- **Dashboard Grid**: Brady Bunch-style widget layout
- **Command Chat**: Central communication interface with Zebulon™️
- **Status Widgets**: Real-time monitoring of Oracle, security, and system health
- **Profile Management**: User authentication and preferences
- **Voice Interface**: Audio recording and processing capabilities

## Data Flow

1. **User Input**: Voice or text commands through the dashboard interface
2. **WebSocket Communication**: Real-time bidirectional data exchange
3. **AI Processing**: Route to appropriate AI core (Zed/Zeta) via OpenAI API
4. **Database Operations**: Drizzle ORM handles all database interactions
5. **Oracle Integration**: Natural language to SQL conversion and execution
6. **Response Generation**: AI-generated responses with context awareness
7. **Real-time Updates**: WebSocket broadcasts for live status updates

## External Dependencies

### Core Services
- **OpenAI API**: GPT-4o model for AI processing
- **Neon Database**: Serverless PostgreSQL hosting
- **Voice APIs**: Browser MediaRecorder for audio capture

### Development Dependencies
- **Shadcn/ui**: Component library with Radix UI primitives
- **TanStack Query**: Server state management
- **Drizzle Kit**: Database migration and schema management
- **PostCSS & Autoprefixer**: CSS processing

### Security & Monitoring
- **Connect-pg-simple**: PostgreSQL session storage
- **WebSocket Security**: Real-time monitoring and alerts
- **Fantasma Firewall**: Custom security event handling

## Deployment Strategy

### Development Environment
- **Replit Integration**: Optimized for Replit development environment
- **Hot Reload**: Vite middleware with Express for seamless development
- **TypeScript Compilation**: Real-time type checking and compilation
- **WebSocket Development**: Live connection testing and debugging

### Production Build
- **Frontend**: Vite builds to static assets in `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations handle schema deployment
- **Environment Variables**: Database URL and API keys via environment

### Architecture Decisions

**Problem**: Need for real-time communication between multiple AI cores and frontend
**Solution**: WebSocket implementation with message routing by AI core type
**Rationale**: Enables live status updates, voice processing, and seamless AI interactions

**Problem**: Complex database operations with type safety
**Solution**: Drizzle ORM with Zod schema validation
**Rationale**: Provides type-safe database operations while maintaining flexibility for Oracle integration

**Problem**: Modular AI system with different specialized functions
**Solution**: Multi-core architecture with OpenAI API routing
**Rationale**: Allows specialized AI personalities (Zed, Zeta) while maintaining unified processing backend

**Problem**: Voice authentication and command processing
**Solution**: Browser MediaRecorder API with WebSocket streaming
**Rationale**: Enables real-time voice processing without requiring native mobile apps