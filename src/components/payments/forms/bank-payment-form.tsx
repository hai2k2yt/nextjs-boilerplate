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
const bankSchema = z.object({
  bankId: z.string().min(1, 'Please select a bank'),
  accountNumber: z.string().min(1, 'Account number is required'),
  accountName: z.string().min(1, 'Account name is required'),
})

type BankFormData = z.infer<typeof bankSchema>

interface BankPaymentFormProps {
  paymentMethod: PaymentMethod
  amount: number
  currency: string
  description?: string
  onSuccess?: (payment: PaymentResponse) => void
  onError?: (error: Error) => void
  disabled?: boolean
}

export function BankPaymentForm({
  paymentMethod,
  amount,
  currency,
  description,
  onSuccess,
  onError,
  disabled = false,
}: BankPaymentFormProps) {
  const {
    config,
    createPayment,
    validatePaymentAmount,
    getPaymentMethodConfig,
    redirectToPayment,
  } = usePayment()

  const methodConfig = getPaymentMethodConfig(paymentMethod)

  const { submit, isLoading } = useFormSubmission<BankFormData, PaymentResponse>({
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
          bankId: data.bankId,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
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

  const handleSubmit = (data: BankFormData) => {
    submit(data)
  }

  // Prepare bank options for VietQR
  const bankOptions = config?.vietqr.banks.map(bank => ({
    value: bank.id,
    label: `${bank.name} (${bank.shortName})`,
  })) || []

  return (
    <Form
      schema={bankSchema}
      onSubmit={handleSubmit}
      defaultValues={{ 
        bankId: '', 
        accountNumber: '', 
        accountName: '' 
      }}
      className="space-y-4"
    >
      {paymentMethod === PaymentMethod.VIETQR && (
        <SelectField
          name="bankId"
          label="Bank"
          placeholder="Select your bank"
          options={bankOptions}
          required
          disabled={disabled || isLoading}
        />
      )}

      <InputField
        name="accountNumber"
        label="Account Number"
        placeholder="Enter your account number"
        required
        disabled={disabled || isLoading}
      />

      <InputField
        name="accountName"
        label="Account Name"
        placeholder="Enter account holder name"
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
