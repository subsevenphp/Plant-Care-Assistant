# Plant Care Assistant - Server

Backend API server for the Plant Care Assistant application built with Express.js, TypeScript, and Prisma.

## Environment Setup

### 1. Environment Variables

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

### Required Environment Variables

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/plant_care_db"

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters"
JWT_EXPIRES_IN="7d"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### 2. Database Setup

Make sure you have PostgreSQL running and create a database:

```sql
CREATE DATABASE plant_care_db;
```

### 3. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

Or from the server directory:

```bash
cd apps/server
pnpm install
```

### 4. Database Migration

Generate Prisma client and run migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

## Development

### Start Development Server

```bash
pnpm dev
```

The server will start on the configured port (default: 3000) with hot-reload enabled.

### Available Scripts

- `pnpm dev` - Start development server with hot-reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm lint` - Lint TypeScript code
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio

## API Endpoints

### Health Check

- `GET /health` - Server and database health status

### Status

- `GET /api/v1/status` - API status information

## Configuration

The server uses a robust environment configuration system with validation:

- **Environment Variables**: Validated using Zod schema
- **Database**: Prisma client with connection pooling
- **Security**: Helmet, CORS, rate limiting
- **Error Handling**: Comprehensive error handling with proper logging

## Project Structure

```
src/
├── config/
│   ├── database.ts     # Prisma client and database utilities
│   └── env.ts          # Environment configuration and validation
├── controllers/        # Route controllers
├── middleware/         # Express middleware
├── routes/            # API routes
├── types/             # TypeScript type definitions
└── index.ts           # Application entry point
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set strong JWT secret
4. Configure CORS origins for your domain
5. Set up proper logging
6. Use process manager (PM2, Docker, etc.)

## Security Features

- Rate limiting on all endpoints
- Helmet for security headers
- CORS configuration
- JWT authentication
- Input validation
- SQL injection protection via Prisma
- Environment variable validation