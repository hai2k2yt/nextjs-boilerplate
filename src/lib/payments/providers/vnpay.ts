import crypto from 'crypto'
import axios from 'axios'
import moment from 'moment'
import { PAYMENT_CONFIG } from '@/lib/config/payment'

export interface VNPayPaymentRequest {
  vnp_Version: string
  vnp_Command: string
  vnp_TmnCode: string
  vnp_Amount: number
  vnp_CurrCode: string
  vnp_TxnRef: string
  vnp_OrderInfo: string
  vnp_OrderType: string
  vnp_Locale: string
  vnp_ReturnUrl: string
  vnp_IpnUrl: string
  vnp_CreateDate: string
  vnp_ExpireDate?: string
  vnp_BankCode?: string
  vnp_SecureHash: string
}

export interface VNPayIPNData {
  vnp_TmnCode: string
  vnp_Amount: number
  vnp_BankCode: string
  vnp_BankTranNo: string
  vnp_CardType: string
  vnp_OrderInfo: string
  vnp_PayDate: string
  vnp_ResponseCode: string
  vnp_TransactionNo: string
  vnp_TransactionStatus: string
  vnp_TxnRef: string
  vnp_SecureHashType: string
  vnp_SecureHash: string
}

export class VNPayPaymentProvider {
  private tmnCode: string
  private hashSecret: string
  private url: string
  private apiUrl: string

  constructor() {
    this.tmnCode = PAYMENT_CONFIG.vnpay.tmnCode
    this.hashSecret = PAYMENT_CONFIG.vnpay.hashSecret
    this.url = PAYMENT_CONFIG.vnpay.url
    this.apiUrl = PAYMENT_CONFIG.vnpay.apiUrl
  }

  /**
   * Create HMAC SHA512 signature
   */
  private createSignature(data: string): string {
    return crypto
      .createHmac('sha512', this.hashSecret)
      .update(data)
      .digest('hex')
  }

  /**
   * Sort object keys and create query string
   */
  private sortObject(obj: Record<string, string | number>): Record<string, string> {
    const sorted: Record<string, string> = {}
    const keys = Object.keys(obj).sort()
    keys.forEach(key => {
      sorted[key] = String(obj[key])
    })
    return sorted
  }

  /**
   * Create payment URL for VNPay
   */
  createPaymentUrl(params: {
    orderId: string
    amount: number
    orderInfo: string
    bankCode?: string
    locale?: string
    ipAddress?: string
  }): string {
    const {
      orderId,
      amount,
      orderInfo,
      bankCode = '',
      locale = 'vn',
      ipAddress: _ipAddress = '127.0.0.1', // Currently unused but kept for future use
    } = params

    const createDate = moment().format('YYYYMMDDHHmmss')
    const expireDate = moment().add(15, 'minutes').format('YYYYMMDDHHmmss')

    const vnpParams: Omit<VNPayPaymentRequest, 'vnp_SecureHash'> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // VNPay requires amount in VND cents
      vnp_ReturnUrl: PAYMENT_CONFIG.vnpay.returnUrl,
      vnp_IpnUrl: PAYMENT_CONFIG.vnpay.ipnUrl,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
      ...(bankCode && { vnp_BankCode: bankCode }),
    }

    // Sort parameters
    const sortedParams = this.sortObject(vnpParams)

    // Create signature
    const signData = new URLSearchParams(sortedParams).toString()
    const secureHash = this.createSignature(signData)

    // Create final VNPay request with signature
    const vnpRequest = {
      ...sortedParams,
      vnp_SecureHash: secureHash,
    }

