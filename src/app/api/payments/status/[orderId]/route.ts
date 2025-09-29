
import { paymentService } from '@/lib/payments/payment-service'
import { momoProvider } from '@/lib/payments/providers/momo'
import { zaloPayProvider } from '@/lib/payments/providers/zalopay'
import { vnPayProvider } from '@/lib/payments/providers/vnpay'
import { stripeProvider } from '@/lib/payments/providers/stripe'
import { paypalProvider } from '@/lib/payments/providers/paypal'
import { db } from '@/server/db'
import { PaymentStatus, PaymentEventType } from '@prisma/client'
import { PaymentProvider } from '@/lib/enums/payment-methods'
import {
  createAuthenticatedHandler,
  createSuccessResponse,
  createErrorResponse,
  AuthenticatedRequest
} from '@/lib/middleware/auth'



// Create the GET handler with resource ownership middleware
export const GET = createAuthenticatedHandler(
  async (request: AuthenticatedRequest, { params }: { params: Promise<{ orderId: string }> }) => {
    try {
      const { orderId } = await params

      // Get payment from database
      const payment = await paymentService.getPaymentByOrderId(orderId)

      if (!payment) {
        return createErrorResponse('Payment not found', 404)
      }

      // Check if user owns the payment
      if (payment.userId !== request.user.id) {
        return createErrorResponse('Forbidden', 403)
      }

      // If payment is already completed or failed, return current status
      if (payment.status === PaymentStatus.COMPLETED ||
          payment.status === PaymentStatus.FAILED ||
          payment.status === PaymentStatus.CANCELLED ||
          payment.status === PaymentStatus.REFUNDED) {
        return createSuccessResponse({
          orderId: payment.orderId,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          paidAt: payment.paidAt,
          externalId: payment.externalId,
          events: payment.events,
        })
      }

      // Query payment status from provider
      let providerStatus: unknown = null
      try {
        switch (payment.provider) {
          case PaymentProvider.MOMO:
            providerStatus = await momoProvider.queryPaymentStatus(orderId)
            break
          case PaymentProvider.ZALOPAY:
            const appTransId = payment.providerData?.app_trans_id ||
                             `${new Date().toISOString().slice(2, 10).replace(/-/g, '')}_${orderId}`
            providerStatus = await zaloPayProvider.queryPaymentStatus(appTransId)
            break
          case PaymentProvider.VNPAY:
            if (payment.providerData?.vnp_CreateDate) {
              providerStatus = await vnPayProvider.queryPaymentStatus({
                orderId,
                transactionDate: payment.providerData.vnp_CreateDate,
              })
            }
            break
          case PaymentProvider.STRIPE:
            if (payment.externalId) {
              providerStatus = await stripeProvider.retrievePaymentIntent(payment.externalId)
            }
            break
          case PaymentProvider.PAYPAL:
            if (payment.externalId) {
              providerStatus = await paypalProvider.getOrderDetails(payment.externalId)
            }
            break
        }
      } catch (error) {
        console.error(`Failed to query ${payment.provider} status:`, error)
      }

      // Update payment status if provider returned new information
      let updatedPayment = payment
      if (providerStatus) {
        const statusUpdate = processProviderStatus(payment.provider, providerStatus)

        if (statusUpdate && statusUpdate.status !== payment.status) {
          updatedPayment = await db.payment.update({
            where: { id: payment.id },
            data: {
              status: statusUpdate.status,
              paidAt: statusUpdate.paidAt,
              errorMessage: statusUpdate.errorMessage,
              providerData: {
                ...payment.providerData,
                latestQuery: providerStatus,
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
              eventType: PaymentEventType.WEBHOOK,
              status: statusUpdate.status,
              message: `Status updated from provider query: ${statusUpdate.message}`,
              data: providerStatus,
            },
          })
        }
      }

      return createSuccessResponse({
        orderId: updatedPayment.orderId,
        status: updatedPayment.status,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        paymentMethod: updatedPayment.paymentMethod,
        paidAt: updatedPayment.paidAt,
        externalId: updatedPayment.externalId,
        events: updatedPayment.events,
        providerStatus,
      })
    } catch (error) {
      console.error('Payment status API error:', error)
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      )
    }
  }
)

function processProviderStatus(provider: string, providerStatus: unknown): {
  status: PaymentStatus
  paidAt?: Date
  errorMessage?: string
  message: string
} | null {
  if (!providerStatus || typeof providerStatus !== 'object') {
    return null
  }

  const status = providerStatus as Record<string, unknown>

  switch (provider) {
    case PaymentProvider.MOMO:
      if (status.resultCode === 0) {
        return {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
          message: 'Payment completed successfully',
        }
      } else if (status.resultCode === 1000) {
        return {
          status: PaymentStatus.FAILED,
          errorMessage: 'Payment failed',
          message: 'Payment failed',
        }
      }
      break

    case PaymentProvider.ZALOPAY:
      if (status.return_code === 1) {
        return {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
          message: 'Payment completed successfully',
        }
      } else if (status.return_code === 2) {
        return {
          status: PaymentStatus.FAILED,
          errorMessage: 'Payment failed',
          message: 'Payment failed',
        }
      }
      break

    case PaymentProvider.VNPAY:
      if (status.vnp_ResponseCode === '00') {
        return {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
          message: 'Payment completed successfully',
        }
      } else if (status.vnp_ResponseCode !== '02') { // 02 = pending
        return {
          status: PaymentStatus.FAILED,
          errorMessage: `Payment failed: ${status.vnp_ResponseCode}`,
          message: 'Payment failed',
        }
      }
      break

    case PaymentProvider.STRIPE:
      if (status.status === 'succeeded') {
        return {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
          message: 'Payment completed successfully',
        }
      } else if (status.status === 'canceled') {
        return {
          status: PaymentStatus.CANCELLED,
          message: 'Payment was cancelled',
        }
      } else if (status.status === 'requires_payment_method') {
        return {
          status: PaymentStatus.FAILED,
          errorMessage: 'Payment method required',
          message: 'Payment failed',
        }
      }
      break

    case PaymentProvider.PAYPAL:
      if (status.status === 'COMPLETED') {
        return {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
          message: 'Payment completed successfully',
        }
      } else if (status.status === 'VOIDED') {
        return {
          status: PaymentStatus.CANCELLED,
          message: 'Payment was cancelled',
        }
      }
      break
  }

  return null
}
