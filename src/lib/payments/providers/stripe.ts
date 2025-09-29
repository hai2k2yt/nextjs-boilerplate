import Stripe from 'stripe'
import { PAYMENT_CONFIG } from '@/lib/config/payment'

export interface StripePaymentIntentRequest {
  amount: number
  currency: string
  description?: string
  metadata?: Record<string, string>
  paymentMethodTypes?: string[]
  captureMethod?: 'automatic' | 'manual'
  confirmationMethod?: 'automatic' | 'manual'
  returnUrl?: string
}

export interface StripePaymentIntentResponse {
  id: string
  clientSecret: string
  status: string
  amount: number
  currency: string
  paymentMethod?: string
}

export interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: any
  }
  created: number
}

export class StripePaymentProvider {
  private stripe: Stripe
  private webhookSecret: string

  constructor() {
    this.stripe = new Stripe(PAYMENT_CONFIG.stripe.secretKey, {
      apiVersion: '2025-08-27.basil',
    })
    this.webhookSecret = PAYMENT_CONFIG.stripe.webhookSecret
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(params: {
    amount: number
    currency: string
    orderId: string
    description?: string
    customerEmail?: string
    metadata?: Record<string, string>
  }): Promise<StripePaymentIntentResponse> {
    const {
      amount,
      currency,
      orderId,
      description,
      customerEmail,
      metadata = {},
    } = params

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        description: description || `Payment for order ${orderId}`,
        metadata: {
          orderId,
          ...metadata,
        },
        payment_method_types: ['card'],
        capture_method: 'automatic',
        confirmation_method: 'automatic',
        receipt_email: customerEmail,
      })

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method as string,
      }
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error)
      throw new Error('Failed to create Stripe payment intent')
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<StripePaymentIntentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        }
      )

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method as string,
      }
    } catch (error) {
      console.error('Stripe payment confirmation failed:', error)
      throw new Error('Failed to confirm Stripe payment')
    }
  }

  /**
   * Retrieve payment intent
   */
  async retrievePaymentIntent(
    paymentIntentId: string
  ): Promise<StripePaymentIntentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId
      )

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method as string,
      }
    } catch (error) {
      console.error('Stripe payment retrieval failed:', error)
      throw new Error('Failed to retrieve Stripe payment')
    }
  }

  /**
   * Create customer
   */
  async createCustomer(params: {
    email: string
    name?: string
    phone?: string
    metadata?: Record<string, string>
  }): Promise<Stripe.Customer> {
    const { email, name, phone, metadata } = params

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        phone,
        metadata,
      })

      return customer
    } catch (error) {
      console.error('Stripe customer creation failed:', error)
      throw new Error('Failed to create Stripe customer')
    }
  }

  /**
   * Capture payment intent (for manual capture)
   */
  async capturePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(paymentIntentId)
      return paymentIntent
    } catch (error) {
      console.error('Stripe payment intent capture failed:', error)
      throw new Error('Failed to capture Stripe payment intent')
    }
  }

  /**
   * Create refund
   */
  async createRefund(params: {
    paymentIntentId: string
    amount?: number
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
    metadata?: Record<string, string>
  }): Promise<Stripe.Refund> {
    const { paymentIntentId, amount, reason, metadata } = params

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason,
        metadata,
      })

      return refund
    } catch (error) {
      console.error('Stripe refund creation failed:', error)
      throw new Error('Failed to create Stripe refund')
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): StripeWebhookEvent {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      )

      return event as StripeWebhookEvent
    } catch (error) {
      console.error('Stripe webhook verification failed:', error)
      throw new Error('Invalid webhook signature')
    }
  }

  /**
   * Process payment status
   */
  processPaymentStatus(status: string): {
    success: boolean
    status: string
    message: string
  } {
    switch (status) {
      case 'succeeded':
        return {
          success: true,
          status: 'COMPLETED',
          message: 'Payment successful',
        }
      case 'processing':
        return {
          success: false,
          status: 'PROCESSING',
          message: 'Payment is being processed',
        }
      case 'requires_payment_method':
        return {
          success: false,
          status: 'FAILED',
          message: 'Payment method required',
        }
      case 'requires_confirmation':
        return {
          success: false,
          status: 'PENDING',
          message: 'Payment requires confirmation',
        }
      case 'requires_action':
        return {
          success: false,
          status: 'PENDING',
          message: 'Payment requires additional action',
        }
      case 'canceled':
        return {
          success: false,
          status: 'CANCELLED',
          message: 'Payment was cancelled',
        }
      default:
        return {
          success: false,
          status: 'FAILED',
          message: `Payment failed with status: ${status}`,
        }
    }
  }

  /**
   * Get publishable key for client-side
   */
  getPublishableKey(): string {
    return PAYMENT_CONFIG.stripe.publishableKey
  }
}

export const stripeProvider = new StripePaymentProvider()
