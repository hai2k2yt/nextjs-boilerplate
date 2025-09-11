import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase'
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  fileUploadSchema,
  fileIdSchema,
  fileListSchema,
} from '@/lib/validations/file'

export const filesRouter = createTRPCRouter({
  // Category management
  createCategory: protectedProcedure
    .input(createCategorySchema)
    .mutation(async ({ ctx, input }) => {
      // Check if category name already exists for this user
      const existingCategory = await ctx.db.category.findFirst({
        where: {
          name: input.name,
          ownerId: ctx.session.user.id,
        },
      })

      if (existingCategory) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Category with this name already exists',
        })
      }

      const category = await ctx.db.category.create({
        data: {
          ...input,
          ownerId: ctx.session.user.id,
        },
      })

      return category
    }),

  getCategories: protectedProcedure
    .query(async ({ ctx }) => {
      const categories = await ctx.db.category.findMany({
        where: {
          ownerId: ctx.session.user.id,
        },
        include: {
          _count: {
            select: {
              files: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      })

      return categories
    }),

  updateCategory: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      data: updateCategorySchema,
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const category = await ctx.db.category.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.session.user.id,
        },
      })

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        })
      }

      // Check for name conflicts if name is being updated
      if (input.data.name && input.data.name !== category.name) {
        const existingCategory = await ctx.db.category.findFirst({
          where: {
            name: input.data.name,
            ownerId: ctx.session.user.id,
            id: { not: input.id },
          },
        })

        if (existingCategory) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Category with this name already exists',
          })
        }
      }

      const updatedCategory = await ctx.db.category.update({
        where: { id: input.id },
        data: input.data,
      })

      return updatedCategory
    }),

  deleteCategory: protectedProcedure
    .input(categoryIdSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const category = await ctx.db.category.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.session.user.id,
        },
      })

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        })
      }

      // Delete category (cascade will handle file associations)
      await ctx.db.category.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // File management
  uploadFile: protectedProcedure
    .input(fileUploadSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify categories belong to user
      if (input.categoryIds && input.categoryIds.length > 0) {
        const userCategories = await ctx.db.category.findMany({
          where: {
            id: { in: input.categoryIds },
            ownerId: ctx.session.user.id,
          },
        })

        if (userCategories.length !== input.categoryIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'One or more categories do not exist or do not belong to you',
          })
        }
      }

      // Create file record
      const file = await ctx.db.file.create({
        data: {
          filename: input.filename,
          originalName: input.originalName,
          mimeType: input.mimeType,
          size: input.size,
          storageKey: input.storageKey,
          description: input.description,
          isPublic: input.isPublic,
          ownerId: ctx.session.user.id,
        },
      })

      // Create category associations
      if (input.categoryIds && input.categoryIds.length > 0) {
        await ctx.db.fileCategory.createMany({
          data: input.categoryIds.map((categoryId) => ({
            fileId: file.id,
            categoryId,
          })),
        })
      }

      // Return file with categories
      const fileWithCategories = await ctx.db.file.findUnique({
        where: { id: file.id },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      })

      return fileWithCategories
    }),

  getFiles: protectedProcedure
    .input(fileListSchema)
    .query(async ({ ctx, input }) => {
      const { limit, cursor, categoryId, mimeType, search } = input

      const files = await ctx.db.file.findMany({
        where: {
          ownerId: ctx.session.user.id,
          ...(categoryId && {
            categories: {
              some: {
                categoryId,
              },
            },
          }),
          ...(mimeType && {
            mimeType: {
              startsWith: mimeType
            }
          }),
          ...(search && {
            OR: [
              { filename: { contains: search, mode: 'insensitive' } },
              { originalName: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
      })

      let nextCursor: string | undefined = undefined
      if (files.length > limit) {
        const nextItem = files.pop()
        nextCursor = nextItem!.id
      }

      return {
        files,
        nextCursor,
      }
    }),

  getFile: protectedProcedure
    .input(fileIdSchema)
    .query(async ({ ctx, input }) => {
      const file = await ctx.db.file.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.session.user.id,
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      })

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found',
        })
      }

      return file
    }),

  deleteFile: protectedProcedure
    .input(fileIdSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const file = await ctx.db.file.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.session.user.id,
        },
      })

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found',
        })
      }

      // Delete from Supabase storage
      const { error: storageError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([file.storageKey])

      if (storageError) {
        console.error('Failed to delete file from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database (cascade will handle category associations)
      await ctx.db.file.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Generate signed URL for file access
  getSignedUrl: protectedProcedure
    .input(z.object({
      fileId: z.string().cuid(),
      expiresIn: z.number().min(60).max(86400).default(3600),
    }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const file = await ctx.db.file.findFirst({
        where: {
          id: input.fileId,
          ownerId: ctx.session.user.id,
        },
      })

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found',
        })
      }

      // Generate signed URL
      const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(file.storageKey, input.expiresIn)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate signed URL',
        })
      }

      return {
        signedUrl: data.signedUrl,
        expiresAt: new Date(Date.now() + input.expiresIn * 1000),
      }
    }),
})
