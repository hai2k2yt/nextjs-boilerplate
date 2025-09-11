"use client"

import React from 'react'
import { z } from 'zod'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import {
  Form,
  SelectField,
  InputField,
} from './index'
import { useFormSubmission, simulateFormSubmission } from '@/hooks/use-form-submission'
import { commonOptions } from '@/hooks/use-select-options'
import {
  fetchCountries,
  fetchSkills,
  fetchDepartments,
  transformCountries,
  transformSkills,
  transformDepartments,
  ApiCountry,
  ApiSkill,
  ApiDepartment,
} from '@/lib/api/select-options'

// Form schema for API select examples
const apiFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  
  // Static options
  experienceLevel: z.string().min(1, 'Please select your experience level'),
  
  // API-based options
  country: z.string().min(1, 'Please select a country'),
  primarySkill: z.string().min(1, 'Please select your primary skill'),
  department: z.string().min(1, 'Please select a department'),
})

type ApiFormData = z.infer<typeof apiFormSchema>

// Form actions component
const ApiFormActions: React.FC = () => {
  const { reset, formState, getValues } = useFormContext<ApiFormData>()

  const handleReset = () => {
    reset()
  }

  const handleShowValues = () => {
    const values = getValues()
    // eslint-disable-next-line no-console
    console.log('Current form values:', values)
    alert('Current form values logged to console')
  }

  return (
    <div className="flex flex-wrap gap-4 pt-6">
      <Button type="submit" className="flex-1 min-w-[120px]" disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {formState.isSubmitting ? 'Submitting...' : 'Submit Form'}
      </Button>
      <Button type="button" variant="outline" onClick={handleReset} disabled={formState.isSubmitting}>
        Reset
      </Button>
      <Button type="button" variant="ghost" onClick={handleShowValues} disabled={formState.isSubmitting}>
        Show Values
      </Button>
    </div>
  )
}

export const ApiSelectExamples: React.FC = () => {
  // Setup React Query mutation for form submission
  const formSubmission = useFormSubmission({
    mutationFn: simulateFormSubmission<ApiFormData>,
    options: {
      successMessage: 'API form submitted successfully! 🎉',
      errorMessage: 'Failed to submit form. Please try again.',
      onSuccess: (response, data) => {
        // eslint-disable-next-line no-console
        console.log('API form submitted successfully:', { response, data })
      },
      onError: (error, data) => {
        console.error('API form submission failed:', { error, data })
      },
    },
  })

  const handleSubmit = async (data: ApiFormData): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log('Submitting API form with data:', data)
    await formSubmission.submitAsync(data)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>API-Based Select Fields Example</CardTitle>
        <CardDescription>
          Demonstrates select fields with options loaded from APIs, including loading states, 
          error handling, and retry functionality.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          schema={apiFormSchema}
          onSubmit={handleSubmit}
          defaultValues={{
            name: '',
            email: '',
            experienceLevel: '',
            country: '',
            primarySkill: '',
            department: '',
          }}
        >
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  name="name"
                  label="Full Name"
                  placeholder="Enter your full name"
                  required
                />
                <InputField
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Select Fields Comparison */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Fields Comparison</h3>
              <div className="space-y-6">
                {/* Static Options (Traditional) */}
                <div>
                  <h4 className="text-md font-medium mb-3 text-muted-foreground">
                    Static Options (Traditional)
                  </h4>
                  <SelectField
                    name="experienceLevel"
                    label="Experience Level"
                    placeholder="Select your experience level"
                    options={commonOptions.experienceLevels}
                    description="This uses static options defined in the component"
                    required
                  />
                </div>

                <Separator className="my-6" />

                {/* API-Based Options */}
                <div>
                  <h4 className="text-md font-medium mb-3 text-muted-foreground">
                    API-Based Options (New)
                  </h4>
                  <div className="space-y-6">
                    {/* Countries from API */}
                    <SelectField<ApiCountry[]>
                      name="country"
                      label="Country (Clearable)"
                      placeholder="Select your country"
                      optionsConfig={{
                        apiConfig: {
                          queryKey: ['countries'],
                          queryFn: fetchCountries,
                        },
                        transform: transformCountries,
                      }}
                      description="Countries loaded from API with flags and clear button (simulated 1.5s delay)"
                      clearable
                      required
                    />

                    {/* Skills from API */}
                    <SelectField<ApiSkill[]>
                      name="primarySkill"
                      label="Primary Skill (Clearable)"
                      placeholder="Select your primary skill"
                      optionsConfig={{
                        apiConfig: {
                          queryKey: ['skills'],
                          queryFn: fetchSkills,
                        },
                        transform: transformSkills,
                      }}
                      description="Skills loaded from API with categories and clear button (simulated 1.2s delay)"
                      clearable
                      required
                    />

                    {/* Departments from API */}
                    <SelectField<ApiDepartment[]>
                      name="department"
                      label="Department"
                      placeholder="Select your department"
                      optionsConfig={{
                        apiConfig: {
                          queryKey: ['departments'],
                          queryFn: fetchDepartments,
                        },
                        transform: transformDepartments,
                      }}
                      description="Departments loaded from API (simulated 0.8s delay)"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Form Actions */}
            <ApiFormActions />
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}
