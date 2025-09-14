'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Download,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  AlertCircle,
  Loader2,
  FileSpreadsheet
} from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { getFileTypeCategory } from '@/lib/file-utils'
import { ExcelPreview } from './excel-preview'
import { WordPreview } from './word-preview'

interface FilePreviewModalProps {
  file: any
  isOpen: boolean
  onClose: () => void
  onDownload: (file: any) => void
}

export function FilePreviewModal({ file, isOpen, onClose, onDownload }: FilePreviewModalProps) {
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)



  const utils = trpc.useUtils()

  // Image files: JPG, PNG, GIF, WebP, SVG
  const isImageFile = file?.mimeType?.startsWith('image/') ||
                      file?.filename?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)

  // PDF files
  const isPdfFile = file?.mimeType === 'application/pdf' ||
                    file?.filename?.endsWith('.pdf')

  // Word documents: DOC, DOCX
  const isWordFile = file?.mimeType === 'application/msword' ||
                     file?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                     file?.filename?.endsWith('.doc') ||
                     file?.filename?.endsWith('.docx')

  // Spreadsheet files: XLS, XLSX, CSV
  const isExcelFile = file?.mimeType === 'application/vnd.ms-excel' ||
                      file?.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                      file?.mimeType === 'text/csv' ||
                      file?.filename?.endsWith('.xls') ||
                      file?.filename?.endsWith('.xlsx') ||
                      file?.filename?.endsWith('.csv')

  // Text files: TXT, MD, JSON (excluding CSV which is handled by Excel preview)
  const isTextFile = (file?.mimeType?.startsWith('text/') ||
                     file?.mimeType === 'application/json' ||
                     file?.filename?.endsWith('.md') ||
                     file?.filename?.endsWith('.txt') ||
                     file?.filename?.endsWith('.json')) &&
                     !isExcelFile // Exclude CSV files from text files

  const loadPreview = useCallback(async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      // Get signed URL for the file
      const { signedUrl: url } = await utils.files.getSignedUrl.fetch({
        fileId: file.id,
        expiresIn: 3600, // 1 hour
      })

      setSignedUrl(url)

      // For text files, fetch and display content
      if (isTextFile) {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch file content')
        }
        const content = await response.text()
        setPreviewContent(content)
      }
      // For Excel files, we don't need to fetch content here as ExcelPreview component handles it
    } catch (err) {
      console.error('Preview failed:', err)
      setError('Failed to load file preview')
    } finally {
      setIsLoading(false)
    }
  }, [file, isTextFile, utils.files.getSignedUrl])

  useEffect(() => {
    if (isOpen && file) {
      loadPreview()
    } else {
      // Reset state when modal closes
      setPreviewContent(null)
      setSignedUrl(null)
      setError(null)
    }
  }, [isOpen, file, loadPreview])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString()
  }

  const getFileIcon = () => {
    if (isImageFile) return <ImageIcon className="h-5 w-5" />
    if (isExcelFile) return <FileSpreadsheet className="h-5 w-5" />
    if (isWordFile) return <FileText className="h-5 w-5" />
    if (isPdfFile) return <FileText className="h-5 w-5" />
    if (isTextFile) return <FileText className="h-5 w-5" />
    return <FileIcon className="h-5 w-5" />
  }

  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading preview...</span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )
    }

    if (isImageFile && signedUrl) {
      return (
        <div className="flex justify-center p-4">
          <div className="relative max-w-full max-h-96">
            <Image
              src={signedUrl}
              alt={file.originalName || file.filename}
              width={800}
              height={600}
              className="max-w-full max-h-96 object-contain rounded-lg border"
              onError={() => setError('Failed to load image')}
            />
          </div>
        </div>
      )
    }

    if (isTextFile && previewContent !== null) {
      return (
        <ScrollArea className="h-96 w-full rounded-md border p-4">
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {previewContent}
          </pre>
        </ScrollArea>
      )
    }

    if (isPdfFile && signedUrl) {
      return (
        <div className="h-96 w-full">
          <iframe
            src={signedUrl}
            className="w-full h-full border rounded-lg"
            title={file.originalName || file.filename}
          />
        </div>
      )
    }

    if (isExcelFile && signedUrl) {
      return (
        <ExcelPreview
          fileUrl={signedUrl}
          fileName={file.originalName || file.filename}
        />
      )
    }

    if (isWordFile && signedUrl) {
      return (
        <WordPreview
          fileUrl={signedUrl}
          fileName={file.originalName || file.filename}
        />
      )
    }

    // Fallback for unsupported file types
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Preview not available for this file type
          </p>
          <Button onClick={() => onDownload(file)} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download to view
          </Button>
        </div>
      </div>
    )
  }

  if (!file) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div>
                <DialogTitle className="text-lg">
                  {file.originalName || file.filename}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {getFileTypeCategory(file.mimeType)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onDownload(file)}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* File Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">File Type:</span>
            <span className="ml-2">{file.mimeType}</span>
          </div>
          <div>
            <span className="font-medium">Uploaded:</span>
            <span className="ml-2">{formatDate(file.createdAt)}</span>
          </div>
          {file.description && (
            <div className="col-span-2">
              <span className="font-medium">Description:</span>
              <p className="mt-1 text-muted-foreground">{file.description}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden">
          {renderPreviewContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
