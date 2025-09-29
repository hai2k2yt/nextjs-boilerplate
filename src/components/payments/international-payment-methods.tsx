'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  CreditCard,
  Globe,
  AlertCircle,
} from 'lucide-react'
import { usePayment } from '@/hooks/use-payment'
import { usePaymentStatus } from '@/hooks/use-payment-status'
import { PaymentMethod } from '@prisma/client'
import { PaymentMethodLogos } from './payment-icons'
import { PaymentMethodUtils } from '@/lib/enums/payment-methods'
import { PayPalPaymentForm, StripePaymentForm } from './forms'

interface InternationalPaymentMethodsProps {
  selectedMethod: string | null
  onMethodSelect: (method: string) => void
  amount: number
  currency: string
  description?: string
}

type PaymentStep = 'select' | 'form' | 'processing' | 'success' | 'error'



export function InternationalPaymentMethods({
  selectedMethod,
  onMethodSelect,
  amount,
  currency,
  description,
}: InternationalPaymentMethodsProps) {
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('select')
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  
  const {
    config,
    isConfigLoading,
    isCreatingPayment,
    createPaymentError,
    formatAmount,
    calculateFees,
    redirectToPayment,
  } = usePayment()

  const {
    paymentStatus,
    statusText,
  } = usePaymentStatus({
    orderId: '', // Will be set after payment creation
    enabled: paymentStep === 'processing',
    onCompleted: () => setPaymentStep('success'),
    onFailed: () => setPaymentStep('error'),
  })



  if (isConfigLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading payment methods...</span>
      </div>
    )
  }

  const internationalMethods = config?.paymentMethods.international || []

  const handleMethodSelect = (methodId: string) => {
    onMethodSelect(methodId)
    setPaymentStep('form')
  }

  const handleBack = () => {
    if (paymentStep === 'form') {
      setPaymentStep('select')
      onMethodSelect('')
    }
  }

  const handlePaymentSuccess = (payment: any) => {
    if (payment.paymentUrl) {
      redirectToPayment(payment.paymentUrl)
    } else if (payment.clientSecret) {
      setStripeClientSecret(payment.clientSecret)
      // In a real implementation, you would use Stripe Elements here
      // For now, we'll simulate the payment process
      setTimeout(() => {
        setPaymentStep('success')
      }, 3000)
    }
    setPaymentStep('processing')
  }

  const handlePaymentError = (error: Error) => {
    console.error('Payment creation failed:', error)
    setPaymentStep('error')
  }

  if (paymentStep === 'select') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Globe className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">International Payment Methods</h3>
            <p className="text-sm text-muted-foreground">
              Secure global payment options with worldwide acceptance
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {internationalMethods.map((method) => {
            const fees = calculateFees(amount, method.id as PaymentMethod)
            const total = amount + fees

            return (
              <motion.div
                key={method.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
                onClick={() => handleMethodSelect(method.id)}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          {(() => {
                            const methodId = PaymentMethodUtils.apiToId(method.id)
                            return methodId && PaymentMethodLogos[methodId]
                              ? PaymentMethodLogos[methodId]({ size: 'md' })
                              : (
                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <CreditCard className="w-5 h-5 text-gray-500" />
                                </div>
                              )
                          })()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{method.name}</h3>
                          <p className="text-sm text-muted-foreground">{method.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{method.processingTime}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Fee: {method.fees.percentage}%{method.fees.fixed > 0 && ` + ${formatAmount(method.fees.fixed, currency)}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Amount:</span>
                        <span>{formatAmount(amount, currency)}</span>
                      </div>
                      {fees > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Fee:</span>
                          <span>{formatAmount(fees, currency)}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{formatAmount(total, currency)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  if (paymentStep === 'form') {
    const selectedMethodConfig = internationalMethods.find(m => m.id === selectedMethod)

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            {selectedMethodConfig && (() => {
              const methodId = selectedMethod ? PaymentMethodUtils.apiToId(selectedMethod) : null
              return methodId && PaymentMethodLogos[methodId]
                ? PaymentMethodLogos[methodId]({ size: 'md' })
                : (
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-gray-500" />
                  </div>
                )
            })()}
            <div>
              <h3 className="font-semibold">{selectedMethodConfig?.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedMethodConfig?.type}</p>
            </div>
          </div>
        </div>

        {createPaymentError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {createPaymentError.message}
            </AlertDescription>
          </Alert>
        )}

        {selectedMethod === 'PAYPAL' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">Secure PayPal Login</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                You&apos;ll be redirected to PayPal to complete your payment securely.
              </p>
            </div>

            <PayPalPaymentForm
              amount={amount}
              currency={currency}
              description={description}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              disabled={isCreatingPayment}
            />
          </div>
        )}

        {selectedMethod === 'STRIPE' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">Secure Card Processing</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Your card information is encrypted and processed securely by Stripe.
              </p>
            </div>

            <StripePaymentForm
              amount={amount}
              currency={currency}
              description={description}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              disabled={isCreatingPayment}
            />
          </div>

        )}
      </div>
    )
  }

  if (paymentStep === 'processing') {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Processing Payment</h3>
          <p className="text-muted-foreground">
            {statusText || 'Please wait while we process your payment...'}
          </p>
        </div>
        
        {stripeClientSecret && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Payment is being processed securely by Stripe...
            </p>
          </div>
        )}
      </div>
    )
  }

  if (paymentStep === 'success') {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
          <p className="text-muted-foreground">
            Your payment has been processed successfully.
          </p>
        </div>
        {paymentStatus && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm">
              <strong>Transaction ID:</strong> {paymentStatus.externalId}
            </p>
            <p className="text-sm">
              <strong>Amount:</strong> {formatAmount(paymentStatus.amount, paymentStatus.currency)}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (paymentStep === 'error') {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-600">Payment Failed</h3>
          <p className="text-muted-foreground">
            {createPaymentError?.message || 'An error occurred while processing your payment.'}
          </p>
        </div>
        <Button onClick={() => setPaymentStep('form')} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return null
}
