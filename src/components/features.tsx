'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Zap, 
  Shield, 
  Palette, 
  Database, 
  Smartphone, 
  Code,
  Server,
  Users,
  BarChart3
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Next.js 15 + React 19',
    description: 'Latest versions with App Router, Server Components, and React Compiler optimizations.'
  },
  {
    icon: Palette,
    title: 'Tailwind CSS v4',
    description: 'Beautiful, responsive designs with the latest Tailwind CSS features and utilities.'
  },
  {
    icon: Shield,
    title: 'NextAuth.js',
    description: 'Complete authentication solution with multiple providers and session management.'
  },
  {
    icon: Database,
    title: 'Prisma ORM',
    description: 'Type-safe database queries with automatic migrations and schema management.'
  },
  {
    icon: Server,
    title: 'tRPC',
    description: 'End-to-end typesafe APIs with automatic TypeScript inference and validation.'
  },
  {
    icon: Code,
    title: 'TypeScript',
    description: 'Full TypeScript support with strict type checking and modern ES features.'
  },
  {
    icon: Smartphone,
    title: 'Responsive Design',
    description: 'Mobile-first approach with beautiful UI components from shadcn/ui.'
  },
  {
    icon: BarChart3,
    title: 'TanStack Query',
    description: 'Powerful data fetching with caching, background updates, and more.'
  },
  {
    icon: Users,
    title: 'Developer Experience',
    description: 'Hot reload, TypeScript, ESLint, Prettier, and more tools for productivity.'
  }
]

export function Features() {
  return (
    <section className="py-24 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive boilerplate with modern tools and best practices 
            to accelerate your development process.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
