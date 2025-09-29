import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { z } from 'zod'

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email?: string | null
    name?: string | null
  }
}

export interface AuthenticatedValidatedRequest<T> extends AuthenticatedRequest {
  validatedData: T
}

export interface AuthMiddlewareOptions {
  /**
   * Whether to require authentication. If false, user will be optional.
   * @default true
   */
  required?: boolean
  
  /**
   * Custom error message for unauthorized requests
   * @default 'Unauthorized'
   */
  unauthorizedMessage?: string
  
  /**
   * Custom status code for unauthorized requests
   * @default 401
   */
  unauthorizedStatus?: number
}

/**
 * Authentication middleware for API routes
 * Checks for valid session and adds user to request
 */
export function withAuth<T extends unknown[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  const {
    required = true,
    unauthorizedMessage = 'Unauthorized',
    unauthorizedStatus = 401,
  } = options

  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get session
      const session = await getServerSession(authOptions)
      
      // Check if authentication is required
      if (required && !session?.user?.id) {
        return NextResponse.json(
          { error: unauthorizedMessage },
          { status: unauthorizedStatus }
        )
      }

      // Add user to request if session exists
      const authenticatedRequest = request as AuthenticatedRequest
      if (session?.user) {
        authenticatedRequest.user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        }
      }

      // Call the handler with authenticated request
      return await handler(authenticatedRequest, ...args)
      
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Higher-order function to create authenticated API handlers
 * Usage: export const GET = createAuthenticatedHandler(async (request) => { ... })
 */
export function createAuthenticatedHandler<T extends unknown[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>,
  options?: AuthMiddlewareOptions
) {
  return withAuth(handler, options)
}



/**
 * Utility to create error responses
 */
export const createErrorResponse = (
  message: string,
  status = 500,
  details?: unknown
) => {
  const response: { error: string; details?: unknown } = { error: message }
  if (details) {
    response.details = details
  }
  return NextResponse.json(response, { status })
}

/**
 * Utility to create success responses
 */
export const createSuccessResponse = (
  data: unknown,
  status = 200
) => {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

/**
 * Validation middleware for API routes
 * Validates request body against a Zod schema
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (request: AuthenticatedValidatedRequest<T>, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: AuthenticatedRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // Parse request body
      const body = await request.json()

      // Validate against schema
      const validatedData = schema.parse(body)

      // Create request with validated data
      const validatedRequest = request as AuthenticatedValidatedRequest<T>
      validatedRequest.validatedData = validatedData

      // Call handler with validated request
      return await handler(validatedRequest, ...args)

    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
          400
        )
      }

      if (error instanceof SyntaxError) {
        return createErrorResponse('Invalid JSON in request body', 400)
      }

      console.error('Validation middleware error:', error)
      return createErrorResponse('Internal server error', 500)
    }
  }
}