    // Build final URL
    const paymentUrl = this.url + '?' + new URLSearchParams(vnpRequest).toString()
    return paymentUrl
  }

  /**
   * Verify VNPay IPN signature
   */
  verifyIPNSignature(ipnData: VNPayIPNData): boolean {
    // Create a copy without the signature fields for verification
    const { vnp_SecureHash: secureHash, vnp_SecureHashType: _vnp_SecureHashType, ...dataForVerification } = ipnData

    const sortedParams = this.sortObject(dataForVerification)
    const signData = new URLSearchParams(sortedParams).toString()
    const expectedHash = this.createSignature(signData)

    return secureHash === expectedHash
  }

  /**
   * Query payment status from VNPay
   */
  async queryPaymentStatus(params: {
    orderId: string
    transactionDate: string
    ipAddress?: string
  }): Promise<unknown> {
    const { orderId, transactionDate, ipAddress = '127.0.0.1' } = params

    const requestData = {
      vnp_RequestId: moment().format('YYYYMMDDHHmmss'),
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode: this.tmnCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Query transaction ${orderId}`,
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
      vnp_IpAddr: ipAddress,
    }

    // Sort and create signature
    const sortedData = this.sortObject(requestData)
    const signData = new URLSearchParams(sortedData).toString()
    const secureHash = this.createSignature(signData)

    const finalData = {
      ...sortedData,
      vnp_SecureHash: secureHash,
    }

    try {
      const response = await axios.post(this.apiUrl, finalData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      })

      return response.data
    } catch (error) {
      console.error('VNPay payment query failed:', error)
      throw new Error('Failed to query VNPay payment status')
    }
  }

  /**
   * Process VNPay payment result
   */
  processPaymentResult(responseCode: string): {
    success: boolean
    status: string
    message: string
  } {
    switch (responseCode) {
      case '00':
        return {
          success: true,
          status: 'COMPLETED',
          message: 'Payment successful',
        }
      case '07':
        return {
          success: false,
          status: 'FAILED',
          message: 'Transaction was deducted successfully. Transaction was suspected of fraud',
        }
      case '09':
        return {
          success: false,
          status: 'FAILED',
          message: 'Customer cancelled transaction',
        }
      case '10':
        return {
          success: false,
          status: 'FAILED',
          message: 'Customer entered wrong information more than 3 times',
        }
      case '11':
        return {
          success: false,
          status: 'FAILED',
          message: 'Payment deadline expired',
        }
      case '12':
        return {
          success: false,
          status: 'FAILED',
          message: 'Customer account is locked',
        }
      case '13':
        return {
          success: false,
          status: 'FAILED',
          message: 'Customer entered wrong OTP',
        }
      case '24':
        return {
          success: false,
          status: 'CANCELLED',
          message: 'Customer cancelled transaction',
        }
      case '51':
        return {
          success: false,
          status: 'FAILED',
          message: 'Customer account does not have enough balance',
        }
      case '65':
        return {
          success: false,
          status: 'FAILED',
          message: 'Customer account has exceeded daily transaction limit',
        }
      default:
        return {
          success: false,
          status: 'FAILED',
          message: `Payment failed with code: ${responseCode}`,
        }
    }
  }

  /**
   * Get supported banks for VNPay
   */
  getSupportedBanks(): Array<{ code: string; name: string }> {
    return [
      { code: 'VNPAYQR', name: 'VNPay QR' },
      { code: 'VNBANK', name: 'Local Bank' },
      { code: 'INTCARD', name: 'International Card' },
      { code: 'VISA', name: 'Visa' },
      { code: 'MASTERCARD', name: 'Mastercard' },
      { code: 'JCB', name: 'JCB' },
      { code: 'UPI', name: 'UnionPay' },
      { code: 'VCB', name: 'Vietcombank' },
      { code: 'TCB', name: 'Techcombank' },
      { code: 'MB', name: 'Military Bank' },
      { code: 'VIB', name: 'VIB' },
      { code: 'ICB', name: 'VietinBank' },
      { code: 'ACB', name: 'ACB' },
      { code: 'TPB', name: 'TPBank' },
      { code: 'BIDV', name: 'BIDV' },
      { code: 'VPB', name: 'VPBank' },
      { code: 'AGRI', name: 'Agribank' },
      { code: 'SCB', name: 'Sacombank' },
      { code: 'SHB', name: 'SHB' },
    ]
  }
}

export const vnPayProvider = new VNPayPaymentProvider()
