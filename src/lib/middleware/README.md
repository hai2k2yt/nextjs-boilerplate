# API Middleware Documentation

This directory contains reusable middleware for Next.js API routes to handle common concerns like authentication, validation, and error handling.

## Available Middleware

### 1. Authentication Middleware (`auth.ts`)

Handles user authentication and authorization for API routes.

#### Basic Usage

```typescript
import { createAuthenticatedHandler, AuthenticatedRequest } from '@/lib/middleware/auth'

const handleProtectedRoute = async (request: AuthenticatedRequest) => {
  // request.user is now available and guaranteed to exist
  console.log('User ID:', request.user.id)
  
  return createSuccessResponse({ message: 'Success' })
}

export const GET = createAuthenticatedHandler(handleProtectedRoute)
```

#### Resource Ownership Protection

```typescript
import { withResourceOwnership } from '@/lib/middleware/auth'

export const GET = withResourceOwnership(
  handleGetPayment,
  async (request, { params }) => {
    const { id } = await params
    const payment = await paymentService.getPayment(id)
    return payment?.userId || null // Return owner ID or null
  }
)
```

#### Optional Authentication

```typescript
export const GET = createAuthenticatedHandler(
  handleOptionalAuth,
  { required: false } // User is optional
)
```

### 2. Validation Middleware (`validation.ts`)

Handles request body and query parameter validation using Zod schemas.

#### Body Validation

```typescript
import { withValidation, AuthenticatedValidatedRequest } from '@/lib/middleware/validation'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(18).optional(),
})

const handleCreateUser = async (request: AuthenticatedValidatedRequest<z.infer<typeof createUserSchema>>) => {
  // request.validatedData contains the validated body
  const { name, email, age } = request.validatedData

  return createSuccessResponse({ user: { name, email, age } })
}

export const POST = createAuthenticatedHandler(
  withValidation(createUserSchema, handleCreateUser)
)
```

#### Query Parameter Validation

```typescript
import { withQueryValidation } from '@/lib/middleware/validation'

const getUsersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
})

export const GET = compose(
  createAuthenticatedHandler,
  (handler) => withQueryValidation(getUsersSchema, handler)
)(handleGetUsers)
```

### 3. Composing Multiple Middleware

Use the `compose` function to combine multiple middleware:

```typescript
import { compose } from '@/lib/middleware/validation'

export const POST = compose(
  createAuthenticatedHandler,
  (handler) => withValidation(schema, handler),
  (handler) => withRateLimit(handler), // Custom middleware
)(handleRequest)
```

## Complete Examples

### 1. Payment Creation API

```typescript
// src/app/api/payments/create/route.ts
import { z } from 'zod'
import { PaymentMethod } from '@prisma/client'
import { 
  createAuthenticatedHandler, 
  createSuccessResponse, 
  createErrorResponse,
  AuthenticatedRequest 
} from '@/lib/middleware/auth'
import { withValidation, AuthenticatedValidatedRequest } from '@/lib/middleware/validation'

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  paymentMethod: z.nativeEnum(PaymentMethod),
  description: z.string().optional(),
})

const handleCreatePayment = async (request: AuthenticatedValidatedRequest<z.infer<typeof createPaymentSchema>>) => {
  try {
    const payment = await paymentService.createPayment({
      userId: request.user.id,
      ...request.validatedData,
    })

    return createSuccessResponse(payment)
  } catch (error) {
    return createErrorResponse(error.message, 500)
  }
}

export const POST = createAuthenticatedHandler(
  withValidation(createPaymentSchema, handleCreatePayment)
)
```

### 2. File Upload API

```typescript
// src/app/api/upload/route.ts
import { createAuthenticatedHandler, AuthenticatedRequest } from '@/lib/middleware/auth'

const handleFileUpload = async (request: AuthenticatedRequest) => {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return createErrorResponse('No file provided', 400)
  }

  // Process file upload...
  return createSuccessResponse({ fileUrl: 'uploaded-file-url' })
}

export const POST = createAuthenticatedHandler(handleFileUpload)
```

### 3. Resource with Ownership Check

```typescript
// src/app/api/posts/[id]/route.ts
import { withResourceOwnership } from '@/lib/middleware/auth'

const handleGetPost = async (request: AuthenticatedRequest, { params }) => {
  const { id } = await params
  const post = await postService.getPost(id)
  
  return createSuccessResponse(post)
}

export const GET = withResourceOwnership(
  handleGetPost,
  async (request, { params }) => {
    const { id } = await params
    const post = await postService.getPost(id)
    return post?.authorId || null
  }
)
```

## Utility Functions

### Response Helpers

```typescript
import { createSuccessResponse, createErrorResponse } from '@/lib/middleware/auth'

// Success response
return createSuccessResponse({ data: 'value' }) // Status 200
return createSuccessResponse({ data: 'value' }, 201) // Custom status

// Error response
return createErrorResponse('Not found', 404)
return createErrorResponse('Validation failed', 400, validationErrors)
```

## Migration Guide

### Before (Duplicate Code)

```typescript
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate
    const body = await request.json()
    const validatedData = schema.parse(body)

    // Business logic
    const result = await someService.doSomething(validatedData)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### After (With Middleware)

```typescript
const handleRequest = async (request: AuthenticatedValidatedRequest<SchemaType>) => {
  try {
    const result = await someService.doSomething(request.validatedData)
    return createSuccessResponse(result)
  } catch (error) {
    return createErrorResponse(error.message, 500)
  }
}

export const GET = compose(
  createAuthenticatedHandler,
  (handler) => withValidation(schema, handler)
)(handleRequest)
```

## Benefits

1. **DRY Principle**: Eliminate duplicate authentication and validation code
2. **Type Safety**: Full TypeScript support with proper typing
3. **Consistent Error Handling**: Standardized error responses
4. **Composable**: Mix and match middleware as needed
5. **Maintainable**: Centralized logic for common concerns
6. **Testable**: Easy to unit test individual middleware functions

## Custom Middleware

You can create custom middleware following the same pattern:

```typescript
export function withRateLimit<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Rate limiting logic
    const isAllowed = await checkRateLimit(request)
    
    if (!isAllowed) {
      return createErrorResponse('Rate limit exceeded', 429)
    }

    return await handler(request, ...args)
  }
}
```
