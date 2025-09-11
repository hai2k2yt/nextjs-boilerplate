'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Upload, Files } from 'lucide-react'
import { FileUpload } from '@/components/file-upload/file-upload'
import { FileList } from '@/components/file-upload/file-list'

export default function FilesPage() {
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadSuccess = (file: any) => {
    setUploadSuccess(`File "${file.filename}" uploaded successfully!`)
    setUploadError(null)
    setRefreshKey(prev => prev + 1) // Trigger file list refresh
    
    // Clear success message after 5 seconds
    setTimeout(() => setUploadSuccess(null), 5000)
  }

  const handleUploadError = (error: string) => {
    setUploadError(error)
    setUploadSuccess(null)
    
    // Clear error message after 10 seconds
    setTimeout(() => setUploadError(null), 10000)
  }

  const handleFileSelect = (file: any) => {
    setSelectedFile(file)
  }

  const handleFilePreview = (file: any) => {
    // Custom preview logic can be implemented here
    // eslint-disable-next-line no-console
    console.log('Preview file:', file)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">File Management</h1>
        <p className="text-muted-foreground">
          Upload, organize, and manage your files with categories and secure access control.
        </p>
      </div>

      {/* Success/Error Messages */}
      {uploadSuccess && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {uploadSuccess}
          </AlertDescription>
        </Alert>
      )}

      {uploadError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {uploadError}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <Files className="h-4 w-4" />
            My Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Files</CardTitle>
              <CardDescription>
                Drag and drop files or click to select. You can assign categories and add descriptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                maxFiles={10}
              />
            </CardContent>
          </Card>

          {/* File Upload Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supported File Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Images: JPG, PNG, GIF, WebP, SVG</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Documents: PDF, DOC, DOCX</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Spreadsheets: XLS, XLSX, CSV</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Text: TXT, MD, JSON</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Archives: ZIP, RAR</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Drag & drop upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Category organization</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">File descriptions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Secure access control</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Up to 50MB per file</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Files</CardTitle>
              <CardDescription>
                Browse, search, and manage your uploaded files. Click on files to view details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileList
                key={refreshKey} // Force refresh when files are uploaded
                onFileSelect={handleFileSelect}
                onFilePreview={handleFilePreview}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Details Modal/Panel could be added here */}
      {selectedFile && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>File Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {selectedFile.filename}</p>
              <p><strong>Original Name:</strong> {selectedFile.originalName}</p>
              <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Type:</strong> {selectedFile.mimeType}</p>
              <p><strong>Created:</strong> {new Date(selectedFile.createdAt).toLocaleString()}</p>
              {selectedFile.description && (
                <p><strong>Description:</strong> {selectedFile.description}</p>
              )}
              {selectedFile.categories.length > 0 && (
                <div>
                  <strong>Categories:</strong>
                  <div className="flex gap-1 mt-1">
                    {selectedFile.categories.map(({ category }: { category: any }) => (
                      <span
                        key={category.id}
                        className="px-2 py-1 text-xs rounded-full border"
                        style={{
                          backgroundColor: category.color ? `${category.color}20` : undefined,
                          borderColor: category.color || undefined,
                        }}
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
