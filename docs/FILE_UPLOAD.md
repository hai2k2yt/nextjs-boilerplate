# File Upload & Management System

This project includes a comprehensive file upload and management system with Supabase Storage integration, category organization, and secure access control.

## Features

### ✅ File Upload
- **Drag & Drop Interface**: Modern drag-and-drop file upload with visual feedback
- **Multiple File Support**: Upload single or multiple files simultaneously
- **File Validation**: Client and server-side validation with Zod schemas
- **Progress Tracking**: Real-time upload progress indicators
- **File Type Support**: Images, PDFs, Office documents, spreadsheets, text files, and archives

### ✅ Category Management
- **Create Categories**: Organize files with custom categories
- **Color Coding**: Assign colors to categories for visual organization
- **Multiple Categories**: Assign multiple categories to a single file
- **Category Search**: Filter files by category

### ✅ File Organization
- **Search & Filter**: Search files by name, description, or filter by type/category
- **File Metadata**: Store filename, description, size, and creation date
- **Public/Private Files**: Control file visibility and access
- **Infinite Scroll**: Efficient pagination for large file collections

### ✅ Security & Access Control
- **User Authentication**: Files are tied to authenticated users
- **Private Storage**: Files stored in private Supabase buckets
- **Signed URLs**: Temporary, secure URLs for file access
- **Authorization**: Row-level security ensures users only access their files

## Tech Stack

- **Frontend**: React, Next.js 15, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **File Upload**: react-dropzone
- **Storage**: Supabase Storage
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod schemas
- **State Management**: tRPC with React Query

## Setup Instructions

### 1. Install Dependencies

The required dependencies are already included in package.json:
- `@supabase/supabase-js`
- `react-dropzone`

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Client-side Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Supabase Setup

1. **Create a Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project

2. **Create Storage Bucket**:
   ```sql
   -- Create the files bucket
   INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', false);
   ```

3. **Set up Storage Policies**:
   ```sql
   -- Allow authenticated users to upload files
   CREATE POLICY "Users can upload files" ON storage.objects
   FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

   -- Allow users to view their own files
   CREATE POLICY "Users can view own files" ON storage.objects
   FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

   -- Allow users to delete their own files
   CREATE POLICY "Users can delete own files" ON storage.objects
   FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
   ```

### 4. Database Migration

Run the database migration to create the required tables:

```bash
npm run db:push
```

This creates the following tables:
- `Category` - File categories with colors and descriptions
- `File` - File metadata and storage information
- `FileCategory` - Many-to-many relationship between files and categories

## Usage

### Basic File Upload

```tsx
import { FileUpload } from '@/components/file-upload/file-upload'

function MyComponent() {
  const handleUploadSuccess = (file) => {
    console.log('File uploaded:', file)
  }

  const handleUploadError = (error) => {
    console.error('Upload failed:', error)
  }

  return (
    <FileUpload
      onUploadSuccess={handleUploadSuccess}
      onUploadError={handleUploadError}
      maxFiles={10}
    />
  )
}
```

### File List with Filtering

```tsx
import { FileList } from '@/components/file-upload/file-list'

function MyComponent() {
  const handleFileSelect = (file) => {
    console.log('Selected file:', file)
  }

  return (
    <FileList
      onFileSelect={handleFileSelect}
      onFilePreview={(file) => window.open(file.signedUrl, '_blank')}
    />
  )
}
```

### Category Management

```tsx
import { CategorySelector } from '@/components/file-upload/category-selector'

function MyComponent() {
  const [selectedCategories, setSelectedCategories] = useState([])

  return (
    <CategorySelector
      selectedCategoryIds={selectedCategories}
      onCategoryChange={setSelectedCategories}
      maxCategories={5}
    />
  )
}
```

## API Endpoints

### tRPC Routes

- `files.uploadFile` - Upload file metadata to database
- `files.getFiles` - Get paginated file list with filtering
- `files.getFile` - Get single file details
- `files.updateFile` - Update file metadata
- `files.deleteFile` - Delete file and storage
- `files.getSignedUrl` - Generate temporary access URL
- `files.createCategory` - Create new category
- `files.getCategories` - Get user's categories
- `files.updateCategory` - Update category
- `files.deleteCategory` - Delete category

### REST API

- `POST /api/upload` - Upload file to Supabase Storage

## File Configuration

### Supported File Types

- **Images**: JPG, PNG, GIF, WebP, SVG
- **Documents**: PDF, DOC, DOCX
- **Spreadsheets**: XLS, XLSX, CSV
- **Text**: TXT, MD, JSON
- **Archives**: ZIP, RAR

### File Limits

- **Maximum file size**: 50MB per file
- **Maximum categories per file**: 10
- **Maximum files per upload**: 10 (configurable)

## Security Considerations

1. **File Validation**: All files are validated on both client and server
2. **Storage Isolation**: Files are stored in user-specific folders
3. **Access Control**: Signed URLs expire after 1 hour by default
4. **Authentication Required**: All file operations require user authentication
5. **Row Level Security**: Database policies ensure data isolation

## Demo Page

Visit `/files` to see the complete file upload and management interface with:
- Drag & drop file upload
- Category creation and assignment
- File browsing and filtering
- File preview and download

## Customization

### File Type Support

To add new file types, update the `FILE_UPLOAD_CONFIG` in `src/lib/supabase.ts`:

```typescript
export const FILE_UPLOAD_CONFIG = {
  allowedMimeTypes: [
    // Add your MIME types here
    'application/your-custom-type',
  ],
  allowedExtensions: [
    // Add your extensions here
    '.custom',
  ]
}
```

### Upload Limits

Modify the configuration in `src/lib/supabase.ts`:

```typescript
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  // ... other config
}
```

### Storage Bucket

To use a different bucket name, update `STORAGE_BUCKET` in `src/lib/supabase.ts`:

```typescript
export const STORAGE_BUCKET = 'your-bucket-name'
```

## Troubleshooting

### Common Issues

1. **Upload fails**: Check Supabase credentials and bucket policies
2. **Files not visible**: Verify RLS policies are correctly set up
3. **Large file uploads**: Increase `maxFileSize` and check Supabase limits
4. **CORS errors**: Ensure Supabase CORS settings allow your domain

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed error messages in the console.
