import { NextRequest, NextResponse } from 'next/server'
import { stripeProvider } from '@/lib/payments/providers/stripe'
import { db } from '@/server/db'
import { PaymentStatus, PaymentEventType } from '@prisma/client'
import { PaymentProvider } from '@/lib/enums/payment-methods'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      logger.error('Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event
    try {
      event = stripeProvider.verifyWebhookSignature(body, signature)
    } catch (error) {
      logger.error('Invalid Stripe webhook signature', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    logger.info('Stripe webhook received', { eventType: event.type, eventId: event.id })

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object)
        break
      case 'payment_intent.processing':
        await handlePaymentIntentProcessing(event.data.object)
        break
      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object)
        break
      default:
        logger.warn('Unhandled Stripe event type', { eventType: event.type })
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    logger.error('Stripe webhook error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const orderId = paymentIntent.metadata?.orderId

  if (!orderId) {
    logger.error('No orderId in payment intent metadata')
    return
  }

  const payment = await db.payment.findFirst({
    where: {
      orderId: orderId,
      provider: PaymentProvider.STRIPE,
    },
  })

  if (!payment) {
    logger.error('Payment not found for orderId', { orderId })
    return
  }

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.COMPLETED,
      externalId: paymentIntent.id,
      paidAt: new Date(),
      providerData: {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
        charges: paymentIntent.charges,
      },
      updatedAt: new Date(),
    },
  })

  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: PaymentEventType.COMPLETED,
      status: PaymentStatus.COMPLETED,
      message: 'Stripe payment succeeded',
      data: paymentIntent,
    },
  })

  logger.info('Stripe payment succeeded', { paymentId: payment.id })
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  const orderId = paymentIntent.metadata?.orderId

  if (!orderId) {
    logger.error('No orderId in payment intent metadata')
    return
  }

  const payment = await db.payment.findFirst({
    where: {
      orderId: orderId,
      provider: PaymentProvider.STRIPE,
    },
  })

  if (!payment) {
    logger.error('Payment not found for orderId', { orderId })
    return
  }

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.FAILED,
      externalId: paymentIntent.id,
      errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
      providerData: {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        lastPaymentError: paymentIntent.last_payment_error,
      },
      updatedAt: new Date(),
    },
  })

  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: PaymentEventType.FAILED,
      status: PaymentStatus.FAILED,
      message: 'Stripe payment failed',
      data: paymentIntent,
    },
  })

  logger.info('Stripe payment failed', { paymentId: payment.id })
}

async function handlePaymentIntentCanceled(paymentIntent: any) {
  const orderId = paymentIntent.metadata?.orderId

  if (!orderId) return

  const payment = await db.payment.findFirst({
    where: { orderId, provider: PaymentProvider.STRIPE },
  })

  if (!payment) return

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.CANCELLED,
      externalId: paymentIntent.id,
      providerData: { paymentIntentId: paymentIntent.id, status: paymentIntent.status },
      updatedAt: new Date(),
    },
  })

  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: PaymentEventType.CANCELLED,
      status: PaymentStatus.CANCELLED,
      message: 'Stripe payment canceled',
      data: paymentIntent,
    },
  })
}

async function handlePaymentIntentProcessing(paymentIntent: any) {
  const orderId = paymentIntent.metadata?.orderId

  if (!orderId) return

  const payment = await db.payment.findFirst({
    where: { orderId, provider: PaymentProvider.STRIPE },
  })

  if (!payment) return

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.PROCESSING,
      externalId: paymentIntent.id,
      providerData: { paymentIntentId: paymentIntent.id, status: paymentIntent.status },
      updatedAt: new Date(),
    },
  })

  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: PaymentEventType.PROCESSING,
      status: PaymentStatus.PROCESSING,
      message: 'Stripe payment processing',
      data: paymentIntent,
    },
  })
}

async function handlePaymentIntentRequiresAction(paymentIntent: any) {
  const orderId = paymentIntent.metadata?.orderId

  if (!orderId) return

  const payment = await db.payment.findFirst({
    where: { orderId, provider: PaymentProvider.STRIPE },
  })

  if (!payment) return

  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: PaymentEventType.WEBHOOK,
      status: PaymentStatus.PENDING,
      message: 'Stripe payment requires action',
      data: paymentIntent,
    },
  })
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({ message: 'Stripe webhook endpoint' })
}
