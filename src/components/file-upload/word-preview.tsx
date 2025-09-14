'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, Loader2, FileText } from 'lucide-react'

// @ts-ignore - mammoth doesn't have official TypeScript types
import mammoth from 'mammoth'

interface WordPreviewProps {
  fileUrl: string
  fileName: string
}

export function WordPreview({ fileUrl, fileName: _fileName }: WordPreviewProps) {
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWordDocument = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch the Word document as ArrayBuffer
        const response = await fetch(fileUrl)
        if (!response.ok) {
          throw new Error('Failed to fetch Word document')
        }

        const arrayBuffer = await response.arrayBuffer()

        // Check if it's a valid Word document by looking at file signature
        const uint8Array = new Uint8Array(arrayBuffer)
        const isDocx = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B // ZIP signature (DOCX)
        const isDoc = uint8Array[0] === 0xD0 && uint8Array[1] === 0xCF // OLE signature (DOC)
        const isRtf = uint8Array[0] === 0x7B && uint8Array[1] === 0x5C // RTF signature

        if (isRtf) {
          // Handle RTF files by converting to text
          const rtfText = new TextDecoder().decode(arrayBuffer)
          const plainText = rtfText
            .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF control words
            .replace(/[{}]/g, '') // Remove braces
            .replace(/\\\\/g, '\\') // Unescape backslashes
            .trim()

          setContent(`<div style="white-space: pre-wrap; font-family: serif;">${plainText}</div>`)
        } else if (isDocx || isDoc) {
          // Convert Word document to HTML using mammoth
          const result = await mammoth.convertToHtml({ arrayBuffer })

          if (result.messages && result.messages.length > 0) {
            console.warn('Word conversion warnings:', result.messages)
          }

          if (!result.value || result.value.trim() === '') {
            throw new Error('No content could be extracted from the document')
          }

          setContent(result.value)
        } else {
          throw new Error('Unsupported document format. Only .docx, .doc, and .rtf files are supported.')
        }
      } catch (err) {
        console.error('Error loading Word document:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(`Failed to load Word document: ${errorMessage}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (fileUrl) {
      loadWordDocument()
    }
  }, [fileUrl])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading Word document...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <span className="text-center">{error}</span>
          <p className="text-sm text-muted-foreground text-center">
            Try downloading the file to view it in Microsoft Word or another compatible application.
          </p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <FileText className="h-8 w-8" />
          <span>No content found in document</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Document Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>Word Document Preview</span>
      </div>

      {/* Document Content */}
      <ScrollArea className="h-96 w-full rounded-md border">
        <div className="p-6">
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: content }}
            style={{
              // Override prose styles for better Word document display
              lineHeight: '1.6',
              fontSize: '14px'
            }}
          />
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="text-xs text-muted-foreground">
        <p>
          Document converted from Word format. Some formatting may differ from the original.
        </p>
      </div>
    </div>
  )
}
