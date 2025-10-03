# Next.js Boilerplate

A modern Next.js 15 boilerplate with React 19, TypeScript, and essential development tools for building production-ready applications.

## Features

### Core Stack

- **Next.js 15** with App Router and Turbopack
- **React 19** with latest features
- **TypeScript** with strict configuration
- **Tailwind CSS v4** for styling
- **shadcn/ui** components with Radix UI primitives
- **tRPC** for end-to-end type safety
- **Prisma ORM** with PostgreSQL (Supabase)
- **NextAuth.js** for authentication
- **React Hook Form** with Zod validation
- **Framer Motion** for animations

### Real-time Collaboration

- **React Flow** for visual flow diagrams
- **Socket.IO** for WebSocket real-time communication
- **Redis Cloud** for state management and caching
- **Real-time cursor tracking** and participant presence
- **Collaborative editing** with conflict resolution

### Additional Features

- **File Management** with Supabase Storage
- **Calendar System** with FullCalendar
- **Payment Integration** (PayPal, Stripe, MoMo, ZaloPay, VNPay, VietQR)
- **Audit Logging** for tracking system events

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

3. Configure Supabase:

   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > Database and copy your connection string
   - Update `DATABASE_URL` in your `.env` file with the Supabase connection string
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

4. Set up the database:

```bash
npm run db:push
npm run db:seed
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **API**: tRPC
- **Database**: Prisma ORM + PostgreSQL (Supabase)
- **Authentication**: NextAuth.js
- **Forms**: React Hook Form + Zod
- **Real-time**: Socket.IO + Redis Cloud
- **Storage**: Supabase Storage
- **State Management**: Zustand

## 🚀 Deployment

This application is optimized for deployment on **Railway** with external Redis Cloud and Supabase services.

### 📚 Complete Deployment Documentation

**→ Start here: [DEPLOYMENT_INDEX.md](./DEPLOYMENT_INDEX.md)** - Complete guide to all deployment documentation

### Quick Links

- ⚡ **[Quick Start (15 min)](./QUICK_START_DEPLOY.md)** - Deploy now!
- 📋 **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step guide
- 📊 **[Platform Comparison](./CLOUD_PLATFORM_COMPARISON.md)** - Compare hosting options
- 🔧 **[Troubleshooting](./TROUBLESHOOTING.md)** - Fix common issues
- 📝 **[Summary](./DEPLOYMENT_SUMMARY.md)** - TL;DR overview

### Quick Deploy to Railway

1. **Prerequisites:**

   - Redis Cloud instance (already configured ✅)
   - Supabase project (already configured ✅)
   - Railway account (free tier available)

2. **Deploy:**

   ```bash
   # 1. Sign up at https://railway.app
   # 2. Connect GitHub repository
   # 3. Add environment variables
   # 4. Deploy automatically!
   ```

3. **Read:** [QUICK_START_DEPLOY.md](./QUICK_START_DEPLOY.md) for detailed steps

**Estimated deployment time: ~15 minutes**

### Why Railway?

✅ Native WebSocket support (perfect for Socket.IO)
✅ No cold starts (persistent connections)
✅ Easy deployment (GitHub integration)
✅ Free tier ($5/month credit)
✅ Works seamlessly with Redis Cloud + Supabase

See [CLOUD_PLATFORM_COMPARISON.md](./CLOUD_PLATFORM_COMPARISON.md) for detailed comparison with other platforms.
