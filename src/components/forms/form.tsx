"use client"

import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { FormProvider, useForm, UseFormProps, FieldValues } from 'react-hook-form'
import { z } from 'zod'
import { cn } from '@/lib/utils'

interface FormProps<T extends FieldValues> {
  children: React.ReactNode
  onSubmit: (data: T) => void | Promise<void> | Promise<any>
  schema?: z.ZodType<T>
  defaultValues?: UseFormProps<T>['defaultValues']
  className?: string
  mode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all'
}



function Form<T extends FieldValues>({
  children,
  onSubmit,
  schema,
  defaultValues,
  className,
  mode = 'onSubmit',
}: FormProps<T>) {
  const methods = useForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode,
  })

  const handleSubmit = methods.handleSubmit(async (data) => {
    try {
      await onSubmit(data)
    } catch (error) {
      // Error handling is done by React Query or the onSubmit handler
      console.error('Form submission error:', error)
    }
  })

  // Use React Hook Form's native isSubmitting state
  const isSubmitting = methods.formState.isSubmitting

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit}
        className={cn('space-y-8', className)}
      >
        <fieldset disabled={isSubmitting} className="space-y-8">
          {children}
        </fieldset>
      </form>
    </FormProvider>
  )
}

export default Form
