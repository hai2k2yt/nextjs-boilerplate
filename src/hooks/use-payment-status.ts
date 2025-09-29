import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PaymentStatus as PrismaPaymentStatus } from '@prisma/client'

export interface PaymentStatus {
  orderId: string
  status: PrismaPaymentStatus
  amount: number
  currency: string
  paymentMethod: string
  paidAt?: string
  externalId?: string
  events: Array<{
    id: string
    eventType: string
    status: string
    message: string
    createdAt: string
    data?: any
  }>
  providerStatus?: any
}

export interface UsePaymentStatusOptions {
  orderId: string
  enabled?: boolean
  pollInterval?: number
  onStatusChange?: (status: PaymentStatus) => void
  onCompleted?: (status: PaymentStatus) => void
  onFailed?: (status: PaymentStatus) => void
}

export function usePaymentStatus({
  orderId,
  enabled = true,
  pollInterval = 3000, // Poll every 3 seconds
  onStatusChange,
  onCompleted,
  onFailed,
}: UsePaymentStatusOptions) {
  const [previousStatus, setPreviousStatus] = useState<PrismaPaymentStatus | null>(null)

  const fetchPaymentStatus = useCallback(async (): Promise<PaymentStatus> => {
    const response = await fetch(`/api/payments/status/${orderId}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch payment status')
    }

    const result = await response.json()
    return result.data
  }, [orderId])

  const {
    data: paymentStatus,
    error,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['payment-status', orderId],
    queryFn: fetchPaymentStatus,
    enabled: enabled && !!orderId,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
    staleTime: 1000, // Consider data stale after 1 second
  })

  // Handle status changes and stop polling for final states
  useEffect(() => {
    if (paymentStatus && paymentStatus.status !== previousStatus) {
      setPreviousStatus(paymentStatus.status)

      // Call status change callback
      onStatusChange?.(paymentStatus)

      // Call specific status callbacks
      if (paymentStatus.status === PrismaPaymentStatus.COMPLETED) {
        onCompleted?.(paymentStatus)
      } else if (paymentStatus.status === PrismaPaymentStatus.FAILED) {
        onFailed?.(paymentStatus)
      }
    }
  }, [paymentStatus, previousStatus, onStatusChange, onCompleted, onFailed])

  const isCompleted = paymentStatus?.status === PrismaPaymentStatus.COMPLETED
  const isFailed = paymentStatus?.status === PrismaPaymentStatus.FAILED
  const isCancelled = paymentStatus?.status === PrismaPaymentStatus.CANCELLED
  const isPending = paymentStatus?.status === PrismaPaymentStatus.PENDING
  const isProcessing = paymentStatus?.status === PrismaPaymentStatus.PROCESSING
  const isExpired = paymentStatus?.status === PrismaPaymentStatus.EXPIRED
  const isRefunded = paymentStatus?.status === PrismaPaymentStatus.REFUNDED
  const isPartiallyRefunded = paymentStatus?.status === PrismaPaymentStatus.PARTIALLY_REFUNDED

  const isFinalState = isCompleted || isFailed || isCancelled || isExpired || isRefunded || isPartiallyRefunded

  return {
    paymentStatus,
    error,
    isLoading,
    isError,
    refetch,
    
    // Status helpers
    isCompleted,
    isFailed,
    isCancelled,
    isPending,
    isProcessing,
    isExpired,
    isRefunded,
    isPartiallyRefunded,
    isFinalState,
    
    // Status display helpers
    statusText: getStatusText(paymentStatus?.status),
    statusColor: getStatusColor(paymentStatus?.status),
    
    // Latest event
    latestEvent: paymentStatus?.events?.[0],
  }
}

function getStatusText(status?: PrismaPaymentStatus): string {
  switch (status) {
    case PrismaPaymentStatus.PENDING:
      return 'Pending Payment'
    case PrismaPaymentStatus.PROCESSING:
      return 'Processing Payment'
    case PrismaPaymentStatus.COMPLETED:
      return 'Payment Completed'
    case PrismaPaymentStatus.FAILED:
      return 'Payment Failed'
    case PrismaPaymentStatus.CANCELLED:
      return 'Payment Cancelled'
    case PrismaPaymentStatus.EXPIRED:
      return 'Payment Expired'
    case PrismaPaymentStatus.REFUNDED:
      return 'Payment Refunded'
    case PrismaPaymentStatus.PARTIALLY_REFUNDED:
      return 'Payment Partially Refunded'
    default:
      return 'Unknown Status'
  }
}

function getStatusColor(status?: PrismaPaymentStatus): string {
  switch (status) {
    case PrismaPaymentStatus.PENDING:
      return 'text-yellow-600'
    case PrismaPaymentStatus.PROCESSING:
      return 'text-blue-600'
    case PrismaPaymentStatus.COMPLETED:
      return 'text-green-600'
    case PrismaPaymentStatus.FAILED:
      return 'text-red-600'
    case PrismaPaymentStatus.CANCELLED:
      return 'text-gray-600'
    case PrismaPaymentStatus.EXPIRED:
      return 'text-orange-600'
    case PrismaPaymentStatus.REFUNDED:
      return 'text-purple-600'
    case PrismaPaymentStatus.PARTIALLY_REFUNDED:
      return 'text-purple-500'
    default:
      return 'text-gray-500'
  }
}
