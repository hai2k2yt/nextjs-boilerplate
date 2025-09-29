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
  AuthenticatedRequest
} from '@/lib/middleware/auth'
import { logger } from '@/lib/logger'

/**
 * Capture a payment order
 * POST /api/payments/capture/[orderId]
 */
const handleCapturePayment = async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> => {
  try {
    const { orderId } = await params

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

    // Check if payment is in a capturable state
    if (payment.status !== PaymentStatus.PENDING) {
      return createErrorResponse(
        `Payment cannot be captured. Current status: ${payment.status}`,
        400
      )
    }

    let captureResult: any
    let newStatus: PaymentStatus
    let message: string

    // Capture based on payment provider
    switch (payment.provider) {
      case PaymentProvider.PAYPAL:
        if (!payment.externalId) {
          return createErrorResponse('PayPal order ID not found', 400)
        }

        try {
          captureResult = await paypalProvider.captureOrder(payment.externalId)
          
          // Check capture status
          const captureStatus = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.status
          if (captureStatus === 'COMPLETED') {
            newStatus = PaymentStatus.COMPLETED
            message = 'PayPal payment captured successfully'
          } else {
            newStatus = PaymentStatus.PROCESSING
            message = `PayPal capture status: ${captureStatus}`
          }
        } catch (error) {
          logger.error('PayPal capture failed', { orderId, error })
          return createErrorResponse('Failed to capture PayPal payment', 500)
        }
        break

      case PaymentProvider.STRIPE:
        if (!payment.externalId) {
          return createErrorResponse('Stripe payment intent ID not found', 400)
        }

        try {
          captureResult = await stripeProvider.capturePaymentIntent(payment.externalId)
          
          if (captureResult.status === 'succeeded') {
            newStatus = PaymentStatus.COMPLETED
            message = 'Stripe payment captured successfully'
          } else {
            newStatus = PaymentStatus.PROCESSING
            message = `Stripe capture status: ${captureResult.status}`
          }
        } catch (error) {
          logger.error('Stripe capture failed', { orderId, error })
          return createErrorResponse('Failed to capture Stripe payment', 500)
        }
        break

      default:
        return createErrorResponse(
          `Manual capture not supported for provider: ${payment.provider}`,
          400
        )
    }

    // Update payment status in database
    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt: newStatus === PaymentStatus.COMPLETED ? new Date() : null,
        providerData: {
          ...(payment.providerData as object || {}),
          captureResult,
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
        eventType: newStatus === PaymentStatus.COMPLETED 
          ? PaymentEventType.COMPLETED 
          : PaymentEventType.PROCESSING,
        status: newStatus,
        message,
        data: captureResult,
      },
    })

    logger.info('Payment captured', {
      paymentId: payment.id,
      orderId,
      provider: payment.provider,
      status: newStatus,
    })

    return createSuccessResponse({
      orderId: updatedPayment.orderId,
      status: updatedPayment.status,
      amount: updatedPayment.amount,
      currency: updatedPayment.currency,
      paidAt: updatedPayment.paidAt,
      captureResult,
      message,
    })

  } catch (error) {
    logger.error('Payment capture API error', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

export const POST = createAuthenticatedHandler(handleCapturePayment)

export async function GET(_request: NextRequest) {
  return NextResponse.json({ message: 'Payment capture endpoint' })
}
