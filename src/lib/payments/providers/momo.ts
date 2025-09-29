import crypto from 'crypto'
import axios from 'axios'
import { PAYMENT_CONFIG } from '@/lib/config/payment'

export interface MoMoPaymentRequest {
  orderId: string
  amount: number
  orderInfo: string
  redirectUrl?: string
  ipnUrl?: string
  extraData?: string
  requestType?: string
  signature?: string
  lang?: string
}

export interface MoMoPaymentResponse {
  partnerCode: string
  orderId: string
  requestId: string
  amount: number
  responseTime: number
  message: string
  resultCode: number
  payUrl?: string
  deeplink?: string
  qrCodeUrl?: string
  deeplinkMiniApp?: string
}

export interface MoMoIPNData {
  partnerCode: string
  orderId: string
  requestId: string
  amount: number
  orderInfo: string
  orderType: string
  transId: number
  resultCode: number
  message: string
  payType: string
  responseTime: number
  extraData: string
  signature: string
}

export class MoMoPaymentProvider {
  private partnerCode: string
  private accessKey: string
  private secretKey: string
  private endpoint: string

  constructor() {
    this.partnerCode = PAYMENT_CONFIG.momo.partnerCode
    this.accessKey = PAYMENT_CONFIG.momo.accessKey
    this.secretKey = PAYMENT_CONFIG.momo.secretKey
    this.endpoint = PAYMENT_CONFIG.momo.endpoint
  }

  /**
   * Create MoMo payment signature
   */
  private createSignature(rawData: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(rawData)
      .digest('hex')
  }

  /**
   * Create payment request to MoMo
   */
  async createPayment(params: Omit<MoMoPaymentRequest, 'requestType' | 'signature' | 'lang'>): Promise<MoMoPaymentResponse> {
    const {
      orderId,
      amount,
      orderInfo,
      redirectUrl = PAYMENT_CONFIG.momo.redirectUrl,
      ipnUrl = PAYMENT_CONFIG.momo.ipnUrl,
      extraData = '',
    } = params

    const requestId = orderId
    const requestType = 'payWithMethod'
    const lang = 'vi'

    // Create raw signature string
    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`

    const signature = this.createSignature(rawSignature)

    const requestBody = {
      partnerCode: this.partnerCode,
      partnerName: 'Test',
      storeId: 'MomoTestStore',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      autoCapture: true,
      extraData,
      signature,
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/v2/gateway/api/create`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      )

      return response.data as MoMoPaymentResponse
    } catch (error) {
      console.error('MoMo payment creation failed:', error)
      throw new Error('Failed to create MoMo payment')
    }
  }

  /**
   * Verify MoMo IPN signature
   */
  verifyIPNSignature(ipnData: MoMoIPNData): boolean {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = ipnData

    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`

    const expectedSignature = this.createSignature(rawSignature)

    return signature === expectedSignature
  }

  /**
   * Query payment status from MoMo
   */
  async queryPaymentStatus(orderId: string): Promise<any> {
    const requestId = orderId
    const rawSignature = `accessKey=${this.accessKey}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}`
    const signature = this.createSignature(rawSignature)

    const requestBody = {
      partnerCode: this.partnerCode,
      requestId,
      orderId,
      signature,
      lang: 'vi',
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/v2/gateway/api/query`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      )

      return response.data
    } catch (error) {
      console.error('MoMo payment query failed:', error)
      throw new Error('Failed to query MoMo payment status')
    }
  }

  /**
   * Process MoMo payment result
   */
  processPaymentResult(resultCode: number): {
    success: boolean
    status: string
    message: string
  } {
    switch (resultCode) {
      case 0:
        return {
          success: true,
          status: 'COMPLETED',
          message: 'Payment successful',
        }
      case 9000:
        return {
          success: false,
          status: 'FAILED',
          message: 'Transaction was rejected by user',
        }
      case 8000:
        return {
          success: false,
          status: 'FAILED',
          message: 'Transaction timeout',
        }
      case 7000:
        return {
          success: false,
          status: 'FAILED',
          message: 'Transaction was rejected by system',
        }
      case 1000:
        return {
          success: false,
          status: 'FAILED',
          message: 'Transaction was rejected by issuer',
        }
      default:
        return {
          success: false,
          status: 'FAILED',
          message: `Transaction failed with code: ${resultCode}`,
        }
    }
  }
}

export const momoProvider = new MoMoPaymentProvider()
