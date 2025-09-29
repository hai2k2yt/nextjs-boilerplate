import { NextResponse } from 'next/server'
import { paymentService } from '@/lib/payments/payment-service'
import { z } from 'zod'
import {
  createAuthenticatedHandler,
  createSuccessResponse,
  createErrorResponse
} from '@/lib/middleware/auth'
import { withValidation, withQueryValidation, AuthenticatedValidatedRequest } from '@/lib/middleware/validation'
import { createPaymentSchema } from '@/lib/validations/payment'

const handleCreatePayment = async (request: AuthenticatedValidatedRequest<z.infer<typeof createPaymentSchema>>): Promise<NextResponse> => {
  try {
    // Create payment
    const payment = await paymentService.createPayment({
      userId: request.user.id,
      ...request.validatedData,
    })

    return createSuccessResponse(payment)

  } catch (error) {
    console.error('Payment creation API error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

export const POST = createAuthenticatedHandler(
  withValidation(createPaymentSchema, handleCreatePayment)
)

const getUserPaymentsSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(10),
  offset: z.number().min(0).optional().default(0),
})

const handleGetUserPayments = async (request: AuthenticatedValidatedRequest<z.infer<typeof getUserPaymentsSchema>>): Promise<NextResponse> => {
  try {
    const { limit, offset } = request.validatedData

    // Get user payments
    const payments = await paymentService.getUserPayments(
      request.user.id,
      limit,
      offset
    )

    return createSuccessResponse(payments)

  } catch (error) {
    console.error('Get payments API error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

export const GET = createAuthenticatedHandler(
  withQueryValidation(getUserPaymentsSchema, handleGetUserPayments)
)
