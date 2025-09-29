'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  CreditCard,
  RefreshCw,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Eye,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PaymentStatus as PrismaPaymentStatus } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'

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

interface PaymentManagementDashboardProps {
  payments: Payment[]
  onRefresh?: () => void
  isLoading?: boolean
}

export function PaymentManagementDashboard({
  payments,
  onRefresh,
  isLoading = false,
}: PaymentManagementDashboardProps) {
  const { toast } = useToast()
  const [_selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundNote, setRefundNote] = useState('')

  const getStatusIcon = (status: PrismaPaymentStatus) => {
    switch (status) {
      case PrismaPaymentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case PrismaPaymentStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />
      case PrismaPaymentStatus.PROCESSING:
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case PrismaPaymentStatus.FAILED:
        return <XCircle className="h-4 w-4 text-red-500" />
      case PrismaPaymentStatus.CANCELLED:
        return <XCircle className="h-4 w-4 text-gray-500" />
      case PrismaPaymentStatus.REFUNDED:
        return <ArrowLeft className="h-4 w-4 text-purple-500" />
      case PrismaPaymentStatus.PARTIALLY_REFUNDED:
        return <ArrowLeft className="h-4 w-4 text-purple-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: PrismaPaymentStatus) => {
    switch (status) {
      case PrismaPaymentStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200'
      case PrismaPaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case PrismaPaymentStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case PrismaPaymentStatus.FAILED:
        return 'bg-red-100 text-red-800 border-red-200'
      case PrismaPaymentStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case PrismaPaymentStatus.REFUNDED:
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case PrismaPaymentStatus.PARTIALLY_REFUNDED:
        return 'bg-purple-50 text-purple-700 border-purple-100'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const canCapture = (payment: Payment) => {
    return payment.status === PrismaPaymentStatus.PENDING && 
           (payment.provider === 'paypal' || payment.provider === 'stripe')
  }

  const canRefund = (payment: Payment) => {
    return payment.status === PrismaPaymentStatus.COMPLETED
  }

  const handleCapturePayment = async (payment: Payment) => {
    setActionLoading(`capture-${payment.id}`)
    try {
      const response = await fetch(`/api/payments/capture/${payment.orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to capture payment')
      }

      toast({
        title: 'Payment Captured',
        description: result.data.message,
      })

      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Capture Failed',
        description: error instanceof Error ? error.message : 'Failed to capture payment',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefundPayment = async (payment: Payment) => {
    setActionLoading(`refund-${payment.id}`)
    try {
      const refundData: any = {}
      
      if (refundAmount) {
        const amount = parseFloat(refundAmount)
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Invalid refund amount')
        }
        if (amount > payment.amount) {
          throw new Error('Refund amount cannot exceed payment amount')
        }
        refundData.amount = amount
      }

      if (refundReason) refundData.reason = refundReason
      if (refundNote) refundData.note = refundNote

      const response = await fetch(`/api/payments/refund/${payment.orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process refund')
      }

      toast({
        title: 'Refund Processed',
        description: result.data.message,
      })

      // Reset form
      setRefundAmount('')
      setRefundReason('')
      setRefundNote('')
      setSelectedPayment(null)
      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Refund Failed',
        description: error instanceof Error ? error.message : 'Failed to process refund',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Management</h2>
          <p className="text-muted-foreground">
            Manage and process payment transactions
          </p>
        </div>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Payments List */}
      <div className="grid gap-4">
        {payments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No payments found</p>
            </CardContent>
          </Card>
        ) : (
          payments.map((payment) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">
                          Order #{payment.orderId}
                        </CardTitle>
                        <CardDescription>
                          {payment.description || `${payment.paymentMethod} payment`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1">{payment.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Amount</Label>
                      <p className="font-medium">
                        {payment.amount} {payment.currency}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Provider</Label>
                      <p className="font-medium capitalize">{payment.provider}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Created</Label>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Paid At</Label>
                      <p className="font-medium">
                        {payment.paidAt 
                          ? formatDistanceToNow(new Date(payment.paidAt), { addSuffix: true })
                          : 'Not paid'
                        }
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Payment Details</DialogTitle>
                            <DialogDescription>
                              Order #{payment.orderId}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Payment ID</Label>
                                <p className="text-sm font-mono">{payment.id}</p>
                              </div>
                              <div>
                                <Label>External ID</Label>
                                <p className="text-sm font-mono">{payment.externalId || 'N/A'}</p>
                              </div>
                            </div>
                            <div>
                              <Label>Recent Events</Label>
                              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                {payment.events.slice(0, 5).map((event) => (
                                  <div key={event.id} className="text-sm p-2 bg-muted rounded">
                                    <div className="flex justify-between">
                                      <span className="font-medium">{event.eventType}</span>
                                      <span className="text-muted-foreground">
                                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-muted-foreground">{event.message}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="flex items-center space-x-2">
                      {canCapture(payment) && (
                        <Button
                          onClick={() => handleCapturePayment(payment)}
                          disabled={actionLoading === `capture-${payment.id}`}
                          size="sm"
                        >
                          {actionLoading === `capture-${payment.id}` ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <DollarSign className="h-4 w-4 mr-2" />
                          )}
                          Capture
                        </Button>
                      )}

                      {canRefund(payment) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Refund
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Process Refund</DialogTitle>
                              <DialogDescription>
                                Refund payment for Order #{payment.orderId}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  Original amount: {payment.amount} {payment.currency}
                                </AlertDescription>
                              </Alert>

                              <div>
                                <Label htmlFor="refund-amount">
                                  Refund Amount (leave empty for full refund)
                                </Label>
                                <Input
                                  id="refund-amount"
                                  type="number"
                                  step="0.01"
                                  max={payment.amount}
                                  value={refundAmount}
                                  onChange={(e) => setRefundAmount(e.target.value)}
                                  placeholder={`Max: ${payment.amount}`}
                                />
                              </div>

                              <div>
                                <Label htmlFor="refund-reason">Reason</Label>
                                <Select value={refundReason} onValueChange={setRefundReason}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select reason" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="requested_by_customer">Customer Request</SelectItem>
                                    <SelectItem value="duplicate">Duplicate Payment</SelectItem>
                                    <SelectItem value="fraudulent">Fraudulent</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="refund-note">Note (optional)</Label>
                                <Textarea
                                  id="refund-note"
                                  value={refundNote}
                                  onChange={(e) => setRefundNote(e.target.value)}
                                  placeholder="Additional notes..."
                                />
                              </div>

                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayment(null)
                                    setRefundAmount('')
                                    setRefundReason('')
                                    setRefundNote('')
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleRefundPayment(payment)}
                                  disabled={actionLoading === `refund-${payment.id}`}
                                >
                                  {actionLoading === `refund-${payment.id}` ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                  )}
                                  Process Refund
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
