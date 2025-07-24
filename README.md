# Zebulon AI System

A next-generation personal AI ecosystem with complete offline capabilities, featuring multiple AI cores with specialized functions.

## Features

- **100% Offline Operation**: Works without internet connectivity after initial setup
- **Multiple AI Cores**: Zed (conversational), Zeta (security), Fantasma (firewall)
- **Real-time Communication**: WebSocket-based live updates
- **Voice Interface**: Browser-based voice recognition
- **Mobile-First Design**: Responsive interface optimized for all devices
- **Admin Control Panel**: Comprehensive user and system management
- **Security Monitoring**: Real-time threat detection and analysis

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zebulon-ai-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```env
   NODE_ENV=development
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_random_secret_key
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open: http://localhost:5000
   - Admin login: Click logo → admin/zebulon2025

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm start` - Run production server
- `npm run db:push` - Push database schema changes

### Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Real-time**: WebSocket communication

### Project Structure

```
zebulon-ai-system/
├── client/              # React frontend
│   ├── src/
│   └── index.html
├── server/              # Express backend
│   ├── routes/
│   ├── services/
│   └── index.ts
├── shared/              # Shared types and schemas
└── package.json
```

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables

Required for production:
- `NODE_ENV=production`
- `DATABASE_URL=<postgresql_url>`
- `SESSION_SECRET=<secure_random_string>`
- `PORT=5000` (optional)

## AI Cores

1. **Zed Core**: Primary conversational AI with natural language processing
2. **Zeta Core**: Security-focused AI for threat detection  
3. **Fantasma Firewall**: Autonomous security system with background scanning

## Security Features

- Rate limiting (500 requests per 15 minutes)
- Input sanitization and validation
- Secure session management
- Password hashing with bcrypt
- Real-time vulnerability scanning
- Admin access controls

## License

MIT License - see LICENSE file for details