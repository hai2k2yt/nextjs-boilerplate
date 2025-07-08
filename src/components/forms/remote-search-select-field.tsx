"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Loader2, AlertCircle, RefreshCw, X, Search, ChevronDown } from 'lucide-react'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSelectOptions, UseSelectOptionsConfig, SelectOption } from '@/hooks/use-select-options'
import { useDebounce } from '@/hooks/use-debounce'

interface RemoteSearchSelectFieldProps<TData = any> {
  name: string
  label?: string
  description?: string
  placeholder?: string
  searchPlaceholder?: string
  required?: boolean
  disabled?: boolean
  clearable?: boolean
  clearButtonAriaLabel?: string
  showLoadingSpinner?: boolean
  showErrorState?: boolean
  showRetryButton?: boolean
  loadingText?: string
  errorText?: string
  noResultsText?: string
  minSearchLength?: number
  searchDebounceMs?: number
  maxHeight?: string
  
  // Remote options configuration
  optionsConfig: UseSelectOptionsConfig<TData>
}

export const RemoteSearchSelectField = <TData = any>({
  name,
  label,
  description,
  placeholder = "Search and select an option",
  searchPlaceholder = "Type to search...",
  required = false,
  disabled = false,
  clearable = false,
  clearButtonAriaLabel = "Clear selection",
  showLoadingSpinner = true,
  showErrorState = true,
  showRetryButton = true,
  loadingText = "Searching...",
  errorText = "Failed to search options",
  noResultsText = "No results found",
  minSearchLength = 2,
  searchDebounceMs = 300,
  maxHeight = "200px",
  optionsConfig,
}: RemoteSearchSelectFieldProps<TData>) => {
  const { control, setValue, watch } = useFormContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  // Store the complete option data (label + value) to prevent loss when options change
  const [selectedOptionData, setSelectedOptionData] = useState<SelectOption | null>(null)
  
  const debouncedSearchQuery = useDebounce(searchQuery, searchDebounceMs)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  
  // Watch the form field value to sync with selected option
  const fieldValue = watch(name)
  
  // Memoize the options config to prevent unnecessary hook re-executions
  const stableOptionsConfig = useMemo(() => ({
    ...optionsConfig,
    searchConfig: {
      searchQuery: debouncedSearchQuery,
      minSearchLength,
      searchPlaceholder,
    }
  }), [
    optionsConfig,
    debouncedSearchQuery,
    minSearchLength,
    searchPlaceholder
  ])

  // Use the hook with stable configuration
  const {
    options,
    isLoading,
    isError,
    refetch,
  } = useSelectOptions<TData>(stableOptionsConfig)
  
  // Update selected option data when field value changes
  useEffect(() => {
    if (fieldValue) {
      // If we already have the correct selection data, don't change it
      if (selectedOptionData && selectedOptionData.value === fieldValue) {
        return
      }

      // Try to find the option in current options
      const option = options.find(opt => opt.value === fieldValue)
      if (option) {
        // Found in current options, update with fresh data
        setSelectedOptionData(option)
      }
      // If not found in current options but we have a field value,
      // keep the existing selectedOptionData (Ant Design pattern)
      // This prevents losing the selection when options change due to search
    } else {
      // Field value is empty, clear selection
      setSelectedOptionData(null)
    }
  }, [fieldValue, options, selectedOptionData])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clear search query when dropdown closes (after selection or outside click)
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])
  
  const handleSelectOption = (option: SelectOption) => {
    if (option.disabled) return

    // Store both value in form and complete option data (Ant Design labelInValue pattern)
    setValue(name, option.value, { shouldValidate: true })
    setSelectedOptionData(option) // Store complete option data
    setIsOpen(false)
    // Search query will be cleared when dropdown closes
  }
  
  const handleClear = () => {
    setValue(name, '', { shouldValidate: true })
    setSelectedOptionData(null) // Clear stored option data
    setSearchQuery('')
    setIsOpen(false)
  }
  
  const handleInputFocus = () => {
    setIsOpen(true)
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (!isOpen) setIsOpen(true)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }
  
  const displayValue = selectedOptionData ? selectedOptionData.label : ''
  const showResults = isOpen && (searchQuery.length >= minSearchLength || options.length > 0)
  const hasResults = options.length > 0 && !isLoading
  
  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem className="space-y-2">
          {label && (
            <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <div ref={containerRef} className="relative">
              {/* Main input/trigger */}
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={isOpen ? searchQuery : displayValue}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  placeholder={isOpen ? searchPlaceholder : placeholder}
                  disabled={disabled}
                  className={cn(
                    "w-full pr-10",
                    clearable && selectedOptionData && "pr-16"
                  )}
                />
                
                {/* Icons */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {clearable && selectedOptionData && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-muted"
                      onClick={handleClear}
                      aria-label={clearButtonAriaLabel}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {isLoading && showLoadingSpinner ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )} />
                  )}
                </div>
              </div>
              
              {/* Dropdown */}
              {showResults && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
                  <ul
                    ref={listRef}
                    className="py-1 overflow-auto"
                    style={{ maxHeight }}
                  >
                    {isLoading && (
                      <li className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {loadingText}
                      </li>
                    )}
                    
                    {isError && showErrorState && (
                      <li className="px-3 py-2 text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errorText}
                        {showRetryButton && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => refetch()}
                            className="ml-auto h-6 px-2"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </li>
                    )}
                    
                    {!isLoading && !isError && !hasResults && searchQuery.length >= minSearchLength && (
                      <li className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        {noResultsText}
                      </li>
                    )}
                    
                    {!isLoading && !isError && hasResults && options.map((option) => (
                      <li key={option.value}>
                        <button
                          type="button"
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                            option.disabled && "opacity-50 cursor-not-allowed",
                            selectedOptionData?.value === option.value && "bg-accent text-accent-foreground"
                          )}
                          onClick={() => handleSelectOption(option)}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
