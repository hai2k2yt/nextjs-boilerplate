import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import DiscordProvider from 'next-auth/providers/discord'
import GoogleProvider from 'next-auth/providers/google'

import { env } from '@/env'
import { db } from '@/server/db'
import { verifyPassword } from '@/lib/auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }

  interface User {
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
  }
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/auth',
    error: '/auth', // Error code passed in query string as ?error=
  },
  callbacks: {
    redirect: async ({ url, baseUrl }) => {
      // If the URL is relative, make it absolute
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // If the URL is on the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url
      }
      // Otherwise, redirect to dashboard
      return `${baseUrl}/dashboard`
    },
    session: ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role
      } else if (token.sub) {
        // Fetch user data from database to get latest role
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true }
        })
        if (dbUser) {
          token.role = dbUser.role
        }
      }
      return token
    },
    signIn: async ({ user, account }) => {
      if (account?.provider === 'credentials') {
        return true
      }

      // For OAuth providers, create or update user in database
      if (account && user.email) {
        try {
          const existingUser = await db.user.findUnique({
            where: { email: user.email }
          })

          if (!existingUser) {
            // Create new user
            const newUser = await db.user.create({
              data: {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                role: 'USER',
              }
            })
            user.role = newUser.role
          } else {
            // Update existing user
            await db.user.update({
              where: { email: user.email },
              data: {
                name: user.name,
                image: user.image,
              }
            })
            user.id = existingUser.id
            user.role = existingUser.role
          }
        } catch (error) {
          console.error('Error handling OAuth sign in:', error)
          return false
        }
      }

      return true
    },
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    }),
    ...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET ? [
      DiscordProvider({
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
      })
    ] : []),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
  ],
}

export const getServerAuthSession = () => {
  return getServerSession(authOptions)
}
