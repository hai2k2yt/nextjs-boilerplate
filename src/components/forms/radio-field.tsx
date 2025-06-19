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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface RadioOption {
  value: string
  label: string
  disabled?: boolean
}

interface RadioFieldProps {
  name: string
  label?: string
  description?: string
  required?: boolean
  options: RadioOption[]
  disabled?: boolean
  orientation?: 'horizontal' | 'vertical'
}

export const RadioField: React.FC<RadioFieldProps> = ({
  name,
  label,
  description,
  required = false,
  options,
  disabled = false,
  orientation = 'vertical',
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
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className={orientation === 'horizontal' ? 'flex flex-row flex-wrap gap-6' : 'space-y-2'}
              disabled={disabled}
            >
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`${name}-${option.value}`}
                    disabled={disabled || option.disabled}
                  />
                  <Label
                    htmlFor={`${name}-${option.value}`}
                    className="text-sm font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
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
