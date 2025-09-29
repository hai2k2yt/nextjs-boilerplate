import { NextRequest, NextResponse } from 'next/server'
import { momoProvider } from '@/lib/payments/providers/momo'
import { db } from '@/server/db'
import { PaymentStatus, PaymentEventType } from '@prisma/client'
import { PaymentProvider } from '@/lib/enums/payment-methods'
import { logger } from '@/lib/logger'
import { momoWebhookSchema } from '@/lib/validations/payment'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    logger.info('MoMo webhook received', body)

    // Validate webhook data
    const validatedData = momoWebhookSchema.parse(body)

    // Verify signature
    const isValidSignature = momoProvider.verifyIPNSignature(validatedData)
    if (!isValidSignature) {
      console.error('Invalid MoMo webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const {
      orderId,
      resultCode,
      transId,
      amount,
      message,
      responseTime,
      extraData,
    } = validatedData

    // Find the payment in database
    const payment = await db.payment.findFirst({
      where: {
        orderId: orderId,
        provider: PaymentProvider.MOMO,
      },
    })

    if (!payment) {
      console.error('Payment not found for orderId:', orderId)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Process payment result
    const result = momoProvider.processPaymentResult(resultCode)
    
    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: result.status as PaymentStatus,
        externalId: transId?.toString(),
        paidAt: result.success ? new Date() : null,
        errorCode: result.success ? null : resultCode.toString(),
        errorMessage: result.success ? null : message,
        providerData: {
          resultCode,
          transId,
          amount,
          message,
          responseTime,
          extraData,
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
        message: `MoMo webhook: ${message}`,
        data: {
          resultCode,
          transId,
          amount,
          message,
          responseTime,
          extraData,
        },
      },
    })

    logger.info('MoMo payment updated', {
      paymentId: payment.id,
      status: result.status,
      success: result.success,
    })

    // Return success response to MoMo
    return NextResponse.json({
      partnerCode: validatedData.partnerCode,
      orderId: orderId,
      requestId: validatedData.requestId,
      amount: amount,
      responseTime: Date.now(),
      message: 'success',
      resultCode: 0,
    })

  } catch (error) {
    console.error('MoMo webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')
  
  if (challenge) {
    return NextResponse.json({ challenge })
  }
  
  return NextResponse.json({ message: 'MoMo webhook endpoint' })
}
