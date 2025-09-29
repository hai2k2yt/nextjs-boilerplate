import { NextRequest, NextResponse } from 'next/server'
import { paypalProvider, PayPalWebhookEvent } from '@/lib/payments/providers/paypal'
import { db } from '@/server/db'
import { PaymentStatus, PaymentEventType } from '@prisma/client'
import { PaymentProvider } from '@/lib/enums/payment-methods'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())
    
    logger.info('PayPal webhook received', { transmissionId: headers['paypal-transmission-id'] })

    // Verify webhook signature
    const isValidSignature = await paypalProvider.verifyWebhookSignature({
      headers,
      body,
    })

    if (!isValidSignature) {
      logger.error('Invalid PayPal webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const event: PayPalWebhookEvent = JSON.parse(body)
    logger.info('PayPal webhook event', { eventType: event.event_type, eventId: event.id })

    // Handle different event types
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(event.resource)
        break
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handleCaptureCompleted(event.resource)
        break
      case 'PAYMENT.CAPTURE.DENIED':
        await handleCaptureDenied(event.resource)
        break
      case 'PAYMENT.CAPTURE.PENDING':
        await handleCapturePending(event.resource)
        break
      case 'CHECKOUT.ORDER.VOIDED':
        await handleOrderVoided(event.resource)
        break
      default:
        logger.warn('Unhandled PayPal event type', { eventType: event.event_type })
    }

    return NextResponse.json({ status: 'SUCCESS' })

  } catch (error) {
    logger.error('PayPal webhook error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleOrderApproved(resource: any) {
  const orderId = resource.purchase_units?.[0]?.custom_id || resource.purchase_units?.[0]?.reference_id

  if (!orderId) {
    logger.error('No orderId in PayPal order resource')
    return
  }

  const payment = await db.payment.findFirst({
    where: {
      orderId: orderId,
      provider: PaymentProvider.PAYPAL,
    },
  })

  if (!payment) {
    logger.error('Payment not found for orderId', { orderId })
    return
  }

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.PENDING,
      externalId: resource.id,
      providerData: {
        paypalOrderId: resource.id,
        status: resource.status,
        intent: resource.intent,
        purchaseUnits: resource.purchase_units,
      },
      updatedAt: new Date(),
    },
  })

  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: PaymentEventType.WEBHOOK,
      status: PaymentStatus.PENDING,
      message: 'PayPal order approved',
      data: resource,
    },
  })

  logger.info('PayPal order approved', { paymentId: payment.id })
}

async function handleCaptureCompleted(resource: any) {
  // Get order ID from the capture resource
  const orderId = resource.custom_id || resource.invoice_id

  if (!orderId) {
    logger.error('No orderId in PayPal capture resource')
    return
  }

  const payment = await db.payment.findFirst({
    where: {
      orderId: orderId,
      provider: PaymentProvider.PAYPAL,
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
      externalId: resource.id,
      paidAt: new Date(resource.create_time),
      providerData: {
        captureId: resource.id,
        status: resource.status,
        amount: resource.amount,
        sellerProtection: resource.seller_protection,
        finalCapture: resource.final_capture,
      },
      updatedAt: new Date(),
    },
  })

  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: PaymentEventType.COMPLETED,
      status: PaymentStatus.COMPLETED,
      message: 'PayPal capture completed',
      data: resource,
    },
  })

  logger.info('PayPal capture completed', { paymentId: payment.id })
}

async function handleCaptureDenied(resource: any) {
  const orderId = resource.custom_id || resource.invoice_id

  if (!orderId) return

  const payment = await db.payment.findFirst({
    where: { orderId, provider: PaymentProvider.PAYPAL },
  })

  if (!payment) return

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.FAILED,
      externalId: resource.id,
      errorMessage: 'PayPal capture denied',
      providerData: {
        captureId: resource.id,
        status: resource.status,
        statusDetails: resource.status_details,
      },
      updatedAt: new Date(),
    },
  })

  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: PaymentEventType.FAILED,
      status: PaymentStatus.FAILED,
      message: 'PayPal capture denied',
      data: resource,
    },
  })
}

async function handleCapturePending(resource: any) {
  const orderId = resource.custom_id || resource.invoice_id

  if (!orderId) return

  const payment = await db.payment.findFirst({
    where: { orderId, provider: PaymentProvider.PAYPAL },
  })

  if (!payment) return

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.PROCESSING,
      externalId: resource.id,
      providerData: {
        captureId: resource.id,
        status: resource.status,
        statusDetails: resource.status_details,
      },
      updatedAt: new Date(),
    },
  })

  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: PaymentEventType.PROCESSING,
      status: PaymentStatus.PROCESSING,
      message: 'PayPal capture pending',
      data: resource,
    },
  })
}

async function handleOrderVoided(resource: any) {
  const orderId = resource.purchase_units?.[0]?.custom_id || resource.purchase_units?.[0]?.reference_id

  if (!orderId) return

  const payment = await db.payment.findFirst({
    where: { orderId, provider: PaymentProvider.PAYPAL },
  })

  if (!payment) return

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.CANCELLED,
      externalId: resource.id,
      providerData: {
        paypalOrderId: resource.id,
        status: resource.status,
      },
      updatedAt: new Date(),
    },
  })

  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: PaymentEventType.CANCELLED,
      status: PaymentStatus.CANCELLED,
      message: 'PayPal order voided',
      data: resource,
    },
  })
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({ message: 'PayPal webhook endpoint' })
}
