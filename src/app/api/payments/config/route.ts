import { NextRequest, NextResponse } from 'next/server'
import { stripeProvider } from '@/lib/payments/providers/stripe'
import { paypalProvider } from '@/lib/payments/providers/paypal'
import { vietQRProvider } from '@/lib/payments/providers/vietqr'
import { PaymentMethodAPI } from '@/lib/enums/payment-methods'

export async function GET(_request: NextRequest) {
  try {
    // Get supported banks for VietQR
    let vietQRBanks = []
    try {
      vietQRBanks = await vietQRProvider.getSupportedBanks()
    } catch (error) {
      console.warn('Failed to fetch VietQR banks, using fallback:', error)
      vietQRBanks = vietQRProvider.getPopularBanks()
    }

    const config = {
      stripe: {
        publishableKey: stripeProvider.getPublishableKey(),
      },
      paypal: {
        clientId: paypalProvider.getClientId(),
      },
      vietqr: {
        banks: vietQRBanks.slice(0, 20), // Limit to top 20 banks
      },
      currencies: {
        VND: {
          code: 'VND',
          symbol: '₫',
          name: 'Vietnamese Dong',
          decimals: 0,
        },
        USD: {
          code: 'USD',
          symbol: '$',
          name: 'US Dollar',
          decimals: 2,
        },
        EUR: {
          code: 'EUR',
          symbol: '€',
          name: 'Euro',
          decimals: 2,
        },
        GBP: {
          code: 'GBP',
          symbol: '£',
          name: 'British Pound',
          decimals: 2,
        },
      },
      paymentMethods: {
        vietnamese: [
          {
            id: PaymentMethodAPI.MOMO,
            name: 'MoMo',
            type: 'mobile_wallet',
            currencies: ['VND'],
            minAmount: 10000,
            maxAmount: 50000000,
            processingTime: 'instant',
            fees: { percentage: 0, fixed: 0 },
          },
          {
            id: PaymentMethodAPI.ZALOPAY,
            name: 'ZaloPay',
            type: 'mobile_wallet',
            currencies: ['VND'],
            minAmount: 1000,
            maxAmount: 100000000,
            processingTime: 'instant',
            fees: { percentage: 0, fixed: 0 },
          },
          {
            id: PaymentMethodAPI.VNPAY,
            name: 'VNPay',
            type: 'gateway',
            currencies: ['VND'],
            minAmount: 10000,
            maxAmount: 500000000,
            processingTime: '1-3 minutes',
            fees: { percentage: 1.5, fixed: 0 },
          },
          {
            id: PaymentMethodAPI.VIETQR,
            name: 'VietQR',
            type: 'bank_transfer',
            currencies: ['VND'],
            minAmount: 1000,
            maxAmount: 999999999,
            processingTime: 'instant',
            fees: { percentage: 0, fixed: 0 },
          },
        ],
        international: [
          {
            id: PaymentMethodAPI.PAYPAL,
            name: 'PayPal',
            type: 'digital_wallet',
            currencies: ['USD', 'EUR', 'GBP'],
            minAmount: 0.01,
            maxAmount: 10000,
            processingTime: 'instant',
            fees: { percentage: 2.9, fixed: 0.30 },
          },
          {
            id: PaymentMethodAPI.STRIPE,
            name: 'Stripe',
            type: 'credit_card',
            currencies: ['USD', 'EUR', 'GBP'],
            minAmount: 0.50,
            maxAmount: 999999.99,
            processingTime: '1-2 business days',
            fees: { percentage: 2.9, fixed: 0.30 },
          },
        ],
      },
    }

    return NextResponse.json({
      success: true,
      data: config,
    })

  } catch (error) {
    console.error('Payment config API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
