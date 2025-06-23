"use client"

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Loader2, AlertCircle, RefreshCw, X } from 'lucide-react'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useSelectOptions, UseSelectOptionsConfig, SelectOption } from '@/hooks/use-select-options'

interface SelectFieldProps<TData = any> {
  name: string
  label?: string
  description?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean

  // Option 1: Static options (backward compatibility)
  options?: SelectOption[]

  // Option 2: Hook-based options with API support
  optionsConfig?: UseSelectOptionsConfig<TData>

  // Clearable functionality
  clearable?: boolean
  clearButtonAriaLabel?: string

  // Loading and error customization
  showLoadingSpinner?: boolean
  showErrorState?: boolean
  showRetryButton?: boolean
  loadingText?: string
  errorText?: string
}

export const SelectField = <TData = any>({
  name,
  label,
  description,
  placeholder = "Select an option",
  required = false,
  options: staticOptions,
  optionsConfig,
  disabled = false,
  clearable = false,
  clearButtonAriaLabel = "Clear selection",
  showLoadingSpinner = true,
  showErrorState = true,
  showRetryButton = true,
  loadingText = "Loading options...",
  errorText = "Failed to load options",
}: SelectFieldProps<TData>) => {
  const { control } = useFormContext()

  // Use the hook if optionsConfig is provided, otherwise use static options
  const {
    options: hookOptions,
    isLoading,
    isError,
    error,
    refetch,
    isEmpty
  } = useSelectOptions<TData>(
    optionsConfig || { staticOptions: staticOptions || [] }
  )

  const finalOptions = hookOptions
  const isFieldDisabled = disabled || (isLoading && showLoadingSpinner)

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
              {isLoading && showLoadingSpinner && (
                <Loader2 className="ml-2 h-3 w-3 animate-spin inline" />
              )}
            </FormLabel>
          )}

          <div className="space-y-2">
            <div className="relative">
              <Select
                onValueChange={(value) => {
                  // Don't set placeholder values as actual form values
                  if (value && !value.startsWith('__')) {
                    field.onChange(value)
                  }
                }}
                value={field.value || ""}
                disabled={isFieldDisabled}
              >
                <FormControl>
                  <div className="relative w-full">
                    <SelectTrigger className={`w-full ${isError && showErrorState ? "border-destructive" : ""} ${clearable && field.value && !isFieldDisabled ? "" : ""}`}>
                      <SelectValue
                        placeholder={
                          isLoading && showLoadingSpinner
                            ? loadingText
                            : isError && showErrorState
                            ? errorText
                            : placeholder
                        }
                      />
                    </SelectTrigger>

                    {/* Clear Button - positioned relative to SelectTrigger */}
                    {clearable && field.value && !isFieldDisabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted rounded-full z-10"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          field.onChange("")
                        }}
                        aria-label={clearButtonAriaLabel}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </FormControl>
                <SelectContent>
                  {finalOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value || "__placeholder__"}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                  {isEmpty && !isLoading && (
                    <SelectItem value="__no_options__" disabled>
                      No options available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Error state with retry button */}
            {isError && showErrorState && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error?.message || errorText}</span>
                {showRetryButton && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => refetch()}
                    className="h-6 px-2 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            )}
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
