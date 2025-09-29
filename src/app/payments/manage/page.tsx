'use client'

import { useState, useEffect } from 'react'
import { PaymentManagementDashboard } from '@/components/payments/payment-management-dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PaymentStatus as PrismaPaymentStatus } from '@prisma/client'

interface Payment {
  id: string
  orderId: string
  amount: number
  currency: string
  status: PrismaPaymentStatus
  paymentMethod: string
  provider: string
  description?: string
  paidAt?: string
  createdAt: string
  externalId?: string
  events: Array<{
    id: string
    eventType: string
    status: string
    message: string
    createdAt: string
  }>
}

export default function PaymentManagePage() {
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/payments/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch payments')
      }

      const result = await response.json()
      setPayments(result.data?.payments || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payments'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading && payments.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading payments...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && payments.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <PaymentManagementDashboard
        payments={payments}
        onRefresh={fetchPayments}
        isLoading={isLoading}
      />
    </div>
  )
}
