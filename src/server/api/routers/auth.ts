import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'
import { hashPassword, validatePassword } from '@/lib/auth'

export const authRouter = createTRPCRouter({
  // Register a new user
  register: publicProcedure
    .input(z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    }))
    .mutation(async ({ ctx, input }) => {
      const { name, email, password } = input

      // Validate password strength
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordValidation.errors.join(', ')
        })
      }

      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An account with this email already exists. Please use a different email or try logging in.'
        })
      }

      // Hash password
      const hashedPassword = await hashPassword(password)

      // Create user
      const user = await ctx.db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'USER'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      })

      return {
        success: true,
        user
      }
    }),

  // Get current user profile
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              posts: true
            }
          }
        }
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      return user
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2, 'Name must be at least 2 characters').optional(),
      email: z.string().email('Invalid email address').optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { name, email } = input

      // If email is being updated, check if it's already taken
      if (email) {
        const existingUser = await ctx.db.user.findUnique({
          where: { 
            email,
            NOT: { id: ctx.session.user.id }
          }
        })

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email is already taken'
          })
        }
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...(name && { name }),
          ...(email && { email, emailVerified: null }) // Reset email verification if email changes
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          updatedAt: true
        }
      })

      return updatedUser
    }),

  // Change password
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    }))
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword } = input

      // Get user with password
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { password: true }
      })

      if (!user?.password) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User does not have a password set'
        })
      }

      // Verify current password
      const { verifyPassword } = await import('@/lib/auth')
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password)

      if (!isCurrentPasswordValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect'
        })
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordValidation.errors.join(', ')
        })
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword)

      // Update password
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashedNewPassword }
      })

      return { success: true }
    }),

  // Get all users (admin only)
  getAllUsers: protectedProcedure
    .query(async ({ ctx }) => {
      // Check if user is admin
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true }
      })

      if (currentUser?.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required'
        })
      }

      const users = await ctx.db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          createdAt: true,
          emailVerified: true,
          _count: {
            select: {
              posts: true,
              accounts: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return users
    }),
})
