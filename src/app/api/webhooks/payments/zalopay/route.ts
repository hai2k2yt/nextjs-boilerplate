import { NextRequest, NextResponse } from 'next/server'
import { zaloPayProvider } from '@/lib/payments/providers/zalopay'
import { db } from '@/server/db'
import { PaymentStatus, PaymentEventType } from '@prisma/client'
import { PaymentProvider } from '@/lib/enums/payment-methods'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    logger.info('ZaloPay webhook received', body)

    // Verify signature
    const isValidSignature = zaloPayProvider.verifyCallbackSignature(body)
    if (!isValidSignature) {
      logger.error('Invalid ZaloPay webhook signature')
      return NextResponse.json(
        { return_code: -1, return_message: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Parse callback data
    const callbackData = JSON.parse(body.data)
    const {
      app_trans_id,
      zp_trans_id,
      amount,
      app_user,
      server_time,
      channel,
      merchant_user_id,
    } = callbackData

    // Extract orderId from app_trans_id (format: YYMMDD_orderId)
    const orderId = app_trans_id.split('_')[1]

    // Find the payment in database
    const payment = await db.payment.findFirst({
      where: {
        orderId: orderId,
        provider: PaymentProvider.ZALOPAY,
      },
    })

    if (!payment) {
      logger.error('Payment not found for orderId', { orderId })
      return NextResponse.json(
        { return_code: 0, return_message: 'Payment not found' },
        { status: 200 }
      )
    }

    // Process payment result (ZaloPay callback means payment is successful)
    const result = zaloPayProvider.processPaymentResult(1) // 1 = success
    
    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: result.status as PaymentStatus,
        externalId: zp_trans_id?.toString(),
        paidAt: result.success ? new Date(server_time) : null,
        providerData: {
          app_trans_id,
          zp_trans_id,
          amount,
          app_user,
          server_time,
          channel,
          merchant_user_id,
        },
        updatedAt: new Date(),
      },
    })

    // Create payment event
    await db.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType: PaymentEventType.WEBHOOK,
        status: result.status as PaymentStatus,
        message: `ZaloPay webhook: Payment successful`,
        data: callbackData,
      },
    })

    logger.info('ZaloPay payment updated', {
      paymentId: payment.id,
      status: result.status,
      success: result.success,
    })

    // Return success response to ZaloPay
    return NextResponse.json({
      return_code: 1,
      return_message: 'success',
    })

  } catch (error) {
    logger.error('ZaloPay webhook error', error)
    return NextResponse.json(
      { return_code: 0, return_message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({ message: 'ZaloPay webhook endpoint' })
}
