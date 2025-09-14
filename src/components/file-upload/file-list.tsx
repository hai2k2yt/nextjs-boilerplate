'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  File, 
  Image, 
  FileText, 
  FileSpreadsheet, 
  Archive, 
  Download, 
  Eye, 
  MoreHorizontal,
  Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trpc } from '@/lib/trpc'
import { getFileTypeCategory } from '@/lib/file-utils'
import { FilePreviewModal } from './file-preview-modal'

interface FileListProps {
  onFileSelect?: (file: any) => void
  onFilePreview?: (file: any) => void
}

function getFileIcon(mimeType: string) {
  const category = getFileTypeCategory(mimeType)
  
  switch (category) {
    case 'image':
      // eslint-disable-next-line jsx-a11y/alt-text
      return <Image className="h-5 w-5" />
    case 'pdf':
    case 'document':
      return <FileText className="h-5 w-5" />
    case 'spreadsheet':
      return <FileSpreadsheet className="h-5 w-5" />
    case 'archive':
      return <Archive className="h-5 w-5" />
    default:
      return <File className="h-5 w-5" />
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function FileList({ onFileSelect, onFilePreview }: FileListProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMimeType, setSelectedMimeType] = useState<string>('all')
  const [previewFile, setPreviewFile] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0) // Force re-render key



  const { data: categories = [] } = trpc.files.getCategories.useQuery()

  const {
    data: filesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = trpc.files.getFiles.useInfiniteQuery(
    {
      limit: 20,
      search: search || undefined,
      categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
      mimeType: selectedMimeType === 'all' ? undefined : selectedMimeType,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  )

  // We'll use utils.fetch to manually trigger the query when needed

  const files = useMemo(() =>
    filesData?.pages.flatMap(page => page.files) ?? [],
    [filesData?.pages]
  )

  const utils = trpc.useUtils()

  // Clear localStorage on component mount to avoid stale state
  useEffect(() => {
    localStorage.removeItem('filePreviewState')
  }, [])

  const handleDownload = async (file: any) => {
    try {
      const { signedUrl } = await utils.files.getSignedUrl.fetch({
        fileId: file.id,
        expiresIn: 3600, // 1 hour
      })

      // Fetch the file as blob and create download link
      const response = await fetch(signedUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = file.filename || file.originalName || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the blob URL
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handlePreview = (file: any) => {
    // Always open preview modal with force re-render
    setPreviewFile(file)
    setIsPreviewOpen(true)
    setModalKey(prev => prev + 1) // Force modal re-render

    // Also call parent handler if provided
    if (onFilePreview) {
      onFilePreview(file)
    }
  }

  const handleClosePreview = () => {
    setIsPreviewOpen(false)
    setPreviewFile(null)
  }

  const mimeTypeOptions = [
    { value: 'all', label: 'All file types' },
    { value: 'image/', label: 'Images' },
    { value: 'application/pdf', label: 'PDF Documents' },
    { value: 'application/vnd.openxmlformats-officedocument', label: 'Office Documents' },
    { value: 'text/', label: 'Text Files' },
    { value: 'application/zip', label: 'Archives' },
  ]

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color || '#6b7280' }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMimeType} onValueChange={setSelectedMimeType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {mimeTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* File list */}
      {files.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No files found</p>
            <p className="text-muted-foreground">
              {search || (selectedCategory !== 'all') || (selectedMimeType !== 'all')
                ? 'Try adjusting your filters'
                : 'Upload your first file to get started'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-muted-foreground">
                      {getFileIcon(file.mimeType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 
                          className="font-medium truncate cursor-pointer hover:text-primary"
                          onClick={() => onFileSelect?.(file)}
                        >
                          {file.filename}
                        </h3>
                        {file.isPublic && (
                          <Badge variant="secondary" className="text-xs">
                            Public
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>
                          {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Categories */}
                      {file.categories.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <div className="flex gap-1">
                            {file.categories.map(({ category }) => (
                              <Badge
                                key={category.id}
                                variant="outline"
                                className="text-xs"
                                style={{
                                  backgroundColor: category.color ? `${category.color}15` : undefined,
                                  borderColor: category.color || undefined,
                                }}
                              >
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {file.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {file.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onFileSelect?.(file)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load more button */}
          {hasNextPage && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        key={modalKey}
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        onDownload={handleDownload}
      />
    </div>
  )
}
