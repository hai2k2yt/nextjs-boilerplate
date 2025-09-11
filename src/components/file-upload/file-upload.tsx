'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { z } from 'zod'
import { Upload, X, File, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { validateFile, getFileTypeCategory } from '@/lib/file-utils'
import { trpc } from '@/lib/trpc'
import { Form, InputField, TextareaField, CheckboxField, CategoryField } from '@/components/forms'

const uploadFormSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean(),
  categoryIds: z.array(z.string()),
})

type UploadFormData = z.infer<typeof uploadFormSchema>

interface FileUploadProps {
  onUploadSuccess?: (file: any) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  className?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  id: string
}

export function FileUpload({ 
  onUploadSuccess, 
  onUploadError, 
  maxFiles = 10,
  className = '' 
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Remove the local form since we'll use the Form component

  const uploadFileMutation = trpc.files.uploadFile.useMutation({
    onSuccess: (data) => {
      onUploadSuccess?.(data)
      setShowForm(false)
      setSelectedFile(null)
    },
    onError: (error) => {
      onUploadError?.(error.message)
    },
  })

  const uploadFileDirectly = useCallback(async (file: File) => {
    const fileId = Math.random().toString(36).substring(7)
    
    setUploadingFiles(prev => [...prev, {
      file,
      progress: 0,
      status: 'uploading',
      id: fileId,
    }])

    try {
      // Upload to storage first
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const uploadResult = await response.json()

      // Update progress
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 50 } : f
      ))

      // Save to database
      const fileData = await uploadFileMutation.mutateAsync({
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        storageKey: uploadResult.file.storageKey,
        description: '',
        isPublic: false,
        categoryIds: [],
      })

      // Mark as complete
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 100, status: 'success' } : f
      ))

      onUploadSuccess?.(fileData)

      // Remove from list after 3 seconds
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
      }, 3000)

    } catch (error) {
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : f
      ))
    }
  }, [uploadFileMutation, onUploadSuccess])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    // For single file upload, show form
    if (acceptedFiles.length === 1) {
      const file = acceptedFiles[0]
      const validation = validateFile(file)

      if (!validation.isValid) {
        onUploadError?.(validation.errors.join(', '))
        return
      }

      setSelectedFile(file)
      setShowForm(true)
      return
    }

    // For multiple files, upload directly without form
    acceptedFiles.forEach((file) => {
      const validation = validateFile(file)
      if (!validation.isValid) {
        onUploadError?.(validation.errors.join(', '))
        return
      }

      uploadFileDirectly(file)
    })
  }, [onUploadError, uploadFileDirectly])

  const handleFormSubmit = async (data: UploadFormData) => {
    if (!selectedFile) return

    try {
      // Upload to storage first
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const uploadResult = await response.json()

      // Save to database with form data
      await uploadFileMutation.mutateAsync({
        filename: data.filename,
        originalName: selectedFile.name,
        mimeType: selectedFile.type,
        size: selectedFile.size,
        storageKey: uploadResult.file.storageKey,
        description: data.description,
        isPublic: data.isPublic,
        categoryIds: data.categoryIds,
      })

    } catch (error) {
      console.error('Upload error:', error)
      onUploadError?.('Upload failed. Please try again.')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    disabled: uploadFileMutation.isPending,
  })

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id))
  }

  if (showForm && selectedFile) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <File className="h-5 w-5" />
          <span className="font-medium">{selectedFile.name}</span>
          <Badge variant="secondary">
            {getFileTypeCategory(selectedFile.type)}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowForm(false)
              setSelectedFile(null)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Form
          schema={uploadFormSchema}
          onSubmit={handleFormSubmit}
          defaultValues={{
            filename: selectedFile.name,
            description: '',
            isPublic: false,
            categoryIds: [],
          }}
        >
          <InputField
            name="filename"
            label="File Name"
            placeholder="Enter file name"
            required
          />

          <TextareaField
            name="description"
            label="Description"
            placeholder="Enter file description"
            rows={3}
          />

          <CategoryField
            name="categoryIds"
            label="Categories"
            description="Select categories to organize your file"
          />

          <CheckboxField
            name="isPublic"
            label="Make file public"
          />

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={uploadFileMutation.isPending}
              className="flex-1"
            >
              {uploadFileMutation.isPending ? 'Uploading...' : 'Upload File'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setSelectedFile(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${uploadFileMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop files here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              Maximum {maxFiles} files, up to 50MB each
            </p>
          </div>
        )}
      </div>

      {/* Uploading files progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile) => (
            <div key={uploadingFile.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {uploadingFile.file.name}
                  </span>
                  {uploadingFile.status === 'success' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {uploadingFile.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUploadingFile(uploadingFile.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {uploadingFile.status === 'uploading' && (
                <Progress value={uploadingFile.progress} className="h-2" />
              )}
              
              {uploadingFile.status === 'error' && uploadingFile.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadingFile.error}</AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
