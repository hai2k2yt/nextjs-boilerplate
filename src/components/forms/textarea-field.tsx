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
import { Textarea } from '@/components/ui/textarea'


interface TextareaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  name: string
  label?: string
  description?: string
  required?: boolean
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  name,
  label,
  description,
  required = false,
  className,
  ...props
}) => {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Textarea
              {...field}
              {...props}
              className={className}
            />
          </FormControl>
          {description && (
            <FormDescription>
              {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
