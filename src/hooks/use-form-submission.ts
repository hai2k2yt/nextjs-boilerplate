"use client"

import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

interface FormSubmissionOptions<TData, TResponse = unknown> {
  onSuccess?: (data: TResponse, variables: TData) => void
  onError?: (error: Error, variables: TData) => void
  successMessage?: string
  errorMessage?: string
  showToast?: boolean
}

interface FormSubmissionConfig<TData, TResponse = unknown> {
  mutationFn: (data: TData) => Promise<TResponse>
  options?: FormSubmissionOptions<TData, TResponse>
}

/**
 * Custom hook for handling form submissions with React Query
 * Provides loading states, error handling, and toast notifications
 */
export function useFormSubmission<TData, TResponse = unknown>({
  mutationFn,
  options = {},
}: FormSubmissionConfig<TData, TResponse>) {
  const { toast } = useToast()
  
  const {
    onSuccess,
    onError,
    successMessage = 'Form submitted successfully!',
    errorMessage = 'An error occurred while submitting the form.',
    showToast = true,
  } = options

  const mutation = useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      if (showToast) {
        toast({
          title: 'Success',
          description: successMessage,
          variant: 'default',
        })
      }
      onSuccess?.(data, variables)
    },
    onError: (error: Error, variables) => {
      if (showToast) {
        toast({
          title: 'Error',
          description: error.message || errorMessage,
          variant: 'destructive',
        })
      }
      onError?.(error, variables)
    },
  })

  return {
    // Mutation state
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    
    // Mutation function
    submit: mutation.mutate,
    submitAsync: mutation.mutateAsync,
    
    // Reset function
    reset: mutation.reset,
    
    // Raw mutation object for advanced usage
    mutation,
  }
}

/**
 * Simulated API function for demonstration
 * In a real app, this would be replaced with actual API calls
 */
export async function simulateFormSubmission<T>(data: T): Promise<{ success: boolean; data: T }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Simulate random errors (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('Simulated server error. Please try again.')
  }
  
  return {
    success: true,
    data,
  }
}
