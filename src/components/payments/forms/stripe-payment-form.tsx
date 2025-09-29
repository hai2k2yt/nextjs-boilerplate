"use client"

import React from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import Form from '@/components/forms/form'
import { InputField } from '@/components/forms/input-field'
import { SelectField } from '@/components/forms/select-field'
import { useFormSubmission } from '@/hooks/use-form-submission'
import { usePayment, PaymentResponse } from '@/hooks/use-payment'
import { PaymentMethod } from '@prisma/client'

// Validation schema
const stripeSchema = z.object({
  cardNumber: z.string()
    .min(16, 'Card number must be at least 16 digits')
    .max(19, 'Card number must be at most 19 digits')
    .regex(/^[0-9\s]+$/, 'Card number must contain only digits and spaces'),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Expiry date must be in MM/YY format'),
  cvv: z.string()
    .min(3, 'CVV must be at least 3 digits')
    .max(4, 'CVV must be at most 4 digits')
    .regex(/^[0-9]+$/, 'CVV must contain only digits'),
  cardholderName: z.string().min(1, 'Cardholder name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Please select a country'),
})

type StripeFormData = z.infer<typeof stripeSchema>

interface StripePaymentFormProps {
  amount: number
  currency: string
  description?: string
  onSuccess?: (payment: PaymentResponse) => void
  onError?: (error: Error) => void
  disabled?: boolean
}

export function StripePaymentForm({
  amount,
  currency,
  description,
  onSuccess,
  onError,
  disabled = false,
}: StripePaymentFormProps) {
  const {
    createPayment,
    validatePaymentAmount,
    redirectToPayment,
  } = usePayment()

  const { submit, isLoading } = useFormSubmission<StripeFormData, PaymentResponse>({
    mutationFn: async (data) => {
      // Validate payment amount
      const validation = validatePaymentAmount(amount, PaymentMethod.STRIPE)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Create payment
      const payment = await createPayment({
        amount,
        currency,
        paymentMethod: PaymentMethod.STRIPE,
        description,
        metadata: {
          cardNumber: data.cardNumber,
          expiryDate: data.expiryDate,
          cvv: data.cvv,
          cardholderName: data.cardholderName,
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
          country: data.country,
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

  const handleSubmit = (data: StripeFormData) => {
    submit(data)
  }

  // Country options
  const countryOptions = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'SG', label: 'Singapore' },
    { value: 'VN', label: 'Vietnam' },
  ]

  return (
    <Form
      schema={stripeSchema}
      onSubmit={handleSubmit}
      defaultValues={{
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <InputField
            name="cardNumber"
            label="Card Number"
            placeholder="1234 5678 9012 3456"
            required
            disabled={disabled || isLoading}
          />
        </div>

        <InputField
          name="expiryDate"
          label="Expiry Date"
          placeholder="MM/YY"
          required
          disabled={disabled || isLoading}
        />

        <InputField
          name="cvv"
          label="CVV"
          placeholder="123"
          required
          disabled={disabled || isLoading}
        />

        <div className="md:col-span-2">
          <InputField
            name="cardholderName"
            label="Cardholder Name"
            placeholder="John Doe"
            required
            disabled={disabled || isLoading}
          />
        </div>

        <div className="md:col-span-2">
          <InputField
            name="address"
            label="Address"
            placeholder="123 Main Street"
            required
            disabled={disabled || isLoading}
          />
        </div>

        <InputField
          name="city"
          label="City"
          placeholder="New York"
          required
          disabled={disabled || isLoading}
        />

        <InputField
          name="postalCode"
          label="Postal Code"
          placeholder="10001"
          required
          disabled={disabled || isLoading}
        />

        <div className="md:col-span-2">
          <SelectField
            name="country"
            label="Country"
            placeholder="Select your country"
            options={countryOptions}
            required
            disabled={disabled || isLoading}
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={disabled || isLoading}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Pay with Stripe
      </Button>
    </Form>
  )
}
