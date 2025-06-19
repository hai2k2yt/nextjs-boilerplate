# Next.js Boilerplate

A modern Next.js 15 boilerplate with React 19, TypeScript, and essential development tools for building production-ready applications.

## Features

- **Next.js 15** with App Router and Turbopack
- **React 19** with latest features
- **TypeScript** with strict configuration
- **Tailwind CSS v4** for styling
- **shadcn/ui** components with Radix UI primitives
- **tRPC** for end-to-end type safety
- **Prisma ORM** with SQLite database
- **NextAuth.js** for authentication
- **React Hook Form** with Zod validation
- **Framer Motion** for animations

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Set up the database:
```bash
npm run db:push
npm run db:seed
```

4. Start the development server:
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
- **Database**: Prisma ORM
- **Authentication**: NextAuth.js
- **Forms**: React Hook Form + Zod
