import axios from 'axios'
import { PAYMENT_CONFIG } from '@/lib/config/payment'

export interface PayPalAccessTokenResponse {
  scope: string
  access_token: string
  token_type: string
  app_id: string
  expires_in: number
  nonce: string
}

export interface PayPalOrderRequest {
  intent: 'CAPTURE' | 'AUTHORIZE'
  purchase_units: Array<{
    reference_id?: string
    amount: {
      currency_code: string
      value: string
    }
    description?: string
    custom_id?: string
    invoice_id?: string
  }>
  payment_source?: any
  application_context?: {
    return_url?: string
    cancel_url?: string
    brand_name?: string
    locale?: string
    landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE'
    shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS'
    user_action?: 'CONTINUE' | 'PAY_NOW'
  }
}

export interface PayPalOrderResponse {
  id: string
  status: string
  links: Array<{
    href: string
    rel: string
    method: string
  }>
  create_time: string
  update_time: string
}

export interface PayPalWebhookEvent {
  id: string
  event_type: string
  resource_type: string
  resource: any
  create_time: string
  event_version: string
}

export class PayPalPaymentProvider {
  private clientId: string
  private clientSecret: string
  private baseUrl: string
  private webhookId: string
  private accessToken?: string
  private tokenExpiry?: number

  constructor() {
    this.clientId = PAYMENT_CONFIG.paypal.clientId
    this.clientSecret = PAYMENT_CONFIG.paypal.clientSecret
    this.baseUrl = PAYMENT_CONFIG.paypal.baseUrl
    this.webhookId = PAYMENT_CONFIG.paypal.webhookId
  }

  /**
   * Get access token from PayPal
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        }
      )

      const data = response.data as PayPalAccessTokenResponse
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 minute early

      return this.accessToken
    } catch (error) {
      console.error('PayPal access token request failed:', error)
      throw new Error('Failed to get PayPal access token')
    }
  }

  /**
   * Get authorization headers
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const accessToken = await this.getAccessToken()
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'PayPal-Request-Id': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  /**
   * Create PayPal order
   */
  async createOrder(params: {
    amount: number
    currency: string
    orderId: string
    description?: string
    returnUrl?: string
    cancelUrl?: string
  }): Promise<PayPalOrderResponse> {
    const {
      amount,
      currency,
      orderId,
      description,
      returnUrl = PAYMENT_CONFIG.urls.success,
      cancelUrl = PAYMENT_CONFIG.urls.cancel,
    } = params

    const orderRequest: PayPalOrderRequest = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2),
          },
          description: description || `Payment for order ${orderId}`,
          custom_id: orderId,
          invoice_id: orderId,
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        brand_name: 'Your Store',
        locale: 'en-US',
        landing_page: 'NO_PREFERENCE',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    }

    try {
      const headers = await this.getHeaders()
      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        orderRequest,
        {
          headers,
          timeout: 30000,
        }
      )

      return response.data as PayPalOrderResponse
    } catch (error) {
      console.error('PayPal order creation failed:', error)
      throw new Error('Failed to create PayPal order')
    }
  }

  /**
   * Capture PayPal order
   */
  async captureOrder(orderId: string): Promise<any> {
    try {
      const headers = await this.getHeaders()
      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers,
          timeout: 30000,
        }
      )

      return response.data
    } catch (error) {
      console.error('PayPal order capture failed:', error)
      throw new Error('Failed to capture PayPal order')
    }
  }

  /**
   * Get PayPal order details
   */
  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const headers = await this.getHeaders()
      const response = await axios.get(
        `${this.baseUrl}/v2/checkout/orders/${orderId}`,
        {
          headers,
          timeout: 30000,
        }
      )

      return response.data
    } catch (error) {
      console.error('PayPal order details fetch failed:', error)
      throw new Error('Failed to get PayPal order details')
    }
  }

  /**
   * Create refund
   */
  async createRefund(params: {
    captureId: string
    amount?: number
    currency?: string
    note?: string
  }): Promise<any> {
    const { captureId, amount, currency, note } = params

    const refundRequest: any = {
      note_to_payer: note || 'Refund processed',
    }

    if (amount && currency) {
      refundRequest.amount = {
        value: amount.toFixed(2),
        currency_code: currency.toUpperCase(),
      }
    }

    try {
      const headers = await this.getHeaders()
      const response = await axios.post(
        `${this.baseUrl}/v2/payments/captures/${captureId}/refund`,
        refundRequest,
        {
          headers,
          timeout: 30000,
        }
      )

      return response.data
    } catch (error) {
      console.error('PayPal refund creation failed:', error)
      throw new Error('Failed to create PayPal refund')
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(params: {
    headers: Record<string, string>
    body: string
  }): Promise<boolean> {
    const { headers, body } = params

    const verificationData = {
      auth_algo: headers['paypal-auth-algo'],
      cert_id: headers['paypal-cert-id'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: this.webhookId,
      webhook_event: JSON.parse(body),
    }

    try {
      const authHeaders = await this.getHeaders()
      const response = await axios.post(
        `${this.baseUrl}/v1/notifications/verify-webhook-signature`,
        verificationData,
        {
          headers: authHeaders,
          timeout: 30000,
        }
      )

      return response.data.verification_status === 'SUCCESS'
    } catch (error) {
      console.error('PayPal webhook verification failed:', error)
      return false
    }
  }

  /**
   * Get client ID for client-side integration
   */
  getClientId(): string {
    return this.clientId
  }
}

export const paypalProvider = new PayPalPaymentProvider()
