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

// Validation schema for phone payments (MoMo/ZaloPay)
const phoneSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(11, 'Phone number must be at most 11 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only digits'),
})

type PhoneFormData = z.infer<typeof phoneSchema>

interface PhonePaymentFormProps {
  paymentMethod: PaymentMethod
  amount: number
  currency: string
  description?: string
  onSuccess?: (payment: PaymentResponse) => void
  onError?: (error: Error) => void
  disabled?: boolean
}

export function PhonePaymentForm({
  paymentMethod,
  amount,
  currency,
  description,
  onSuccess,
  onError,
  disabled = false,
}: PhonePaymentFormProps) {
  const {
    createPayment,
    validatePaymentAmount,
    getPaymentMethodConfig,
    redirectToPayment,
  } = usePayment()

  const methodConfig = getPaymentMethodConfig(paymentMethod)

  const { submit, isLoading } = useFormSubmission<PhoneFormData, PaymentResponse>({
    mutationFn: async (data) => {
      // Validate payment amount
      const validation = validatePaymentAmount(amount, paymentMethod)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Create payment
      const payment = await createPayment({
        amount,
        currency,
        paymentMethod,
        description,
        metadata: {
          phoneNumber: data.phoneNumber,
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

  const handleSubmit = (data: PhoneFormData) => {
    submit(data)
  }

  return (
    <Form
      schema={phoneSchema}
      onSubmit={handleSubmit}
      defaultValues={{ phoneNumber: '' }}
      className="space-y-4"
    >
      <InputField
        name="phoneNumber"
        label="Phone Number"
        placeholder="Enter your phone number"
        description={`Enter your ${methodConfig?.name} registered phone number`}
        required
        disabled={disabled || isLoading}
      />

      <Button 
        type="submit" 
        className="w-full" 
        disabled={disabled || isLoading}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Pay with {methodConfig?.name}
      </Button>
    </Form>
  )
}
