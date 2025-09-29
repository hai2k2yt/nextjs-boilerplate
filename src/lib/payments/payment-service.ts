import { db } from '@/server/db'
import { PaymentMethod, PaymentStatus, PaymentEventType } from '@prisma/client'
import { momoProvider, MoMoPaymentRequest } from './providers/momo'
import { zaloPayProvider } from './providers/zalopay'
import { vnPayProvider } from './providers/vnpay'
import { vietQRProvider } from './providers/vietqr'
import { stripeProvider } from './providers/stripe'
import { paypalProvider } from './providers/paypal'
import { validatePaymentConfig } from '@/lib/config/payment'
import { PaymentProvider } from '@/lib/enums/payment-methods'
import crypto from 'crypto'

export interface CreatePaymentRequest {
  userId: string
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  description?: string
  metadata?: Record<string, any>
  returnUrl?: string
  cancelUrl?: string
}

export interface PaymentResponse {
  id: string
  orderId: string
  status: PaymentStatus
  paymentUrl?: string
  qrCode?: string
  clientSecret?: string
  externalId?: string
  expiresAt?: Date
}

export class PaymentService {
  constructor() {
    // Validate payment configuration on initialization
    const validation = validatePaymentConfig()
    if (!validation.isValid) {
      console.warn('Payment configuration validation failed:', validation.errors)
    }
  }

  /**
   * Generate unique order ID
   */
  private generateOrderId(): string {
    const timestamp = Date.now().toString()
    const random = crypto.randomBytes(4).toString('hex')
    return `ORDER_${timestamp}_${random}`.toUpperCase()
  }

