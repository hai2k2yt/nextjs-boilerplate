import axios from 'axios'
import { PAYMENT_CONFIG } from '@/lib/config/payment'

export interface VietQRGenerateRequest {
  accountNo: string
  accountName: string
  acqId: string
  amount: number
  addInfo: string
  format?: string
  template?: string
}

export interface VietQRGenerateResponse {
  code: string
  desc: string
  data?: {
    qrCode: string
    qrDataURL: string
  }
}

export interface VietQRBankInfo {
  id: string
  name: string
  code: string
  bin: string
  shortName: string
  logo: string
  transferSupported: number
  lookupSupported: number
  short_name: string
  support: number
  isTransfer: number
  swift_code: string
}

export interface VietQRBanksResponse {
  code: string
  desc: string
  data: VietQRBankInfo[]
}

export class VietQRPaymentProvider {
  private clientId: string
  private apiKey: string
  private endpoint: string

  constructor() {
    this.clientId = PAYMENT_CONFIG.vietqr.clientId
    this.apiKey = PAYMENT_CONFIG.vietqr.apiKey
    this.endpoint = PAYMENT_CONFIG.vietqr.endpoint
  }

  /**
   * Get authorization headers
   */
  private getHeaders() {
    return {
      'x-client-id': this.clientId,
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Generate VietQR code
   */
  async generateQRCode(params: {
    bankId: string
    accountNo: string
    accountName: string
    amount: number
    description: string
    template?: string
  }): Promise<VietQRGenerateResponse> {
    const {
      bankId,
      accountNo,
      accountName,
      amount,
      description,
      template = 'compact',
    } = params

    const requestBody: VietQRGenerateRequest = {
      accountNo,
      accountName,
      acqId: bankId,
      amount,
      addInfo: description,
      format: 'text',
      template,
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/v2/generate`,
        requestBody,
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      )

      return response.data as VietQRGenerateResponse
    } catch (error) {
      console.error('VietQR generation failed:', error)
      throw new Error('Failed to generate VietQR code')
    }
  }

  /**
   * Get list of supported banks
   */
  async getSupportedBanks(): Promise<VietQRBankInfo[]> {
    try {
      const response = await axios.get(`${this.endpoint}/v2/banks`, {
        headers: this.getHeaders(),
        timeout: 30000,
      })

      const result = response.data as VietQRBanksResponse
      if (result.code === '00' && result.data) {
        return result.data
      }

      throw new Error('Failed to fetch banks list')
    } catch (error) {
      console.error('VietQR banks fetch failed:', error)
      throw new Error('Failed to fetch supported banks')
    }
  }

  /**
   * Verify bank account information
   */
  async verifyBankAccount(params: {
    bankId: string
    accountNo: string
  }): Promise<{
    valid: boolean
    accountName?: string
    message: string
  }> {
    const { bankId, accountNo } = params

    try {
      const response = await axios.post(
        `${this.endpoint}/v2/lookup`,
        {
          bin: bankId,
          accountNumber: accountNo,
        },
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      )

      const result = response.data
      if (result.code === '00' && result.data) {
        return {
          valid: true,
          accountName: result.data.accountName,
          message: 'Account verified successfully',
        }
      }

      return {
        valid: false,
        message: result.desc || 'Account verification failed',
      }
    } catch (error) {
      console.error('VietQR account verification failed:', error)
      return {
        valid: false,
        message: 'Failed to verify bank account',
      }
    }
  }



  /**
   * Check payment status (manual verification)
   * Note: VietQR doesn't provide automatic payment verification
   * This would typically require manual confirmation or integration with bank APIs
   */
  async checkPaymentStatus(_params: {
    bankId: string
    accountNo: string
    amount: number
    transferContent: string
    fromTime: Date
    toTime: Date
  }): Promise<{
    found: boolean
    transactions?: any[]
    message: string
  }> {
    // This is a placeholder - actual implementation would require:
    // 1. Integration with specific bank APIs
    // 2. Manual verification system
    // 3. Third-party payment verification services

    return {
      found: false,
      message: 'Manual verification required for VietQR payments',
    }
  }

  /**
   * Get popular Vietnamese banks for VietQR
   */
  getPopularBanks(): Array<{ id: string; name: string; shortName: string }> {
    return [
      { id: '970415', name: 'Vietinbank', shortName: 'VTB' },
      { id: '970418', name: 'BIDV', shortName: 'BIDV' },
      { id: '970436', name: 'Vietcombank', shortName: 'VCB' },
      { id: '970422', name: 'Military Bank', shortName: 'MB' },
      { id: '970407', name: 'Techcombank', shortName: 'TCB' },
      { id: '970432', name: 'VPBank', shortName: 'VPB' },
      { id: '970405', name: 'Agribank', shortName: 'AGB' },
      { id: '970448', name: 'OCB', shortName: 'OCB' },
      { id: '970454', name: 'VIB', shortName: 'VIB' },
      { id: '970429', name: 'Sacombank', shortName: 'STB' },
      { id: '970403', name: 'Saigonbank', shortName: 'SGB' },
      { id: '970437', name: 'HDBank', shortName: 'HDB' },
      { id: '970441', name: 'VietBank', shortName: 'VBB' },
      { id: '970443', name: 'SHB', shortName: 'SHB' },
      { id: '970431', name: 'Eximbank', shortName: 'EIB' },
      { id: '970426', name: 'MSB', shortName: 'MSB' },
      { id: '970414', name: 'Oceanbank', shortName: 'OJB' },
      { id: '970408', name: 'GPBank', shortName: 'GPB' },
      { id: '970440', name: 'SeABank', shortName: 'SEAB' },
      { id: '970438', name: 'BacABank', shortName: 'BAB' },
    ]
  }
}

export const vietQRProvider = new VietQRPaymentProvider()
