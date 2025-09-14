import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (with anon key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Global singleton for Supabase admin client
const globalForSupabaseAdmin = globalThis as unknown as {
  supabaseAdmin: any | undefined
}

// Server-side Supabase client (with service role key for admin operations)
// This should only be used on the server side
export const createSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be used on the server side')
  }

  // Return existing instance if available
  if (globalForSupabaseAdmin.supabaseAdmin) {
    return globalForSupabaseAdmin.supabaseAdmin
  }

  // Create new instance
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Store in global for reuse (only in non-production to avoid memory leaks in serverless)
  if (process.env.NODE_ENV !== 'production') {
    globalForSupabaseAdmin.supabaseAdmin = supabaseAdmin
  }

  return supabaseAdmin
}

// Direct singleton instance export (alternative to createSupabaseAdmin function)
export const supabaseAdmin = createSupabaseAdmin()

// Storage bucket name
export const STORAGE_BUCKET = 'files'

// File upload configuration
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    
    // Spreadsheets
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    
    // Text files
    'text/plain',
    'text/markdown',
    'application/json',
    
    // Archives
    'application/zip',
    'application/x-rar-compressed',
  ],
  allowedExtensions: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.pdf', '.doc', '.docx',
    '.xls', '.xlsx', '.csv',
    '.txt', '.md', '.json',
    '.zip', '.rar'
  ]
}

// Helper function to validate file
export function validateFile(file: File) {
  const errors: string[] = []

  // Check file size
  if (file.size > FILE_UPLOAD_CONFIG.maxFileSize) {
    errors.push(`File size must be less than ${FILE_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB`)
  }

  // Check file extension first
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!FILE_UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
    errors.push(`File extension ${extension} is not allowed`)
  }

  // Check MIME type with special handling for markdown files
  const isMarkdownFile = extension === '.md'
  const hasValidMimeType = FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(file.type)
  const isEmptyMimeType = !file.type || file.type === ''

  // Allow markdown files even if browser doesn't set correct MIME type
  // Common MIME types browsers send for .md files: '', 'text/plain', 'application/octet-stream'
  if (!hasValidMimeType && !(isMarkdownFile && (isEmptyMimeType || file.type === 'text/plain' || file.type === 'application/octet-stream'))) {
    errors.push(`File type ${file.type || 'unknown'} is not allowed`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Helper function to generate storage path
export function generateStoragePath(userId: string, filename: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')

  return `${userId}/${timestamp}_${randomString}_${sanitizedName}`
}

// Helper function to get file type category
export function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'spreadsheet'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document'
  if (mimeType.startsWith('text/')) return 'text'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive'
  return 'other'
}
