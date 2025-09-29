import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, generateStoragePath, validateFile, STORAGE_BUCKET } from '@/lib/supabase'
import { clientFileSchema } from '@/lib/validations/file'
import {
  createAuthenticatedHandler,
  createSuccessResponse,
  createErrorResponse,
  AuthenticatedRequest
} from '@/lib/middleware/auth'

const handleFileUpload = async (request: AuthenticatedRequest): Promise<NextResponse> => {
  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return createErrorResponse('No file provided', 400)
    }

    // Validate file on server side
    const validation = validateFile(file)
    if (!validation.isValid) {
      return createErrorResponse('File validation failed', 400, validation.errors)
    }

    // Additional validation with Zod
    const fileValidation = clientFileSchema.safeParse({
      name: file.name,
      size: file.size,
      type: file.type,
    })

    if (!fileValidation.success) {
      return createErrorResponse('File validation failed', 400, fileValidation.error.errors)
    }

    // Generate storage path
    const storageKey = generateStoragePath(request.user.id, file.name)

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Normalize MIME type for markdown files
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const normalizedMimeType = extension === '.md' && (!file.type || file.type === '' || file.type === 'text/plain' || file.type === 'application/octet-stream')
      ? 'text/markdown'
      : file.type

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storageKey, buffer, {
        contentType: normalizedMimeType,
        duplex: 'half',
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return createErrorResponse('Failed to upload file to storage', 500)
    }

    // Get public URL (for public files) or prepare for signed URL generation
    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storageKey)

    // Return upload success with file metadata
    return createSuccessResponse({
      file: {
        storageKey: uploadData.path,
        publicUrl: urlData.publicUrl,
        filename: file.name,
        originalName: file.name,
        mimeType: normalizedMimeType,
        size: file.size,
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export const POST = createAuthenticatedHandler(handleFileUpload)

// Handle preflight requests for CORS
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
