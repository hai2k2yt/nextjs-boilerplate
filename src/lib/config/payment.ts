// Payment Gateway Configuration
export const PAYMENT_CONFIG = {
  // Vietnamese Payment Methods
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE || '',
    accessKey: process.env.MOMO_ACCESS_KEY || '',
    secretKey: process.env.MOMO_SECRET_KEY || '',
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn',
    redirectUrl: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/payments/success',
    ipnUrl: process.env.PAYMENT_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/payments/momo',
  },
  
  zalopay: {
    appId: process.env.ZALOPAY_APP_ID || '',
    key1: process.env.ZALOPAY_KEY1 || '',
    key2: process.env.ZALOPAY_KEY2 || '',
    endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn',
    callbackUrl: process.env.PAYMENT_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/payments/zalopay',
  },
  
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE || '',
    hashSecret: process.env.VNPAY_HASH_SECRET || '',
    url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    apiUrl: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
    returnUrl: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/payments/success',
    ipnUrl: process.env.PAYMENT_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/payments/vnpay',
  },
  
  vietqr: {
    clientId: process.env.VIETQR_CLIENT_ID || '',
    apiKey: process.env.VIETQR_API_KEY || '',
    endpoint: process.env.VIETQR_ENDPOINT || 'https://api.vietqr.io',
  },
  
  // International Payment Methods
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    mode: (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox',
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
    baseUrl: process.env.PAYPAL_MODE === 'live' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com',
  },
  
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  
  // Common URLs
  urls: {
    success: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/payments/success',
    cancel: process.env.PAYMENT_CANCEL_URL || 'http://localhost:3000/payments/cancel',
    webhook: process.env.PAYMENT_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/payments',
  },
}

// Validation function to check if required environment variables are set
export function validatePaymentConfig() {
  const errors: string[] = []
  
  // Check MoMo configuration
  if (!PAYMENT_CONFIG.momo.partnerCode) errors.push('MOMO_PARTNER_CODE is required')
  if (!PAYMENT_CONFIG.momo.accessKey) errors.push('MOMO_ACCESS_KEY is required')
  if (!PAYMENT_CONFIG.momo.secretKey) errors.push('MOMO_SECRET_KEY is required')
  
  // Check ZaloPay configuration
  if (!PAYMENT_CONFIG.zalopay.appId) errors.push('ZALOPAY_APP_ID is required')
  if (!PAYMENT_CONFIG.zalopay.key1) errors.push('ZALOPAY_KEY1 is required')
  if (!PAYMENT_CONFIG.zalopay.key2) errors.push('ZALOPAY_KEY2 is required')
  
  // Check VNPay configuration
  if (!PAYMENT_CONFIG.vnpay.tmnCode) errors.push('VNPAY_TMN_CODE is required')
  if (!PAYMENT_CONFIG.vnpay.hashSecret) errors.push('VNPAY_HASH_SECRET is required')
  
  // Check VietQR configuration
  if (!PAYMENT_CONFIG.vietqr.clientId) errors.push('VIETQR_CLIENT_ID is required')
  if (!PAYMENT_CONFIG.vietqr.apiKey) errors.push('VIETQR_API_KEY is required')
  
  // Check PayPal configuration
  if (!PAYMENT_CONFIG.paypal.clientId) errors.push('PAYPAL_CLIENT_ID is required')
  if (!PAYMENT_CONFIG.paypal.clientSecret) errors.push('PAYPAL_CLIENT_SECRET is required')
  
  // Check Stripe configuration
  if (!PAYMENT_CONFIG.stripe.secretKey) errors.push('STRIPE_SECRET_KEY is required')
  if (!PAYMENT_CONFIG.stripe.publishableKey) errors.push('STRIPE_PUBLISHABLE_KEY is required')
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}




