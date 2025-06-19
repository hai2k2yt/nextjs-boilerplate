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
import { Checkbox } from '@/components/ui/checkbox'

interface CheckboxOption {
  value: string
  label: string
  disabled?: boolean
}

interface CheckboxFieldProps {
  name: string
  label?: string
  description?: string
  required?: boolean
  options?: CheckboxOption[]
  disabled?: boolean
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  name,
  label,
  description,
  required = false,
  options,
  disabled = false,
}) => {
  const { control } = useFormContext()

  // Single checkbox
  if (!options) {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              {label && (
                <FormLabel>
                  {label}
                  {required && <span className="text-destructive">*</span>}
                </FormLabel>
              )}
              {description && (
                <FormDescription>
                  {description}
                </FormDescription>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  // Multiple checkboxes
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
          <div className="space-y-3">
            {options.map((option) => (
              <div key={option.value} className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value?.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentValue = field.value || []
                      if (checked) {
                        field.onChange([...currentValue, option.value])
                      } else {
                        field.onChange(
                          currentValue.filter((value: string) => value !== option.value)
                        )
                      }
                    }}
                    disabled={disabled || option.disabled}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  {option.label}
                </FormLabel>
              </div>
            ))}
          </div>
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
