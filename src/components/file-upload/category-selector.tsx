'use client'

import { useState } from 'react'
import { useForm, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X, Tag, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { trpc } from '@/lib/trpc'
import { createCategorySchema, type CreateCategoryInput } from '@/lib/validations/category'

interface CategorySelectorProps {
  selectedCategoryIds: string[]
  onCategoryChange: (categoryIds: string[]) => void
  maxCategories?: number
}

interface CategoryFieldProps {
  name: string
  label?: string
  description?: string
  maxCategories?: number
  required?: boolean
}

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e'
]

export function CategorySelector({ 
  selectedCategoryIds, 
  onCategoryChange, 
  maxCategories = 10 
}: CategorySelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const utils = trpc.useUtils()
  const { data: categories = [] } = trpc.files.getCategories.useQuery()

  const createCategoryMutation = trpc.files.createCategory.useMutation({
    onSuccess: () => {
      // Invalidate and refetch categories
      utils.files.getCategories.invalidate()
      setIsCreateDialogOpen(false)
      form.reset()
    },
  })

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      color: DEFAULT_COLORS[0],
    },
  })

  // Remove unused variables - they're calculated inside renderCategorySelector

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      // Remove category
      onCategoryChange(selectedCategoryIds.filter(id => id !== categoryId))
    } else {
      // Add category (if under limit)
      if (selectedCategoryIds.length < maxCategories) {
        onCategoryChange([...selectedCategoryIds, categoryId])
      }
    }
  }

  const handleCreateCategory = async (data: CreateCategoryInput) => {
    try {
      const newCategory = await createCategoryMutation.mutateAsync(data)
      // Auto-select the newly created category
      onCategoryChange([...selectedCategoryIds, newCategory.id])
    } catch (error) {
      console.error('Failed to create category:', error)
      // Error is already handled by the mutation's onError callback
    }
  }

  const removeCategory = (categoryId: string) => {
    onCategoryChange(selectedCategoryIds.filter(id => id !== categoryId))
  }

  const renderCategorySelector = (selectedCategoryIds: string[], _onCategoryChange: (categoryIds: string[]) => void) => {
    const selectedCategories = categories.filter(cat =>
      selectedCategoryIds.includes(cat.id)
    )

    const availableCategories = categories.filter(cat =>
      !selectedCategoryIds.includes(cat.id)
    )

    return (
      <div className="space-y-3">
        {/* Selected categories */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <Badge
                key={category.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
                style={{
                  backgroundColor: category.color ? `${category.color}20` : undefined,
                  borderColor: category.color || undefined
                }}
              >
                <Tag className="h-3 w-3" />
                {category.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeCategory(category.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Category selector */}
        <div className="flex gap-2">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-start"
                disabled={selectedCategoryIds.length >= maxCategories}
              >
                <Tag className="h-4 w-4 mr-2" />
                {selectedCategoryIds.length >= maxCategories
                  ? `Maximum ${maxCategories} categories selected`
                  : 'Select categories...'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search categories..." />
                <CommandEmpty>No categories found.</CommandEmpty>
                <CommandGroup>
                  {availableCategories.map((category) => (
                    <CommandItem
                      key={category.id}
                      onSelect={() => {
                        handleCategoryToggle(category.id)
                        setIsPopoverOpen(false)
                      }}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: category.color || '#6b7280' }}
                      />
                      <span className="flex-1">{category.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {category._count.files} files
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Create new category */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleCreateCategory)} className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    {...form.register('name')}
                    placeholder="Enter category name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="categoryDescription">Description (Optional)</Label>
                  <Textarea
                    id="categoryDescription"
                    {...form.register('description')}
                    placeholder="Enter category description"
                    rows={2}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          form.watch('color') === color
                            ? 'border-foreground scale-110'
                            : 'border-muted-foreground/20 hover:border-muted-foreground/50'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => form.setValue('color', color)}
                      >
                        {form.watch('color') === color && (
                          <Check className="h-4 w-4 text-white mx-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending}
                    className="flex-1"
                  >
                    {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {selectedCategoryIds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedCategoryIds.length} of {maxCategories} categories selected
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label>Categories (Optional)</Label>
      {renderCategorySelector(selectedCategoryIds, onCategoryChange)}
    </div>
  )
}

// Form field version that integrates with React Hook Form context
export const CategoryField: React.FC<CategoryFieldProps> = ({
  name,
  label = 'Categories',
  description,
  maxCategories = 10,
  required = false,
}) => {
  const { control } = useFormContext()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const utils = trpc.useUtils()
  const { data: categories = [] } = trpc.files.getCategories.useQuery()

  const createCategoryMutation = trpc.files.createCategory.useMutation({
    onSuccess: () => {
      // Invalidate and refetch categories
      utils.files.getCategories.invalidate()
      setIsCreateDialogOpen(false)
      categoryForm.reset()
    },
  })

  const categoryForm = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      color: DEFAULT_COLORS[0],
    },
  })

  const handleCategoryToggle = (categoryId: string, currentIds: string[], onChange: (ids: string[]) => void) => {
    if (currentIds.includes(categoryId)) {
      // Remove category
      onChange(currentIds.filter(id => id !== categoryId))
    } else {
      // Add category (if under limit)
      if (currentIds.length < maxCategories) {
        onChange([...currentIds, categoryId])
      }
    }
  }

  const handleCreateCategory = async (data: CreateCategoryInput, currentIds: string[], onChange: (ids: string[]) => void) => {
    try {
      const newCategory = await createCategoryMutation.mutateAsync(data)
      // Auto-select the newly created category
      onChange([...currentIds, newCategory.id])
    } catch (error) {
      console.error('Failed to create category:', error)
      // Error is already handled by the mutation's onError callback
    }
  }

  const removeCategory = (categoryId: string, currentIds: string[], onChange: (ids: string[]) => void) => {
    onChange(currentIds.filter(id => id !== categoryId))
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <div className="space-y-3">
              {/* Selected categories */}
              {field.value && field.value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories
                    .filter(cat => field.value.includes(cat.id))
                    .map((category) => (
                      <Badge
                        key={category.id}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                        style={{
                          backgroundColor: category.color ? `${category.color}20` : undefined,
                          borderColor: category.color || undefined
                        }}
                      >
                        <Tag className="h-3 w-3" />
                        {category.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeCategory(category.id, field.value || [], field.onChange)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                </div>
              )}

              {/* Category selector */}
              <div className="flex gap-2">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start"
                      disabled={(field.value?.length || 0) >= maxCategories}
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      {(field.value?.length || 0) >= maxCategories
                        ? `Maximum ${maxCategories} categories selected`
                        : 'Select categories...'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search categories..." />
                      <CommandEmpty>No categories found.</CommandEmpty>
                      <CommandGroup>
                        {categories
                          .filter(cat => !field.value?.includes(cat.id))
                          .map((category) => (
                            <CommandItem
                              key={category.id}
                              onSelect={() => {
                                handleCategoryToggle(category.id, field.value || [], field.onChange)
                                setIsPopoverOpen(false)
                              }}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="w-3 h-3 rounded-full border"
                                style={{ backgroundColor: category.color || '#6b7280' }}
                              />
                              <span className="flex-1">{category.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {category._count.files} files
                              </span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Create new category */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={categoryForm.handleSubmit((data) => handleCreateCategory(data, field.value || [], field.onChange))} className="space-y-4">
                      <div>
                        <Label htmlFor="categoryName">Category Name</Label>
                        <Input
                          id="categoryName"
                          {...categoryForm.register('name')}
                          placeholder="Enter category name"
                        />
                        {categoryForm.formState.errors.name && (
                          <p className="text-sm text-destructive mt-1">
                            {categoryForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="categoryDescription">Description (Optional)</Label>
                        <Textarea
                          id="categoryDescription"
                          {...categoryForm.register('description')}
                          placeholder="Enter category description"
                          rows={2}
                        />
                        {categoryForm.formState.errors.description && (
                          <p className="text-sm text-destructive mt-1">
                            {categoryForm.formState.errors.description.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {DEFAULT_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                categoryForm.watch('color') === color
                                  ? 'border-foreground scale-110'
                                  : 'border-muted-foreground/20 hover:border-muted-foreground/50'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => categoryForm.setValue('color', color)}
                            >
                              {categoryForm.watch('color') === color && (
                                <Check className="h-4 w-4 text-white mx-auto" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={createCategoryMutation.isPending}
                          className="flex-1"
                        >
                          {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {(field.value?.length || 0) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {field.value?.length || 0} of {maxCategories} categories selected
                </p>
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
