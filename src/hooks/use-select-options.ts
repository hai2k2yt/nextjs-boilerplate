"use client"

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface UseSelectOptionsConfig<TData = any> {
  // Static options - used when no API call is needed
  staticOptions?: SelectOption[]

  // API configuration
  apiConfig?: {
    queryKey: string[]
    queryFn: () => Promise<TData>
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
    refetchOnWindowFocus?: boolean
  }

  // Transform function to convert API response to SelectOption format
  transform?: (data: TData) => SelectOption[]

  // Default option to show at the top
  defaultOption?: SelectOption

  // Loading placeholder option
  loadingOption?: SelectOption
}

export interface UseSelectOptionsReturn {
  options: SelectOption[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  isEmpty: boolean
}

/**
 * Custom hook for managing select field options
 * Supports both static options and API-fetched options with loading states
 */
export function useSelectOptions<TData = any>(config: UseSelectOptionsConfig<TData>): UseSelectOptionsReturn {
  const {
    staticOptions,
    apiConfig,
    transform,
    defaultOption,
    loadingOption = { value: '__loading__', label: 'Loading...', disabled: true }
  } = config

  // Use React Query for API-based options
  const {
    data: apiData,
    isLoading: isApiLoading,
    isError: isApiError,
    error: apiError,
    refetch
  } = useQuery<TData>({
    queryKey: apiConfig?.queryKey || [],
    queryFn: apiConfig?.queryFn || (() => Promise.resolve([] as TData)),
    enabled: !!apiConfig && (apiConfig.enabled !== false),
    staleTime: apiConfig?.staleTime || 5 * 60 * 1000, // 5 minutes
    gcTime: apiConfig?.cacheTime || 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: apiConfig?.refetchOnWindowFocus ?? false,
  })

  // Process options based on configuration
  const processedOptions = useCallback((): SelectOption[] => {
    let options: SelectOption[] = []

    if (staticOptions) {
      // Use static options
      options = [...staticOptions]
    } else if (apiConfig) {
      if (isApiLoading) {
        // Show loading option while fetching
        options = [loadingOption]
      } else if (isApiError || !apiData) {
        // Show empty or error state
        options = []
      } else {
        // Transform API data if transform function is provided
        if (transform && apiData) {
          options = transform(apiData)
        } else if (Array.isArray(apiData)) {
          // If no transform function and apiData is an array, assume it's already SelectOption[]
          options = apiData as SelectOption[]
        } else {
          options = []
        }
      }
    }

    // Add default option at the beginning if provided
    if (defaultOption && !isApiLoading) {
      options = [defaultOption, ...options]
    }

    return options
  }, [staticOptions, apiData, isApiLoading, isApiError, transform, defaultOption, loadingOption, apiConfig])

  const options = processedOptions()

  return {
    options,
    isLoading: !!apiConfig && isApiLoading,
    isError: !!apiConfig && isApiError,
    error: apiError || null,
    refetch: refetch || (() => {}),
    isEmpty: options.length === 0 || (options.length === 1 && options[0] === loadingOption)
  }
}

// Predefined option sets for common use cases
export const commonOptions = {
  countries: [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
    { value: 'au', label: 'Australia' },
    { value: 'in', label: 'India' },
    { value: 'br', label: 'Brazil' },
    { value: 'mx', label: 'Mexico' },
  ],
  
  experienceLevels: [
    { value: 'beginner', label: 'Beginner (0-1 years)' },
    { value: 'intermediate', label: 'Intermediate (2-5 years)' },
    { value: 'advanced', label: 'Advanced (5-10 years)' },
    { value: 'expert', label: 'Expert (10+ years)' },
  ],
  
  contactMethods: [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'sms', label: 'SMS' },
    { value: 'mail', label: 'Postal Mail' },
  ],
  
  genders: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ],
}
