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

**✅ ALL MODULE FUNCTIONALITY IMPLEMENTED**
- ✅ Chat Module: Full Zed AI assistant with session-based authentication and message logging
- ✅ Status Module: Real-time system health monitoring with component status display  
- ✅ Admin Module: Password change functionality with proper validation and security
- ✅ Music Module: Audio control interface with volume, input/output, and processing status
- ✅ Oracle Module: Database status monitoring with connection, tables, and data overview
- ✅ Config Module: System settings display with environment, port, and AI configuration
- ✅ All modules properly clickable with dedicated content areas and "Back to Dashboard" functionality
- ✅ Enhanced UI with status badges, grid layouts, and consistent black-on-black theme

**✅ APPROVED DESIGN THEME LOCKED IN**
- ✅ User-provided reference images establish the exact styling requirements
- ✅ Pure black backgrounds with dark gray containers and rounded corners
- ✅ Purple/magenta Zebulon branding accents as shown in reference
- ✅ Clean minimalist interface with proper spacing and transparent logo
- ✅ No deviations from this approved design theme allowed

**✅ REDUNDANCY REMOVAL AND MAIN INTERFACE CONSOLIDATION (2025-07-25)**
- ✅ Completely removed redundant embedded HTML interface from server/index.ts
- ✅ Eliminated all duplicate asset files and old JavaScript bundles
- ✅ Cleaned up server code to serve only the built React application
- ✅ Removed unnecessary files: server-only-mode.md, server-unified.ts, start-server-only.ts, test files
- ✅ Consolidated all functionality into single unified React interface on port 5000
- ✅ Streamlined server to essential API endpoints only (auth, chat, system status)
- ✅ Fixed ES module issues and proper file serving for production-ready deployment
- ✅ Single clean codebase with no redundancies - only main interface functions remain
- ✅ Pure black-on-black theme consistently applied across all components

**✅ COMPLETE AI ASSISTANT REMOVAL - PURE INTEGRATION PLATFORM (2025-07-25)**
- ✅ Removed all internal AI chat functionality, endpoints, and assistant logic
- ✅ Deleted chat message database schema and storage functions
- ✅ Eliminated AI response generators and chat-related API endpoints
- ✅ Removed chat interface components and messaging functionality
- ✅ Transformed Zebulon into pure integration platform for external apps
- ✅ ZED module now follows integration logic like other external modules
- ✅ Only external apps connected through modules should have AI agents
- ✅ System focuses solely on connecting users to featured apps with their own AI

**✅ FINAL SYSTEM READINESS VERIFICATION (2025-07-25)**
- ✅ Verified all 8 checklist items from user requirements document
- ✅ Fixed TypeScript compilation with @types/bcrypt dependency
- ✅ Successful production build: 840KB optimized dist/ folder
- ✅ Database cleaned of unused chat_messages table and relations
- ✅ All 6 modules operational: ZED, ZYNC, ZETA, ZWAP!, ZULU, CONFIG
- ✅ Storage optimization: removed .map files, test files, cache data
- ✅ Security verified: admin controls, environment variables, session management
- ✅ System ready for export and deployment on any Node.js environment
- ✅ Created comprehensive verification document: SYSTEM_READINESS_VERIFICATION.md

**✅ PROJECT CLEANUP AND ESSENTIAL FILES ORGANIZATION (2025-07-25)**
- ✅ Removed all unnecessary, broken, empty, and redundant files
- ✅ Eliminated backup files, test files, and unused documentation
- ✅ Cleaned up attached assets and old logo references
- ✅ Organized essential files into proper project structure
- ✅ Updated README.md with Oracle-focused documentation
- ✅ Maintained only core functionality files for main interface
- ✅ Verified all essential files are present: package.json, tsconfig, prisma schema
- ✅ Clean project structure with no redundancies or broken references

**✅ ZEBULON LOGO AND MODULE REBRANDING (2025-07-25)**
- ✅ Replaced placeholder "Z" with actual Zebulon logo throughout interface
- ✅ Updated both login screen and main dashboard with proper logo asset
- ✅ Rebranded main interface modules: ZED (Chat), ZYNC (IDE), ZETA (Security Panel)
- ✅ Updated all module titles, descriptions, and navigation elements
- ✅ Maintained consistent purple-to-blue gradient Zebulon branding
- ✅ Changed chat interface from Oracle database queries to ZED AI assistant
- ✅ Updated system status to reflect new module structure and naming

**✅ DEPLOYMENT PREPARATION FOR XOCLON.ONLINE (2025-07-25)**
- ✅ Created comprehensive deployment guide (DEPLOYMENT.md) for user's domain
- ✅ Generated Docker configuration for containerized deployment
- ✅ Created production deployment script (deploy.sh) with automated setup
- ✅ Generated Nginx configuration for xoclon.online with SSL and security headers
- ✅ Created PM2 configuration for production process management
- ✅ Provided environment template (.env.example) for production setup
- ✅ Verified domain xoclon.online is active and ready for deployment
- ✅ System is completely portable and ready for custom domain hosting

