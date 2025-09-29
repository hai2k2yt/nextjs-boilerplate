import { NextRequest, NextResponse } from 'next/server'
import { paypalProvider } from '@/lib/payments/providers/paypal'
import { stripeProvider } from '@/lib/payments/providers/stripe'
import { db } from '@/server/db'
import { PaymentStatus, PaymentEventType } from '@prisma/client'
import { PaymentProvider } from '@/lib/enums/payment-methods'
import {
  createAuthenticatedHandler,
  createSuccessResponse,
  createErrorResponse,
  AuthenticatedValidatedRequest,
  withValidation
} from '@/lib/middleware/auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const refundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
  note: z.string().optional(),
})

type RefundRequest = z.infer<typeof refundSchema>

/**
 * Create a refund for a payment
 * POST /api/payments/refund/[orderId]
 */
const handleCreateRefund = async (
  request: AuthenticatedValidatedRequest<RefundRequest>,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> => {
  try {
    const { orderId } = await params
    const { amount, reason, note } = request.validatedData

    if (!orderId) {
      return createErrorResponse('Order ID is required', 400)
    }

    // Find the payment in database
    const payment = await db.payment.findFirst({
      where: {
        orderId: orderId,
        userId: request.user.id, // Ensure user owns this payment
      },
    })

    if (!payment) {
      return createErrorResponse('Payment not found', 404)
    }

    // Check if payment can be refunded
    if (payment.status !== PaymentStatus.COMPLETED) {
      return createErrorResponse(
        `Payment cannot be refunded. Current status: ${payment.status}`,
        400
      )
    }

    // Validate refund amount
    const maxRefundAmount = Number(payment.amount)
    if (amount && amount > maxRefundAmount) {
      return createErrorResponse(
        `Refund amount cannot exceed payment amount: ${maxRefundAmount}`,
        400
      )
    }

    let refundResult: any
    let newStatus: PaymentStatus
    let message: string

    // Process refund based on payment provider
    switch (payment.provider) {
      case PaymentProvider.PAYPAL:
        // Get capture ID from provider data
        const providerData = payment.providerData as any
        const captureId = providerData?.captureId ||
                          providerData?.captureResult?.purchase_units?.[0]?.payments?.captures?.[0]?.id

        if (!captureId) {
          return createErrorResponse('PayPal capture ID not found', 400)
        }

        try {
          refundResult = await paypalProvider.createRefund({
            captureId,
            amount,
            currency: payment.currency,
            note: note || reason || 'Refund requested by customer',
          })

          // Determine new status based on refund amount
          if (!amount || amount >= maxRefundAmount) {
            newStatus = PaymentStatus.REFUNDED
            message = 'PayPal payment fully refunded'
          } else {
            newStatus = PaymentStatus.PARTIALLY_REFUNDED
            message = `PayPal payment partially refunded: ${amount} ${payment.currency}`
          }
        } catch (error) {
          logger.error('PayPal refund failed', { orderId, error })
          return createErrorResponse('Failed to create PayPal refund', 500)
        }
        break

      case PaymentProvider.STRIPE:
        if (!payment.externalId) {
          return createErrorResponse('Stripe payment intent ID not found', 400)
        }

        try {
          refundResult = await stripeProvider.createRefund({
            paymentIntentId: payment.externalId,
            amount,
            reason: reason as 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined,
            metadata: {
              orderId,
              note: note || '',
            },
          })

          // Determine new status based on refund amount
          if (!amount || amount >= maxRefundAmount) {
            newStatus = PaymentStatus.REFUNDED
            message = 'Stripe payment fully refunded'
          } else {
            newStatus = PaymentStatus.PARTIALLY_REFUNDED
            message = `Stripe payment partially refunded: ${amount} ${payment.currency}`
          }
        } catch (error) {
          logger.error('Stripe refund failed', { orderId, error })
          return createErrorResponse('Failed to create Stripe refund', 500)
        }
        break

      default:
        return createErrorResponse(
          `Refunds not supported for provider: ${payment.provider}`,
          400
        )
    }

    // Update payment status in database
    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        providerData: {
          ...(payment.providerData as object || {}),
          refunds: [
            ...((payment.providerData as any)?.refunds || []),
            {
              ...refundResult,
              createdAt: new Date().toISOString(),
              amount,
              reason,
              note,
            },
          ],
        },
        updatedAt: new Date(),
      },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // Create payment event
    await db.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType: newStatus === PaymentStatus.REFUNDED 
          ? PaymentEventType.REFUNDED 
          : PaymentEventType.REFUND_INITIATED,
        status: newStatus,
        message,
        data: {
          refundResult,
          refundAmount: amount,
          reason,
          note,
        },
      },
    })

    logger.info('Payment refund created', {
      paymentId: payment.id,
      orderId,
      provider: payment.provider,
      refundAmount: amount,
      status: newStatus,
    })

    return createSuccessResponse({
      orderId: updatedPayment.orderId,
      status: updatedPayment.status,
      originalAmount: updatedPayment.amount,
      refundAmount: amount || updatedPayment.amount,
      currency: updatedPayment.currency,
      refundResult,
      message,
    })

  } catch (error) {
    logger.error('Payment refund API error', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

export const POST = createAuthenticatedHandler(
  withValidation(refundSchema, handleCreateRefund)
)

export async function GET(_request: NextRequest) {
  return NextResponse.json({ message: 'Payment refund endpoint' })
}
