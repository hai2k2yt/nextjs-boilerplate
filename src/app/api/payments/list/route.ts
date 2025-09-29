import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import {
  createAuthenticatedHandler,
  createSuccessResponse,
  createErrorResponse,
  AuthenticatedRequest,
  AuthenticatedValidatedRequest,
  withValidation
} from '@/lib/middleware/auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const listPaymentsPostSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  status: z.string().optional(),
  provider: z.string().optional(),
  orderId: z.string().optional(),
})

type ListPaymentsRequest = {
  limit: number
  offset: number
  status?: string
  provider?: string
  orderId?: string
}

/**
 * Get user's payments with filtering and pagination
 * GET /api/payments/list
 */
const handleListPayments = async (
  request: AuthenticatedValidatedRequest<ListPaymentsRequest>
): Promise<NextResponse> => {
  try {
    const { limit, offset, status, provider, orderId } = request.validatedData

    // Build where clause
    const where: any = {
      userId: request.user.id,
    }

    if (status) {
      where.status = status
    }

    if (provider) {
      where.provider = provider
    }

    if (orderId) {
      where.orderId = {
        contains: orderId,
        mode: 'insensitive',
      }
    }

    // Get payments with events
    const [payments, totalCount] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          events: {
            orderBy: { createdAt: 'desc' },
            take: 10, // Limit events per payment
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.payment.count({ where }),
    ])

    // Transform payments for frontend
    const transformedPayments = payments.map((payment) => ({
      id: payment.id,
      orderId: payment.orderId,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      provider: payment.provider,
      description: payment.description,
      paidAt: payment.paidAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      externalId: payment.externalId,
      events: payment.events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        status: event.status,
        message: event.message,
        createdAt: event.createdAt.toISOString(),
        data: event.data,
      })),
    }))

    logger.info('Payments listed', {
      userId: request.user.id,
      count: payments.length,
      totalCount,
      filters: { status, provider, orderId },
    })

    return createSuccessResponse({
      payments: transformedPayments,
      pagination: {
        limit,
        offset,
        totalCount,
        hasMore: offset + limit < totalCount,
      },
    })

  } catch (error) {
    logger.error('Payment list API error', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

/**
 * Handle GET request with query parameters
 */
const handleGetPayments = async (request: AuthenticatedRequest): Promise<NextResponse> => {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Parse query parameters
    const queryData = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      status: searchParams.get('status') || undefined,
      provider: searchParams.get('provider') || undefined,
      orderId: searchParams.get('orderId') || undefined,
    }

    // Apply defaults and validate query parameters
    const validatedData: ListPaymentsRequest = {
      limit: queryData.limit || 20,
      offset: queryData.offset || 0,
      status: queryData.status,
      provider: queryData.provider,
      orderId: queryData.orderId,
    }

    // Create request object with validated data
    const requestWithData = request as AuthenticatedValidatedRequest<ListPaymentsRequest>
    requestWithData.validatedData = validatedData

    return await handleListPayments(requestWithData)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Invalid query parameters: ${error.errors.map(e => e.message).join(', ')}`,
        400
      )
    }

    logger.error('Payment list GET API error', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

export const GET = createAuthenticatedHandler(handleGetPayments)

// Also support POST for more complex filtering
const handlePostPayments = async (
  request: AuthenticatedValidatedRequest<z.infer<typeof listPaymentsPostSchema>>
): Promise<NextResponse> => {
  const { limit = 20, offset = 0, status, provider, orderId } = request.validatedData

  const validatedData: ListPaymentsRequest = {
    limit,
    offset,
    status,
    provider,
    orderId,
  }

  const requestWithData = request as AuthenticatedValidatedRequest<ListPaymentsRequest>
  requestWithData.validatedData = validatedData

  return await handleListPayments(requestWithData)
}

export const POST = createAuthenticatedHandler(
  withValidation(listPaymentsPostSchema, handlePostPayments)
)
