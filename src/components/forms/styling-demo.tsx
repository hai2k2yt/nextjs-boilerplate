"use client"

import React from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  InputField,
  SelectField,
  CheckboxField,
  RadioField,
} from './index'

const demoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  country: z.string().min(1, 'Please select a country'),
  newsletter: z.boolean(),
  plan: z.string().min(1, 'Please select a plan'),
})

type DemoData = z.infer<typeof demoSchema>

export const StylingDemo: React.FC = () => {
  const handleSubmit = (data: DemoData) => {
    console.log('Demo form submitted:', data)
  }

  const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
  ]

  const planOptions = [
    { value: 'basic', label: 'Basic Plan' },
    { value: 'pro', label: 'Pro Plan' },
    { value: 'enterprise', label: 'Enterprise Plan' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Improved Styling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">✅ Improved Styling</CardTitle>
          <CardDescription>
            Clean layout with proper label-top, component-bottom structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            schema={demoSchema}
            onSubmit={handleSubmit}
            defaultValues={{
              name: '',
              email: '',
              country: '',
              newsletter: false,
              plan: '',
            }}
          >
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

            <SelectField
              name="country"
              label="Country"
              placeholder="Select your country"
              options={countryOptions}
              required
            />

            <CheckboxField
              name="newsletter"
              label="Subscribe to our newsletter for updates and promotions"
              description="You can unsubscribe at any time"
            />

            <RadioField
              name="plan"
              label="Choose Your Plan"
              options={planOptions}
              required
            />

            <Button type="submit" className="w-full">
              Submit Form
            </Button>
          </Form>
        </CardContent>
      </Card>

      {/* Styling Features */}
      <Card>
        <CardHeader>
          <CardTitle>🎨 Styling Features</CardTitle>
          <CardDescription>
            Key improvements in the form component styling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Layout Structure</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Labels positioned consistently at the top</li>
              <li>• Form controls properly spaced below labels</li>
              <li>• Error messages appear below controls</li>
              <li>• Optional descriptions between labels and controls</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Spacing & Alignment</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Consistent vertical spacing between form items</li>
              <li>• Proper alignment for checkboxes and radio buttons</li>
              <li>• Responsive grid layouts for multi-column forms</li>
              <li>• Clean visual hierarchy</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Customization</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <code className="text-xs bg-muted px-1 rounded">className</code> for form item container</li>
              <li>• <code className="text-xs bg-muted px-1 rounded">inputClassName</code> for input elements</li>
              <li>• <code className="text-xs bg-muted px-1 rounded">textareaClassName</code> for textarea elements</li>
              <li>• All shadcn/ui styling capabilities</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Accessibility</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Proper ARIA attributes</li>
              <li>• Keyboard navigation support</li>
              <li>• Screen reader friendly</li>
              <li>• Focus management</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
