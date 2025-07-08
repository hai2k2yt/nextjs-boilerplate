"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { X, Search, ChevronDown } from 'lucide-react'
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
import { SelectOption } from '@/hooks/use-select-options'

interface LocalSearchSelectFieldProps {
  name: string
  label?: string
  description?: string
  placeholder?: string
  searchPlaceholder?: string
  required?: boolean
  disabled?: boolean
  clearable?: boolean
  clearButtonAriaLabel?: string
  noResultsText?: string
  minSearchLength?: number
  maxHeight?: string
  
  // Local options
  options: SelectOption[]
}

export const LocalSearchSelectField = ({
  name,
  label,
  description,
  placeholder = "Search and select an option",
  searchPlaceholder = "Type to search...",
  required = false,
  disabled = false,
  clearable = false,
  clearButtonAriaLabel = "Clear selection",
  noResultsText = "No results found",
  minSearchLength = 0,
  maxHeight = "200px",
  options,
}: LocalSearchSelectFieldProps) => {
  const { control, setValue, watch } = useFormContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  
  // Watch the form field value to sync with selected option
  const fieldValue = watch(name)
  
  // Filter options client-side based on search query
  const filteredOptions = searchQuery.trim() && searchQuery.length >= minSearchLength
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options
  
  // Update selected option when field value or options change
  useEffect(() => {
    if (fieldValue) {
      const option = options.find(opt => opt.value === fieldValue)
      setSelectedOption(option || null)
    } else {
      setSelectedOption(null)
    }
  }, [fieldValue, options]) // Safe to include options since they're static for local search
  
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
  
  const handleSelectOption = (option: SelectOption) => {
    if (option.disabled) return
    
    setValue(name, option.value, { shouldValidate: true })
    setSelectedOption(option)
    setIsOpen(false)
    setSearchQuery('')
  }
  
  const handleClear = () => {
    setValue(name, '', { shouldValidate: true })
    setSelectedOption(null)
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
  
  const displayValue = selectedOption ? selectedOption.label : ''
  const showResults = isOpen && (searchQuery.length >= minSearchLength || options.length > 0)
  const hasResults = filteredOptions.length > 0
  
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
                    clearable && selectedOption && "pr-16"
                  )}
                />
                
                {/* Icons */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {clearable && selectedOption && (
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
                  
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )} />
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
                    {!hasResults && searchQuery.length >= minSearchLength && (
                      <li className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        {noResultsText}
                      </li>
                    )}
                    
                    {hasResults && filteredOptions.map((option) => (
                      <li key={option.value}>
                        <button
                          type="button"
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                            option.disabled && "opacity-50 cursor-not-allowed",
                            selectedOption?.value === option.value && "bg-accent text-accent-foreground"
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
