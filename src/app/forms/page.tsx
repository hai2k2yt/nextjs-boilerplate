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
  InputField,
  SelectField,
  TextareaField,
  CheckboxField,
  RadioField,
  DatePickerField,
  ApiSelectExamples,
} from '@/components/forms'
import { useFormSubmission, simulateFormSubmission } from '@/hooks/use-form-submission'
import { commonOptions } from '@/hooks/use-select-options'
import { fetchCountries, transformCountries, ApiCountry } from '@/lib/api/select-options'

// Define comprehensive form schema
const formSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  age: z.number().min(18, 'Must be at least 18 years old').max(120, 'Must be less than 120 years old'),
  
  // Address Information
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  country: z.string().min(1, 'Please select a country'),
  zipCode: z.string().min(5, 'ZIP code must be at least 5 characters'),
  
  // Preferences
  bio: z.string().min(10, 'Bio must be at least 10 characters').optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  
  // Agreements and Preferences
  agreeToTerms: z.boolean().refine((val) => val, 'You must agree to the terms'),
  subscribeNewsletter: z.boolean().optional(),
  
  // Multiple selections
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
  skills: z.array(z.string()).optional(),
  
  // Single selections
  gender: z.string().min(1, 'Please select a gender'),
  experienceLevel: z.string().min(1, 'Please select your experience level'),
  preferredContact: z.string().min(1, 'Please select preferred contact method'),
  
  // Dates
  birthDate: z.date({
    required_error: 'Please select your birth date',
  }),
  availableFrom: z.date().optional(),
})

type FormData = z.infer<typeof formSchema>

// Component for form actions using the form context
const FormActions: React.FC = () => {
  const { reset, formState, getValues, trigger } = useFormContext<FormData>()

  const handleReset = () => {
    reset()
  }

  const handleValidateAll = async () => {
    const isValid = await trigger()
    if (isValid) {
      alert('All fields are valid!')
    } else {
      alert('Please fix the validation errors')
    }
  }

  const handleShowValues = () => {
    const values = getValues()
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
      <Button type="button" variant="secondary" onClick={handleValidateAll} disabled={formState.isSubmitting}>
        Validate All
      </Button>
      <Button type="button" variant="ghost" onClick={handleShowValues} disabled={formState.isSubmitting}>
        Show Values
      </Button>
    </div>
  )
}

// Form status component
const FormStatus: React.FC = () => {
  const { formState } = useFormContext<FormData>()

  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div>Form Status:</div>
      <div className="grid grid-cols-2 gap-2">
        <span>Valid: {formState.isValid ? '✅' : '❌'}</span>
        <span>Dirty: {formState.isDirty ? '✅' : '❌'}</span>
        <span>Submitting: {formState.isSubmitting ? '✅' : '❌'}</span>
        <span>Validating: {formState.isValidating ? '✅' : '❌'}</span>
      </div>
      {formState.isSubmitting && (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Processing with React Query + React Hook Form...</span>
        </div>
      )}
    </div>
  )
}

