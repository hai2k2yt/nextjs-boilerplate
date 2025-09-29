import crypto from 'crypto'
import axios from 'axios'
import moment from 'moment'
import { PAYMENT_CONFIG } from '@/lib/config/payment'

export interface ZaloPayPaymentRequest {
  app_id: string
  app_trans_id: string
  app_user: string
  amount: number
  app_time: number
  embed_data: string
  item: string
  description: string
  bank_code?: string
  mac: string
  callback_url?: string
}

export interface ZaloPayPaymentResponse {
  return_code: number
  return_message: string
  sub_return_code: number
  sub_return_message: string
  zp_trans_token?: string
  order_url?: string
  order_token?: string
  qr_code?: string
}

export interface ZaloPayCallbackData {
  data: string
  mac: string
  type: number
}

export class ZaloPayPaymentProvider {
  private appId: string
  private key1: string
  private key2: string
  private endpoint: string

  constructor() {
    this.appId = PAYMENT_CONFIG.zalopay.appId
    this.key1 = PAYMENT_CONFIG.zalopay.key1
    this.key2 = PAYMENT_CONFIG.zalopay.key2
    this.endpoint = PAYMENT_CONFIG.zalopay.endpoint
  }

  private createSignature(data: string, key: string): string {
    return crypto
      .createHmac('sha256', key)
      .update(data)
      .digest('hex')
  }

  private generateAppTransId(orderId: string): string {
    const today = moment().format('YYMMDD')
    return `${today}_${orderId}`
  }

  async createPayment(params: {
    orderId: string
    amount: number
    description: string
    userId?: string
    embedData?: any
    bankCode?: string
  }): Promise<ZaloPayPaymentResponse> {
    const {
      orderId,
      amount,
      description,
      userId = 'user123',
      embedData = {},
      bankCode = '',
    } = params

    const appTransId = this.generateAppTransId(orderId)
    const appTime = Date.now()
    const embedDataStr = JSON.stringify(embedData)
    const item = JSON.stringify([
      {
        itemid: orderId,
        itemname: description,
        itemprice: amount,
        itemquantity: 1,
      },
    ])

    const macData = `${this.appId}|${appTransId}|${userId}|${amount}|${appTime}|${embedDataStr}|${item}`
    const mac = this.createSignature(macData, this.key1)

    const requestBody: ZaloPayPaymentRequest = {
      app_id: this.appId,
      app_trans_id: appTransId,
      app_user: userId,
      amount,
      app_time: appTime,
      embed_data: embedDataStr,
      item,
      description,
      bank_code: bankCode,
      mac,
      callback_url: PAYMENT_CONFIG.zalopay.callbackUrl,
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/v2/create`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        }
      )

      return response.data as ZaloPayPaymentResponse
    } catch (error) {
      console.error('ZaloPay payment creation failed:', error)
      throw new Error('Failed to create ZaloPay payment')
    }
  }

  verifyCallbackSignature(callbackData: ZaloPayCallbackData): boolean {
    const { data, mac } = callbackData
    const expectedMac = this.createSignature(data, this.key2)
    return mac === expectedMac
  }

  async queryPaymentStatus(appTransId: string): Promise<any> {
    const macData = `${this.appId}|${appTransId}|${this.key1}`
    const mac = this.createSignature(macData, this.key1)

    const requestBody = {
      app_id: this.appId,
      app_trans_id: appTransId,
      mac,
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/v2/query`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        }
      )

      return response.data
    } catch (error) {
      console.error('ZaloPay payment query failed:', error)
      throw new Error('Failed to query ZaloPay payment status')
    }
  }

  processPaymentResult(returnCode: number): {
    success: boolean
    status: string
    message: string
  } {
    switch (returnCode) {
      case 1:
        return {
          success: true,
          status: 'COMPLETED',
          message: 'Payment successful',
        }
      case 2:
        return {
          success: false,
          status: 'FAILED',
          message: 'Payment failed',
        }
      case 3:
        return {
          success: false,
          status: 'PENDING',
          message: 'Payment is being processed',
        }
      default:
        return {
          success: false,
          status: 'FAILED',
          message: `Payment failed with code: ${returnCode}`,
        }
    }
  }
}

export const zaloPayProvider = new ZaloPayPaymentProvider()