  /**
   * Convert PaymentMethod enum to PaymentProvider enum
   */
  private getProviderName(paymentMethod: PaymentMethod): PaymentProvider {
    switch (paymentMethod) {
      case PaymentMethod.MOMO:
        return PaymentProvider.MOMO
      case PaymentMethod.ZALOPAY:
        return PaymentProvider.ZALOPAY
      case PaymentMethod.VNPAY:
        return PaymentProvider.VNPAY
      case PaymentMethod.VIETQR:
        return PaymentProvider.VIETQR
      case PaymentMethod.PAYPAL:
        return PaymentProvider.PAYPAL
      case PaymentMethod.STRIPE:
        return PaymentProvider.STRIPE
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`)
    }
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: CreatePaymentRequest): void {
    if (!request.userId) {
      throw new Error('User ID is required')
    }

    if (!request.amount || request.amount <= 0) {
      throw new Error('Amount must be greater than 0')
    }

    if (!request.currency) {
      throw new Error('Currency is required')
    }

    if (!request.paymentMethod) {
      throw new Error('Payment method is required')
    }

    // Validate amount limits based on payment method
    const limits = this.getPaymentMethodLimits(request.paymentMethod)
    if (request.amount < limits.min || request.amount > limits.max) {
      throw new Error(`Amount must be between ${limits.min} and ${limits.max} ${request.currency}`)
    }
  }

  /**
   * Get payment method limits
   */
  private getPaymentMethodLimits(method: PaymentMethod): { min: number; max: number } {
    switch (method) {
      case PaymentMethod.MOMO:
        return { min: 10000, max: 50000000 } // VND
      case PaymentMethod.ZALOPAY:
        return { min: 1000, max: 100000000 } // VND
      case PaymentMethod.VNPAY:
        return { min: 10000, max: 500000000 } // VND
      case PaymentMethod.VIETQR:
        return { min: 1000, max: 999999999 } // VND
      case PaymentMethod.PAYPAL:
        return { min: 0.01, max: 10000 } // USD
      case PaymentMethod.STRIPE:
        return { min: 0.50, max: 999999.99 } // USD
      default:
        return { min: 0, max: Number.MAX_SAFE_INTEGER }
    }
  }

  /**
   * Create payment
   */
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    // Validate request
    this.validatePaymentRequest(request)

    const orderId = this.generateOrderId()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    try {
      // Create payment record in database
      const payment = await db.payment.create({
        data: {
          orderId,
          amount: request.amount,
          currency: request.currency,
          description: request.description || `Payment for order ${orderId}`,
          paymentMethod: request.paymentMethod,
          provider: this.getProviderName(request.paymentMethod),
          status: PaymentStatus.PENDING,
          userId: request.userId,
          returnUrl: request.returnUrl,
          cancelUrl: request.cancelUrl,
          metadata: request.metadata,
          expiresAt,
        },
      })

      // Create payment event
      await db.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType: PaymentEventType.CREATED,
          status: PaymentStatus.PENDING,
          message: 'Payment created',
          data: { orderId, amount: request.amount, currency: request.currency },
        },
      })

      // Process payment with appropriate provider
      let paymentResult: any
      
      switch (request.paymentMethod) {
        case PaymentMethod.MOMO:
          paymentResult = await this.processMoMoPayment(payment, request)
          break
        case PaymentMethod.ZALOPAY:
          paymentResult = await this.processZaloPayPayment(payment, request)
          break
        case PaymentMethod.VNPAY:
          paymentResult = await this.processVNPayPayment(payment, request)
          break
        case PaymentMethod.VIETQR:
          paymentResult = await this.processVietQRPayment(payment, request)
          break
        case PaymentMethod.STRIPE:
          paymentResult = await this.processStripePayment(payment, request)
          break
        case PaymentMethod.PAYPAL:
          paymentResult = await this.processPayPalPayment(payment, request)
          break
        default:
          throw new Error(`Unsupported payment method: ${request.paymentMethod}`)
      }

      // Update payment with provider response
      const updatedPayment = await db.payment.update({
        where: { id: payment.id },
        data: {
          paymentUrl: paymentResult.paymentUrl,
          externalId: paymentResult.externalId,
          providerData: paymentResult.providerData,
          status: paymentResult.status || PaymentStatus.PENDING,
        },
      })

      return {
        id: payment.id,
        orderId: payment.orderId,
        status: updatedPayment.status,
        paymentUrl: paymentResult.paymentUrl,
        qrCode: paymentResult.qrCode,
        clientSecret: paymentResult.clientSecret,
        externalId: paymentResult.externalId,
        expiresAt: payment.expiresAt || undefined,
      }

    } catch (error) {
      console.error('Payment creation failed:', error)
      
      // Update payment status to failed if it was created
      try {
        await db.payment.updateMany({
          where: { orderId },
          data: {
            status: PaymentStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      } catch (updateError) {
        console.error('Failed to update payment status:', updateError)
      }

      throw error
    }
  }

  /**
   * Process MoMo payment
   */
  private async processMoMoPayment(payment: any, request: CreatePaymentRequest) {
    const momoRequest: Omit<MoMoPaymentRequest, 'requestType' | 'signature' | 'lang'> = {
      orderId: payment.orderId,
      amount: request.amount,
      orderInfo: request.description || `Payment for order ${payment.orderId}`,
      redirectUrl: request.returnUrl,
      extraData: JSON.stringify(request.metadata || {}),
    }

    const result = await momoProvider.createPayment(momoRequest)

    if (result.resultCode !== 0) {
      throw new Error(`MoMo payment failed: ${result.message}`)
    }

    return {
      paymentUrl: result.payUrl,
      externalId: result.requestId,
      providerData: result,
      qrCode: result.qrCodeUrl,
    }
  }

  /**
   * Process ZaloPay payment
   */
  private async processZaloPayPayment(payment: any, request: CreatePaymentRequest) {
    const result = await zaloPayProvider.createPayment({
      orderId: payment.orderId,
      amount: request.amount,
      description: request.description || `Payment for order ${payment.orderId}`,
      userId: request.userId,
      embedData: request.metadata || {},
    })

    if (result.return_code !== 1) {
      throw new Error(`ZaloPay payment failed: ${result.return_message}`)
    }

    return {
      paymentUrl: result.order_url,
      externalId: result.zp_trans_token,
      providerData: result,
      qrCode: result.qr_code,
    }
  }

  /**
   * Process VNPay payment
   */
  private async processVNPayPayment(payment: any, request: CreatePaymentRequest) {
    const paymentUrl = vnPayProvider.createPaymentUrl({
      orderId: payment.orderId,
      amount: request.amount,
      orderInfo: request.description || `Payment for order ${payment.orderId}`,
    })

    return {
      paymentUrl,
      externalId: payment.orderId,
      providerData: { paymentUrl },
    }
  }

  /**
   * Process VietQR payment
   */
  private async processVietQRPayment(payment: any, request: CreatePaymentRequest) {
    // For VietQR, we need bank account details from metadata
    const bankId = request.metadata?.bankId || '970415' // Default to Vietinbank
    const accountNo = request.metadata?.accountNo
    const accountName = request.metadata?.accountName

    if (!accountNo || !accountName) {
      throw new Error('Bank account number and name are required for VietQR')
    }

    const result = await vietQRProvider.generateQRCode({
      bankId,
      accountNo,
      accountName,
      amount: request.amount,
      description: request.description || `Payment for order ${payment.orderId}`,
    })

    if (result.code !== '00') {
      throw new Error(`VietQR generation failed: ${result.desc}`)
    }

    return {
      qrCode: result.data?.qrDataURL,
      externalId: payment.orderId,
      providerData: result,
    }
  }

  /**
   * Process Stripe payment
   */
  private async processStripePayment(payment: any, request: CreatePaymentRequest) {
    const result = await stripeProvider.createPaymentIntent({
      amount: request.amount,
      currency: request.currency,
      orderId: payment.orderId,
      description: request.description,
      customerEmail: request.metadata?.email,
      metadata: request.metadata || {},
    })

    return {
      clientSecret: result.clientSecret,
      externalId: result.id,
      providerData: result,
    }
  }

  /**
   * Process PayPal payment
   */
  private async processPayPalPayment(payment: any, request: CreatePaymentRequest) {
    const result = await paypalProvider.createOrder({
      amount: request.amount,
      currency: request.currency,
      orderId: payment.orderId,
      description: request.description,
      returnUrl: request.returnUrl,
      cancelUrl: request.cancelUrl,
    })

    const approvalLink = result.links.find(link => link.rel === 'approve')

    return {
      paymentUrl: approvalLink?.href,
      externalId: result.id,
      providerData: result,
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<any> {
    return await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<any> {
    return await db.payment.findFirst({
      where: { orderId },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  /**
   * Get user payments
   */
  async getUserPayments(userId: string, limit = 10, offset = 0): Promise<any[]> {
    return await db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })
  }
}

export const paymentService = new PaymentService()