export default function FormsPage() {
  // Setup React Query mutation for form submission
  const formSubmission = useFormSubmission({
    mutationFn: simulateFormSubmission<FormData>,
    options: {
      successMessage: 'Form submitted successfully! 🎉',
      errorMessage: 'Failed to submit form. Please try again.',
      onSuccess: (response, data) => {
        console.log('Form submitted successfully:', { response, data })
      },
      onError: (error, data) => {
        console.error('Form submission failed:', { error, data })
      },
    },
  })

  const handleSubmit = async (data: FormData): Promise<void> => {
    console.log('Submitting form with data:', data)
    // Return the promise so React Hook Form can track isSubmitting
    await formSubmission.submitAsync(data)
  }

  // Options for select fields - now using commonOptions from the hook
  const interestOptions = [
    { value: 'technology', label: 'Technology' },
    { value: 'sports', label: 'Sports' },
    { value: 'music', label: 'Music' },
    { value: 'travel', label: 'Travel' },
    { value: 'cooking', label: 'Cooking' },
    { value: 'reading', label: 'Reading' },
    { value: 'gaming', label: 'Gaming' },
  ]

  const skillOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'react', label: 'React' },
    { value: 'nodejs', label: 'Node.js' },
    { value: 'python', label: 'Python' },
    { value: 'design', label: 'UI/UX Design' },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Form Components Example</h1>
          <p className="text-muted-foreground mt-2">
            A comprehensive example showcasing all form components with React Hook Form context and hooks.
            No more useImperativeHandle - everything is handled through context!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complete Form Example</CardTitle>
            <CardDescription>
              This form demonstrates all available form components with validation, 
              form state management, and various input types.
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
                phone: '',
                age: 18,
                address: '',
                city: '',
                country: '',
                zipCode: '',
                bio: '',
                website: '',
                agreeToTerms: false,
                subscribeNewsletter: false,
                interests: [],
                skills: [],
                gender: '',
                experienceLevel: '',
                preferredContact: '',
                birthDate: new Date(),
              }}
            >
              <div className="space-y-8">
                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      name="firstName"
                      label="First Name"
                      placeholder="Enter your first name"
                      required
                    />
                    <InputField
                      name="lastName"
                      label="Last Name"
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <InputField
                      name="email"
                      label="Email Address"
                      type="email"
                      placeholder="Enter your email"
                      required
                    />
                    <InputField
                      name="phone"
                      label="Phone Number"
                      type="tel"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>

                  <div className="mt-6">
                    <InputField
                      name="age"
                      label="Age"
                      type="number"
                      placeholder="Enter your age"
                      min={18}
                      max={120}
                      required
                    />
                  </div>
                </div>

                <Separator />

                {/* Address Information Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                  <div className="space-y-6">
                    <InputField
                      name="address"
                      label="Street Address"
                      placeholder="Enter your street address"
                      required
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <InputField
                        name="city"
                        label="City"
                        placeholder="Enter your city"
                        required
                      />
                      <SelectField<ApiCountry[]>
                        name="country"
                        label="Country (API-based with Clear Button)"
                        placeholder="Select your country"
                        optionsConfig={{
                          apiConfig: {
                            queryKey: ['countries'],
                            queryFn: fetchCountries,
                          },
                          transform: transformCountries,
                        }}
                        description="Countries loaded from API with loading state and clearable functionality"
                        clearable
                        required
                      />
                      <InputField
                        name="zipCode"
                        label="ZIP Code"
                        placeholder="Enter ZIP code"
                        required
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Information Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                  <div className="space-y-6">
                    <TextareaField
                      name="bio"
                      label="Bio"
                      placeholder="Tell us about yourself..."
                      rows={4}
                      description="Optional: Share a brief description about yourself"
                    />
                    
                    <InputField
                      name="website"
                      label="Website"
                      type="url"
                      placeholder="https://your-website.com"
                      description="Optional: Your personal or professional website"
                    />
                  </div>
                </div>

                <Separator />

                {/* Preferences Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Preferences & Selections</h3>
                  <div className="space-y-6">
                    <CheckboxField
                      name="interests"
                      label="Interests"
                      description="Select all that apply"
                      options={interestOptions}
                      required
                    />

                    <CheckboxField
                      name="skills"
                      label="Technical Skills"
                      description="Optional: Select your technical skills"
                      options={skillOptions}
                    />

                    <RadioField
                      name="gender"
                      label="Gender"
                      options={commonOptions.genders}
                      required
                    />

                    <SelectField
                      name="experienceLevel"
                      label="Experience Level (Clearable)"
                      placeholder="Select your experience level"
                      options={commonOptions.experienceLevels}
                      clearable
                      required
                    />

                    <RadioField
                      name="preferredContact"
                      label="Preferred Contact Method"
                      options={commonOptions.contactMethods}
                      required
                    />
                  </div>
                </div>

                <Separator />

                {/* Dates Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Important Dates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DatePickerField
                      name="birthDate"
                      label="Birth Date"
                      placeholder="Select your birth date"
                      required
                      toDate={new Date()}
                    />
                    
                    <DatePickerField
                      name="availableFrom"
                      label="Available From"
                      placeholder="Select availability date"
                      description="Optional: When are you available to start?"
                      fromDate={new Date()}
                    />
                  </div>
                </div>

                <Separator />

                {/* Agreements Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Agreements</h3>
                  <div className="space-y-4">
                    <CheckboxField
                      name="agreeToTerms"
                      label="I agree to the terms and conditions"
                      required
                    />
                    
                    <CheckboxField
                      name="subscribeNewsletter"
                      label="Subscribe to our newsletter"
                      description="Optional: Receive updates and news"
                    />
                  </div>
                </div>

                <Separator />

                {/* Form Status */}
                <FormStatus />

                {/* Form Actions */}
                <FormActions />
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* API Select Examples */}
        <div className="mt-12">
          <ApiSelectExamples />
        </div>
      </div>
    </div>
  )
}
