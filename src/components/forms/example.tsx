"use client"

import React, { useRef } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormRef,
  InputField,
  SelectField,
  TextareaField,
  CheckboxField,
  RadioField,
  DatePickerField,
} from './index'

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

export const FormExample: React.FC = () => {
  const formRef = useRef<FormRef<FormData>>(null)

  const handleSubmit = (data: FormData) => {
    console.log('Form submitted:', data)
    alert('Form submitted successfully! Check the console for data.')
  }

  const handleReset = () => {
    formRef.current?.reset()
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
          ref={formRef}
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

          <div className="flex gap-4 pt-6">
            <Button type="submit" className="flex-1">
              Submit
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}
