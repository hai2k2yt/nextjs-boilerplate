"use client"

import { zodResolver } from '@hookform/resolvers/zod'
import React, { forwardRef, useImperativeHandle } from 'react'
import { FormProvider, useForm, UseFormProps, FieldValues } from 'react-hook-form'
import { z } from 'zod'
import { cn } from '@/lib/utils'

interface FormProps<T extends FieldValues> {
  children: React.ReactNode
  onSubmit: (data: T) => void
  schema?: z.ZodType<T>
  defaultValues?: UseFormProps<T>['defaultValues']
  className?: string
  mode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all'
}

export interface FormRef<T extends FieldValues = FieldValues> {
  // React Hook Form methods
  reset: (values?: Partial<T>) => void
  getValues: () => T
  setValue: <K extends keyof T>(name: K, value: T[K]) => void
  trigger: (name?: keyof T | (keyof T)[]) => Promise<boolean>
  watch: (name?: keyof T | (keyof T)[]) => any
  setError: (name: keyof T, error: { type?: string; message: string }) => void
  clearErrors: (name?: keyof T | (keyof T)[]) => void
  getFieldState: (name: keyof T) => any
  formState: {
    errors: any
    isValid: boolean
    isSubmitting: boolean
    isDirty: boolean
    isLoading: boolean
  }
}

function FormComponent<T extends FieldValues>({
  children,
  onSubmit,
  schema,
  defaultValues,
  className,
  mode = 'onSubmit',
}: FormProps<T>, ref: React.Ref<FormRef<T>>) {
  const methods = useForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode,
  })

  useImperativeHandle(ref, () => ({
    // React Hook Form methods
    reset: (values) => {
      methods.reset(values || defaultValues as any)
    },
    getValues: () => {
      return methods.getValues()
    },
    setValue: (name: keyof T, value: any) => {
      methods.setValue(name as any, value)
    },
    trigger: (name?: keyof T | (keyof T)[]) => {
      return methods.trigger(name as any)
    },
    watch: (name?: keyof T | (keyof T)[]) => {
      return methods.watch(name as any)
    },
    setError: (name: keyof T, error: { type?: string; message: string }) => {
      methods.setError(name as any, error)
    },
    clearErrors: (name?: keyof T | (keyof T)[]) => {
      methods.clearErrors(name as any)
    },
    getFieldState: (name: keyof T) => {
      return methods.getFieldState(name as any)
    },
    formState: {
      errors: methods.formState.errors,
      isValid: methods.formState.isValid,
      isSubmitting: methods.formState.isSubmitting,
      isDirty: methods.formState.isDirty,
      isLoading: methods.formState.isLoading,
    },
  }))

  const handleSubmit = methods.handleSubmit(onSubmit)

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit}
        className={cn('space-y-8', className)}
      >
        {children}
      </form>
    </FormProvider>
  )
}

const Form = forwardRef(FormComponent) as <T extends FieldValues>(
  props: FormProps<T> & { ref?: React.Ref<FormRef<T>> }
) => React.ReactElement

export default Form
