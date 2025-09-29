import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { PaymentMethod } from '@prisma/client'

export interface CreatePaymentRequest {
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
  status: string
  paymentUrl?: string
  qrCode?: string
  clientSecret?: string
  externalId?: string
  expiresAt?: string
}

export interface PaymentConfig {
  stripe: {
    publishableKey: string
  }
  paypal: {
    clientId: string
  }
  vietqr: {
    banks: Array<{
      id: string
      name: string
      code: string
      shortName: string
    }>
  }
  currencies: Record<string, {
    code: string
    symbol: string
    name: string
    decimals: number
  }>
  paymentMethods: {
    vietnamese: Array<{
      id: string
      name: string
      type: string
      currencies: string[]
      minAmount: number
      maxAmount: number
      processingTime: string
      fees: { percentage: number; fixed: number }
    }>
    international: Array<{
      id: string
      name: string
      type: string
      currencies: string[]
      minAmount: number
      maxAmount: number
      processingTime: string
      fees: { percentage: number; fixed: number }
    }>
  }
}

export function usePayment() {
  const [currentPayment, setCurrentPayment] = useState<PaymentResponse | null>(null)

  // Fetch payment configuration
  const {
    data: config,
    isLoading: isConfigLoading,
    error: configError,
  } = useQuery<PaymentConfig>({
    queryKey: ['payment-config'],
    queryFn: async () => {
      const response = await fetch('/api/payments/config')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch payment config')
      }
      const result = await response.json()
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (request: CreatePaymentRequest): Promise<PaymentResponse> => {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment')
      }

      const result = await response.json()
      return result.data
    },
    onSuccess: (payment) => {
      setCurrentPayment(payment)
    },
  })

  // Get payment details
  const getPayment = async (paymentId: string) => {
    const response = await fetch(`/api/payments/${paymentId}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch payment')
    }
    const result = await response.json()
    return result.data
  }

  // Helper functions
  const getPaymentMethodConfig = (paymentMethod: PaymentMethod) => {
    if (!config) return null

    const allMethods = [
      ...config.paymentMethods.vietnamese,
      ...config.paymentMethods.international,
    ]

    return allMethods.find(method => method.id === paymentMethod)
  }

  const getCurrencyConfig = (currency: string) => {
    return config?.currencies[currency] || null
  }

  const formatAmount = (amount: number, currency: string) => {
    const currencyConfig = getCurrencyConfig(currency)
    if (!currencyConfig) return amount.toString()

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyConfig.code,
      minimumFractionDigits: currencyConfig.decimals,
      maximumFractionDigits: currencyConfig.decimals,
    }).format(amount)
  }

  const validatePaymentAmount = (amount: number, paymentMethod: PaymentMethod) => {
    const methodConfig = getPaymentMethodConfig(paymentMethod)
    if (!methodConfig) return { valid: false, error: 'Payment method not supported' }

    if (amount < methodConfig.minAmount) {
      return {
        valid: false,
        error: `Minimum amount is ${methodConfig.minAmount}`,
      }
    }

    if (amount > methodConfig.maxAmount) {
      return {
        valid: false,
        error: `Maximum amount is ${methodConfig.maxAmount}`,
      }
    }

    return { valid: true }
  }

  const calculateFees = (amount: number, paymentMethod: PaymentMethod) => {
    const methodConfig = getPaymentMethodConfig(paymentMethod)
    if (!methodConfig) return 0

    const percentageFee = (amount * methodConfig.fees.percentage) / 100
    const totalFee = percentageFee + methodConfig.fees.fixed

    return totalFee
  }

  const redirectToPayment = (paymentUrl: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = paymentUrl
    }
  }

  return {
    // Data
    config,
    currentPayment,
    
    // Loading states
    isConfigLoading,
    isCreatingPayment: createPaymentMutation.isPending,
    
    // Errors
    configError,
    createPaymentError: createPaymentMutation.error,
    
    // Actions
    createPayment: createPaymentMutation.mutateAsync,
    getPayment,
    setCurrentPayment,
    redirectToPayment,
    
    // Helpers
    getPaymentMethodConfig,
    getCurrencyConfig,
    formatAmount,
    validatePaymentAmount,
    calculateFees,
    
    // Reset
    reset: () => {
      setCurrentPayment(null)
      createPaymentMutation.reset()
    },
  }
}
