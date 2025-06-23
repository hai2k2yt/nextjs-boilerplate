"use client"

import React from 'react'
import { z } from 'zod'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import {
  Form,
  InputField,
  SelectField,
  TextareaField,
  CheckboxField,
  RadioField,
  DatePickerField,
} from './index'
import { useFormSubmission, simulateFormSubmission } from '@/hooks/use-form-submission'

// Define the form schema using Zod
const formSchema = z.object({
  // Text inputs
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  age: z.number().min(18, 'Must be at least 18 years old').max(120, 'Must be less than 120 years old'),
  
  // Select
  country: z.string().min(1, 'Please select a country'),
  
  // Textarea
  bio: z.string().min(10, 'Bio must be at least 10 characters').optional(),
  
  // Single checkbox
  agreeToTerms: z.boolean().refine((val) => val, 'You must agree to the terms'),
  
  // Multiple checkboxes
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
  
  // Radio
  gender: z.string().min(1, 'Please select a gender'),
  
  // Date picker
  birthDate: z.date({
    required_error: 'Please select your birth date',
  }),
})

type FormData = z.infer<typeof formSchema>

// Component that uses the form context directly
const FormControls: React.FC = () => {
  const { reset, formState } = useFormContext<FormData>()

  const handleReset = () => {
    reset()
  }

  return (
    <div className="flex gap-4 pt-6">
      <Button type="submit" className="flex-1" disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {formState.isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
      <Button type="button" variant="outline" onClick={handleReset} disabled={formState.isSubmitting}>
        Reset
      </Button>
    </div>
  )
}

export const FormExample: React.FC = () => {
  // Setup React Query mutation for form submission
  const formSubmission = useFormSubmission({
    mutationFn: simulateFormSubmission<FormData>,
    options: {
      successMessage: 'Example form submitted successfully! 🎉',
      onSuccess: (response, data) => {
        console.log('Example form submitted:', { response, data })
      },
    },
  })

  const handleSubmit = async (data: FormData): Promise<void> => {
    console.log('Submitting example form:', data)
    // Return the promise so React Hook Form can track isSubmitting
    await formSubmission.submitAsync(data)
  }

  const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
  ]

  const interestOptions = [
    { value: 'technology', label: 'Technology' },
    { value: 'sports', label: 'Sports' },
    { value: 'music', label: 'Music' },
    { value: 'travel', label: 'Travel' },
    { value: 'cooking', label: 'Cooking' },
  ]

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Form Example</CardTitle>
        <CardDescription>
          A comprehensive example showing all form components with Zod validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          schema={formSchema}
          onSubmit={handleSubmit}
          defaultValues={{
            firstName: '',
            lastName: '',
            email: '',
            age: 0,
            country: '',
            bio: '',
            agreeToTerms: false,
            interests: [],
            gender: '',
          }}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <InputField
                  name="firstName"
                  label="First Name"
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <InputField
                  name="lastName"
                  label="Last Name"
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <InputField
                name="email"
                label="Email"
                type="email"
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="space-y-2">
              <InputField
                name="age"
                label="Age"
                type="number"
                placeholder="Enter your age"
                required
              />
            </div>

            <div className="space-y-2">
              <SelectField
                name="country"
                label="Country"
                placeholder="Select your country"
                options={countryOptions}
                required
              />
            </div>

            <div className="space-y-2">
              <TextareaField
                name="bio"
                label="Bio"
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <CheckboxField
                name="agreeToTerms"
                label="I agree to the terms and conditions"
                required
              />
            </div>

            <div className="space-y-2">
              <CheckboxField
                name="interests"
                label="Interests"
                description="Select all that apply"
                options={interestOptions}
                required
              />
            </div>

            <div className="space-y-2">
              <RadioField
                name="gender"
                label="Gender"
                options={genderOptions}
                required
              />
            </div>

            <div className="space-y-2">
              <DatePickerField
                name="birthDate"
                label="Birth Date"
                placeholder="Select your birth date"
                required
                toDate={new Date()}
              />
            </div>
          </div>

          <FormControls />
        </Form>
      </CardContent>
    </Card>
  )
}
