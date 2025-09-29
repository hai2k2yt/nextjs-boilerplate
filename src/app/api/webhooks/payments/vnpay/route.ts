import { NextRequest, NextResponse } from 'next/server'
import { vnPayProvider } from '@/lib/payments/providers/vnpay'
import { db } from '@/server/db'
import { PaymentStatus, PaymentEventType } from '@prisma/client'
import { PaymentProvider } from '@/lib/enums/payment-methods'
import { logger } from '@/lib/logger'
import { vnpayWebhookSchema } from '@/lib/validations/payment'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    logger.info('VNPay webhook received', body)

    // Validate webhook data
    const validatedData = vnpayWebhookSchema.parse(body)

    // Verify signature
    const isValidSignature = vnPayProvider.verifyIPNSignature(validatedData)
    if (!isValidSignature) {
      logger.error('Invalid VNPay webhook signature')
      return NextResponse.json(
        { RspCode: '97', Message: 'Invalid signature' },
        { status: 400 }
      )
    }

    const {
      vnp_TxnRef: orderId,
      vnp_ResponseCode: responseCode,
      vnp_TransactionNo: transactionNo,
      vnp_Amount: amount,
      vnp_OrderInfo: orderInfo,
      vnp_PayDate: payDate,
      vnp_BankCode: bankCode,
      vnp_CardType: cardType,
      vnp_TransactionStatus: transactionStatus,
    } = validatedData

    // Find the payment in database
    const payment = await db.payment.findFirst({
      where: {
        orderId: orderId,
        provider: PaymentProvider.VNPAY,
      },
    })

    if (!payment) {
      logger.error('Payment not found for orderId', { orderId })
      return NextResponse.json(
        { RspCode: '01', Message: 'Order not found' },
        { status: 200 }
      )
    }

    // Process payment result
    const result = vnPayProvider.processPaymentResult(responseCode)
    
    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: result.status as PaymentStatus,
        externalId: transactionNo,
        paidAt: result.success ? new Date() : null,
        errorCode: result.success ? null : responseCode,
        errorMessage: result.success ? null : result.message,
        providerData: {
          vnp_ResponseCode: responseCode,
          vnp_TransactionNo: transactionNo,
          vnp_Amount: amount,
          vnp_OrderInfo: orderInfo,
          vnp_PayDate: payDate,
          vnp_BankCode: bankCode,
          vnp_CardType: cardType,
          vnp_TransactionStatus: transactionStatus,
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
        message: `VNPay webhook: ${result.message}`,
        data: validatedData,
      },
    })

    logger.info('VNPay payment updated', {
      paymentId: payment.id,
      status: result.status,
      success: result.success,
    })

    // Return success response to VNPay
    return NextResponse.json({
      RspCode: '00',
      Message: 'success',
    })

  } catch (error) {
    logger.error('VNPay webhook error', error)
    return NextResponse.json(
      { RspCode: '99', Message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({ message: 'VNPay webhook endpoint' })
}
