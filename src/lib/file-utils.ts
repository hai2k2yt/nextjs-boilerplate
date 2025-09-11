// Client-safe file utilities (no server-side dependencies)

// File upload configuration (client-safe copy)
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

// Helper function to validate file (client-safe)
export function validateFile(file: File) {
  const errors: string[] = []
  
  // Check file size
  if (file.size > FILE_UPLOAD_CONFIG.maxFileSize) {
    errors.push(`File size must be less than ${FILE_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB`)
  }
  
  // Check MIME type
  if (!FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`)
  }
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!FILE_UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
    errors.push(`File extension ${extension} is not allowed`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Helper function to get file type category (client-safe)
export function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'spreadsheet'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document'
  if (mimeType.startsWith('text/')) return 'text'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive'
  return 'other'
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
