# Zebulon Oracle System

A comprehensive database query and analysis system focused purely on Oracle database operations. Built with modern technologies for real-time data insights and secure database interactions.

## Core Technologies
- React 19.1.0 with TypeScript
- Express.js server with unified architecture
- PostgreSQL database with Prisma ORM
- Real-time Oracle query processing
- Single-port deployment on port 5000
- Advanced security and authentication system

## Features
- Oracle database query interface
- Real-time system monitoring
- Secure authentication system
- Admin panel with user management
- Pure black-on-black interface design
- Database status and health monitoring

## Project Structure
```
zebulon-oracle-system/
├── client/                     # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── context/           # Authentication context
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility libraries
│   │   └── pages/             # Application pages
│   └── index.html
├── server/                     # Express.js backend
│   ├── public/                # Built frontend assets
│   ├── db.ts                  # Database configuration
│   ├── index.ts               # Main server file
│   └── storage-prisma.ts      # Database operations
├── shared/                     # Shared TypeScript schemas
│   └── schema.ts              # Database and type definitions
├── prisma/                     # Database schema
│   └── schema.prisma
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── vite.config.clean.ts       # Vite build configuration
```

## Quick Start
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Access application at: http://localhost:5000

## Available Scripts
- `npm run dev` - Start development server (unified frontend & backend)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Prisma Studio for database management

## Environment Requirements
- Node.js 24+
- PostgreSQL database
- Environment variables: `DATABASE_URL`
- Client build variable: `VITE_ZAR_APP_URL` (the authenticated ZAR/ZCOS application origin used by the ZILLION gateway)

## Authentication
The system includes built-in authentication with secure session management. Users can create accounts, log in, and manage their profiles through the admin panel.

## Oracle Query Interface
The main interface provides a chat-like experience for database queries with real-time processing and response handling. All queries are logged and can be reviewed through the system interface.
