import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createErrorResponse, AuthenticatedRequest } from './auth'

export interface AuthenticatedValidatedRequest<T = unknown> extends AuthenticatedRequest {
  validatedData: T
}

/**
 * Validation middleware for API routes
 * Validates request body against Zod schema
 */
export function withValidation<T, Args extends unknown[]>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  handler: (request: AuthenticatedValidatedRequest<T>, ...args: Args) => Promise<NextResponse>
) {
  return async (request: AuthenticatedRequest, ...args: Args): Promise<NextResponse> => {
    try {
      // Parse request body
      const body = await request.json()

      // Validate against schema
      const validatedData = schema.parse(body)

      // Add validated data to request
      const validatedRequest = request as AuthenticatedValidatedRequest<T>
      validatedRequest.validatedData = validatedData

      // Call handler with validated request
      return await handler(validatedRequest, ...args)
      
    } catch (error) {
      console.error('Validation middleware error:', error)
      
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          'Validation error',
          400,
          error.errors
        )
      }
      
      if (error instanceof SyntaxError) {
        return createErrorResponse('Invalid JSON', 400)
      }
      
      return createErrorResponse('Internal server error', 500)
    }
  }
}

/**
 * Query parameter validation middleware
 */
export function withQueryValidation<T, Args extends unknown[]>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  handler: (request: AuthenticatedValidatedRequest<T>, ...args: Args) => Promise<NextResponse>
) {
  return async (request: AuthenticatedRequest, ...args: Args): Promise<NextResponse> => {
    try {
      // Parse query parameters
      const { searchParams } = new URL(request.url)
      const queryObject: Record<string, unknown> = {}
      
      searchParams.forEach((value, key) => {
        // Try to parse numbers and booleans
        if (value === 'true') queryObject[key] = true
        else if (value === 'false') queryObject[key] = false
        else if (!isNaN(Number(value)) && value !== '') queryObject[key] = Number(value)
        else queryObject[key] = value
      })
      
      // Validate against schema
      const validatedData = schema.parse(queryObject)
      
      // Add validated data to request
      const validatedRequest = request as AuthenticatedValidatedRequest<T>
      validatedRequest.validatedData = validatedData

      // Call handler with validated request
      return await handler(validatedRequest, ...args)
      
    } catch (error) {
      console.error('Query validation middleware error:', error)
      
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          'Query validation error',
          400,
          error.errors
        )
      }
      
      return createErrorResponse('Internal server error', 500)
    }
  }
}


