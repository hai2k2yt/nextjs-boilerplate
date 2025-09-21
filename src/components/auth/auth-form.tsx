'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

// Password validation helper component
function PasswordValidationDisplay({ password, errors }: { password: string; errors?: string }) {
  const requirements = [
    { test: password.length >= 8, text: 'At least 8 characters' },
    { test: /(?=.*[a-z])/.test(password), text: 'One lowercase letter' },
    { test: /(?=.*[A-Z])/.test(password), text: 'One uppercase letter' },
    { test: /(?=.*\d)/.test(password), text: 'One number' },
    { test: /(?=.*[@$!%*?&])/.test(password), text: 'One special character (@$!%*?&)' },
  ]

  if (!password && !errors) return null

  return (
    <div className="space-y-1">
      {errors && (
        <p className="text-sm text-red-500">{errors}</p>
      )}
      {password && (
        <div className="text-xs space-y-1">
          <p className="text-muted-foreground">Password requirements:</p>
          {requirements.map((req, index) => (
            <div key={index} className={`flex items-center gap-2 ${req.test ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="text-xs">{req.test ? '✓' : '○'}</span>
              <span>{req.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AuthFormContent() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const registerMutation = trpc.auth.register.useMutation()

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange', // Enable real-time validation
    reValidateMode: 'onChange', // Re-validate on every change
  })

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange', // Enable real-time validation
    reValidateMode: 'onChange', // Re-validate on every change
  })

  // Clear server errors when user starts typing
  const clearServerError = (fieldName: keyof RegisterFormData) => {
    if (registerForm.formState.errors[fieldName]?.type === 'server') {
      registerForm.clearErrors(fieldName)
    }
    if (registerForm.formState.errors.root?.type === 'server') {
      registerForm.clearErrors('root')
    }
  }

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard'

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        })
      } else if (result?.ok) {
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        })
        // Redirect to the intended page or dashboard
        router.push(callbackUrl)
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onRegister = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await registerMutation.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
      })

      toast({
        title: 'Success',
        description: 'Account created successfully. You can now log in.',
      })

      // Switch to login tab and pre-fill email
      loginForm.setValue('email', data.email)
      registerForm.reset()
    } catch (error: any) {
      // Handle specific field errors
      if (error.message?.includes('email')) {
        registerForm.setError('email', {
          type: 'server',
          message: error.message.includes('already exists')
            ? 'An account with this email already exists'
            : 'Invalid email address'
        })
      } else if (error.message?.includes('password')) {
        registerForm.setError('password', {
          type: 'server',
          message: error.message
        })
      } else if (error.message?.includes('name')) {
        registerForm.setError('name', {
          type: 'server',
          message: error.message
        })
      } else {
        // For general errors, show under the submit button
        registerForm.setError('root', {
          type: 'server',
          message: error.message || 'An error occurred during registration'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Enter your name"
                    {...registerForm.register('name', {
                      onChange: () => clearServerError('name')
                    })}
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    {...registerForm.register('email', {
                      onChange: () => clearServerError('email')
                    })}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Enter your password"
                    {...registerForm.register('password', {
                      onChange: () => clearServerError('password')
                    })}
                  />
                  <PasswordValidationDisplay
                    password={registerForm.watch('password') || ''}
                    errors={registerForm.formState.errors.password?.message}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirm Password</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    {...registerForm.register('confirmPassword', {
                      onChange: () => clearServerError('confirmPassword')
                    })}
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* General error display */}
                {registerForm.formState.errors.root && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                    {registerForm.formState.errors.root.message}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signIn('google')}
                disabled={isLoading}
              >
                Continue with Google
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signIn('discord')}
                disabled={isLoading}
              >
                Continue with Discord
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AuthForm() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <AuthFormContent />
    </Suspense>
  )
}
