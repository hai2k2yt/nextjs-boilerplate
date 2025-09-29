"use client"

import React from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import Form from '@/components/forms/form'
import { InputField } from '@/components/forms/input-field'
import { useFormSubmission } from '@/hooks/use-form-submission'
import { usePayment, PaymentResponse } from '@/hooks/use-payment'
import { PaymentMethod } from '@prisma/client'

// Validation schema
const paypalSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type PayPalFormData = z.infer<typeof paypalSchema>

interface PayPalPaymentFormProps {
  amount: number
  currency: string
  description?: string
  onSuccess?: (payment: PaymentResponse) => void
  onError?: (error: Error) => void
  disabled?: boolean
}

export function PayPalPaymentForm({
  amount,
  currency,
  description,
  onSuccess,
  onError,
  disabled = false,
}: PayPalPaymentFormProps) {
  const {
    createPayment,
    validatePaymentAmount,
    redirectToPayment,
  } = usePayment()

  const { submit, isLoading } = useFormSubmission<PayPalFormData, PaymentResponse>({
    mutationFn: async (data) => {
      // Validate payment amount
      const validation = validatePaymentAmount(amount, PaymentMethod.PAYPAL)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Create payment
      const payment = await createPayment({
        amount,
        currency,
        paymentMethod: PaymentMethod.PAYPAL,
        description,
        metadata: {
          email: data.email,
          // Note: In a real app, never send passwords to your backend
          // This is just for demo purposes
        },
      })

      return payment
    },
    options: {
      onSuccess: (payment: PaymentResponse) => {
        if (payment.paymentUrl) {
          redirectToPayment(payment.paymentUrl)
        }
        onSuccess?.(payment)
      },
      onError: (error) => {
        onError?.(error)
      },
      showToast: false, // Let parent handle notifications
    },
  })

  const handleSubmit = (data: PayPalFormData) => {
    submit(data)
  }

  return (
    <Form
      schema={paypalSchema}
      onSubmit={handleSubmit}
      defaultValues={{ email: '', password: '' }}
      className="space-y-4"
    >
      <InputField
        name="email"
        label="Email"
        type="email"
        placeholder="Enter your PayPal email"
        required
        disabled={disabled || isLoading}
      />

      <InputField
        name="password"
        label="Password"
        type="password"
        placeholder="Enter your PayPal password"
        required
        disabled={disabled || isLoading}
      />

      <Button 
        type="submit" 
        className="w-full" 
        disabled={disabled || isLoading}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Pay with PayPal
      </Button>
    </Form>
  )
}
