import { z } from 'zod'
import { FILE_UPLOAD_CONFIG } from '@/lib/supabase'

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Category name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string()
    .max(200, 'Description must be less than 200 characters')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .optional()
})

export const updateCategorySchema = createCategorySchema.partial()

export const categoryIdSchema = z.object({
  id: z.string().cuid('Invalid category ID')
})

// File validation schemas
export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must be less than 255 characters'),
  originalName: z.string()
    .min(1, 'Original filename is required'),
  mimeType: z.string()
    .refine(
      (type) => FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(type),
      'File type is not allowed'
    ),
  size: z.number()
    .positive('File size must be positive')
    .max(FILE_UPLOAD_CONFIG.maxFileSize, `File size must be less than ${FILE_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB`),
  storageKey: z.string()
    .min(1, 'Storage key is required'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isPublic: z.boolean()
    .default(false),
  categoryIds: z.array(z.string().cuid('Invalid category ID'))
    .max(10, 'Maximum 10 categories allowed')
    .optional()
    .default([])
})

export const updateFileSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must be less than 255 characters')
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isPublic: z.boolean()
    .optional(),
  categoryIds: z.array(z.string().cuid('Invalid category ID'))
    .max(10, 'Maximum 10 categories allowed')
    .optional()
})

export const fileIdSchema = z.object({
  id: z.string().cuid('Invalid file ID')
})

// File query schemas
export const fileListSchema = z.object({
  limit: z.number()
    .min(1)
    .max(100)
    .default(20),
  cursor: z.string()
    .cuid('Invalid cursor')
    .optional(),
  categoryId: z.string()
    .cuid('Invalid category ID')
    .optional(),
  mimeType: z.string()
    .optional(),
  search: z.string()
    .max(100, 'Search query must be less than 100 characters')
    .optional()
})

// Client-side file validation (for browser File objects)
export const clientFileSchema = z.object({
  name: z.string().min(1, 'Filename is required'),
  size: z.number()
    .positive('File size must be positive')
    .max(FILE_UPLOAD_CONFIG.maxFileSize, `File size must be less than ${FILE_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB`),
  type: z.string()
    .refine(
      (type) => FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(type),
      'File type is not allowed'
    )
})

// Type exports
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type UpdateFileInput = z.infer<typeof updateFileSchema>
export type FileListInput = z.infer<typeof fileListSchema>
