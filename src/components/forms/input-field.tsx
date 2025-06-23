"use client"

import React from 'react'
import { useFormContext } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface InputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
  name: string
  label?: string
  description?: string
  required?: boolean
}

export const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  description,
  required = false,
  type = 'text',
  className,
  ...props
}) => {
  const { control } = useFormContext()

  // For hidden inputs, render only the input without form wrapper
  if (type === 'hidden') {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <Input
            {...field}
            {...props}
            type="hidden"
            className="sr-only"
          />
        )}
      />
    )
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          {label && (
            <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Input
              {...field}
              {...props}
              type={type}
              className={cn("w-full", className)}
            />
          </FormControl>
          {description && (
            <FormDescription className="text-sm text-muted-foreground">
              {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
