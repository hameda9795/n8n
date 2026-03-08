# n8n Multi-Tenant Platform

A Next.js 14 application that acts as a management layer for multiple n8n instances via a backend manager API.

## Backend Infrastructure

This frontend connects to an existing n8n management backend:

- **Manager API**: `https://manager.maxhmd.dev`
- **User Access**: `https://{username}.n8n.maxhmd.dev` (subdomains handled by Traefik)
- **Authentication**: API Key via Authorization header

## Tech Stack

- **Next.js 14+** (App Router)
- **TypeScript**
- **NextAuth.js v5 (Auth.js)** for authentication
- **Vercel Postgres** for database
- **Prisma ORM**
- **Tailwind CSS + Shadcn/ui** components

## Quick Start

### 1. Clone and Install

```bash
cd n8n-platform
npm install
```

### 2. Set up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Database - Vercel Postgres
POSTGRES_URL="your-vercel-postgres-url"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-random-string-min-32-chars"

# Backend Config
N8N_MANAGER_URL="https://manager.maxhmd.dev"
N8N_MANAGER_SECRET="sk_live_maxhmd_2024_secure_key_abc123xyz"
N8N_BASE_DOMAIN="n8n.maxhmd.dev"
```

### 3. Configure Database

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Seed Initial Admin User

```bash
npm run db:seed
```

Default admin credentials:
- **Email:** admin@example.com
- **Password:** admin123

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## User Flow

### Admin Flow:
1. Log in at `/login` with admin credentials
2. Go to `/admin` dashboard
3. Enter a username (e.g., "alice") and click "Create User"
4. System calls manager API: `POST https://manager.maxhmd.dev/api/create-user`
5. New n8n instance is created at `https://alice.n8n.maxhmd.dev`
6. Admin can click the link to open alice's n8n in a new tab

### User Flow:
1. User receives their n8n URL: `https://{username}.n8n.maxhmd.dev`
2. On first visit, user sees n8n "Setup owner account" page
3. User sets their password and completes setup
4. User can now build workflows!

## Architecture

### Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String   // for admin login only
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Note: n8n instances run in separate Docker containers managed by the backend. No port/url stored in frontend DB.

### API Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Admin     │────▶│  Next.js API     │────▶│  Manager API    │
│  Dashboard  │     │  /api/admin/users│     │  maxhmd.dev     │
└─────────────┘     └──────────────────┘     └─────────────────┘
                           │                          │
                           ▼                          ▼
                    ┌─────────────┐            ┌─────────────┐
                    │  Vercel     │            │   Docker    │
                    │  Postgres   │            │   n8n       │
                    └─────────────┘            └─────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────┐
                                               │  User       │
                                               │  Subdomain  │
                                               └─────────────┘
```

### Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Admin login page |
| `/admin` | Admin only | User management, create users |
| `/dashboard` | Users | Simple dashboard with n8n link |
| `/api/admin/users` | Admin only | Proxies to manager API |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_URL` | Vercel Postgres connection string | Yes |
| `NEXTAUTH_URL` | Your app URL | Yes |
| `NEXTAUTH_SECRET` | Random secret for JWT signing | Yes |
| `N8N_MANAGER_URL` | Backend manager API URL | Yes |
| `N8N_MANAGER_SECRET` | API key for manager authentication | Yes |
| `N8N_BASE_DOMAIN` | Base domain for user subdomains | Yes |

## Important Notes

1. **No Proxy Needed**: Users access n8n directly via subdomain (`https://alice.n8n.maxhmd.dev`), not through the Next.js app
2. **Manager API Secret**: Never expose this to the browser - only used server-side in API routes
3. **User Passwords**: Users set their own n8n password on first visit to their subdomain
4. **Admin vs User**: Only admins can log into this platform. Regular users only access their n8n subdomain directly.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel Dashboard
3. Add Vercel Postgres storage
4. Configure environment variables (see above)
5. Deploy

After deployment, run the seed script:

```bash
# Using Vercel CLI
vercel env pull
npm run db:seed
```

## Development

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Run seed
npm run db:seed
```

## License

MIT