**✅ MODULE RESTRUCTURING AND ZWAP! INTEGRATION (2025-07-25)**
- ✅ Replaced Music module with ZWAP! financial utility app featuring account overview and financial tools
- ✅ Moved Oracle Database core functionality to "Zebulon Core" header button for direct access
- ✅ Transformed previous Oracle widget to ZULU system repairs and maintenance module
- ✅ Maintained Config/Settings module as final widget block unchanged
- ✅ Updated all module icons, titles, descriptions, and content areas appropriately
- ✅ Added comprehensive financial tracking interface for ZWAP! (balance, budget, savings, investments)
- ✅ Implemented ZULU system diagnostics with CPU health, memory status, repair tools, and auto cleanup
- ✅ Enhanced user experience with clickable header button for immediate Oracle database access

**✅ ZEBULON ORACLE DATABASE IMPLEMENTATION (2025-07-25)**
- ✅ Implemented complete Oracle Database system based on user-provided specifications
- ✅ Added OracleMemory model to Prisma schema with all required fields (label, content, type, status)
- ✅ Created comprehensive API endpoints for Oracle memory management (/api/oracle/*)
- ✅ Built full-featured Oracle Database interface component with tabs and search functionality
- ✅ Added memory storage, recall, lock/unlock, export (JSON/TXT), and analytics features
- ✅ Integrated Oracle Database as full-screen overlay accessible via "Zebulon Core" button
- ✅ Implemented admin-only access controls and proper authentication for Oracle functions
- ✅ Memory types supported: workflow, response, repair, security, data-tag, custom
- ✅ Export formats: JSON and TXT with proper file download functionality
- ✅ Search and filtering by label, description, status, and memory type

**✅ SINGLE-SERVER ORACLE-ONLY DEPLOYMENT (2025-07-25)**
- ✅ Permanently eliminated dual-server setup as requested by user
- ✅ Disabled Vite development server to run only Oracle system on port 5000
- ✅ Confirmed single-process deployment with unified frontend and backend
- ✅ Oracle Database interface accessible at main route with "Zebulon Core" button
- ✅ Clean startup with no competing server processes or port conflicts
- ✅ System now runs exclusively as Oracle Database management interface
- ✅ All authentication, memory management, and API endpoints functioning properly

**✅ FINAL EXPORT OPTIMIZATION (2025-07-25)**
- ✅ Cleaned up all unused, orphaned, and backup files throughout project
- ✅ Fixed TypeScript compilation errors and updated build configuration
- ✅ Updated tsconfig.server.json to include Oracle-related files properly
- ✅ Removed debug console.log statements and replaced with comments
- ✅ Successfully built both server and client with no compilation errors
- ✅ Verified all six UI modules (ZED, ZYNC, ZETA, ZWAP!, ZULU, CONFIG) are functional
- ✅ Confirmed Oracle Database interface accessible via "Zebulon Core" button
- ✅ Database schema optimized for Oracle Memory system with proper types
- ✅ Admin-only functionality properly implemented for Oracle operations
- ✅ Project ready for export with clean, optimized codebase

**✅ MODULE INTEGRATION LOGIC IMPLEMENTATION (2025-07-25)**
- ✅ Added ModuleIntegration database table to store app connections per module
- ✅ Created comprehensive API endpoints for module integration management (GET, POST, PUT, DELETE)
- ✅ Built ModuleSettings component for configuring module connections (URL, Script, Embed)
- ✅ Built ModuleIntegration component for displaying connected apps in full-screen mode
- ✅ Implemented logic: connected modules open apps, unconnected modules open settings
- ✅ Added support for three integration types: URL/Website, Custom Script, Embed Code
- ✅ CONFIG module always opens internal system settings directly
- ✅ ZED module follows integration logic like other external modules
- ✅ All other modules (ZYNC, ZETA, ZWAP!, ZULU) follow integration logic
- ✅ Persistent storage of module connections in PostgreSQL database
- ✅ User can connect external apps, paste URLs, scripts, or embed codes per module
- ✅ Clean disconnect functionality to remove integrations when needed

**✅ GEDCOM GENEALOGY FUNCTIONALITY IMPLEMENTATION (2025-07-26)**
- ✅ Added GEDCOM (.ged) file upload functionality with parse-gedcom library integration
- ✅ Created FamilyTree database model with user relations and JSON data storage
- ✅ Built comprehensive upload endpoint with secure file handling and validation
- ✅ Implemented Legacy Archive module replacing ZULU with genealogy interface
- ✅ Added family tree browsing, individual viewing, and data export features
- ✅ Full error handling for corrupted files and parsing failures
- ✅ Secure file upload with size limits and type validation
- ✅ Export functionality for JSON and TXT formats with proper file downloads
- ✅ User-specific genealogy data isolation and management

**✅ DUAL DATABASE SYSTEM WITH OFFLINE CAPABILITIES (2025-07-26)**
- ✅ Implemented complete dual database architecture with automatic failover
- ✅ Primary connection: Neon cloud database for online operation
- ✅ Fallback connection: Local PostgreSQL configured via DATABASE_URL_LOCAL secret
- ✅ FULLY FUNCTIONAL: Both databases tested and failover logic operational
- ✅ Automatic connection testing and intelligent switching logic
- ✅ Created comprehensive database backup file (zebulon_oracle_backup.sql)
- ✅ Database migration guide with 7-step offline setup process
- ✅ Health monitoring endpoint shows active database connection status
- ✅ Seamless operation switching without data loss or service interruption
- ✅ Complete offline functionality ready for deployment on isolated systems
- ✅ DATABASE_URL_LOCAL secret configured and tested

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