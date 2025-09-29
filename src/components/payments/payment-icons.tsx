import React from 'react'
import { cn } from '@/lib/utils'
import { PaymentMethodId } from '@/lib/enums/payment-methods'

interface PaymentIconProps {
  className?: string
}

// PayPal Icon
export function PayPalIcon({ className }: PaymentIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("w-6 h-6", className)}
      fill="currentColor"
    >
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm1.565-8.834a.9.9 0 0 1 .9-.9h2.19c2.8 0 4.906-.969 5.748-4.4.064-.26.115-.52.152-.781.152-1.073-.042-1.810-.631-2.4-.589-.59-1.593-.9-3.058-.9H7.565a.9.9 0 0 0-.9.9l-1.565 8.481z"/>
    </svg>
  )
}

// Stripe Icon
export function StripeIcon({ className }: PaymentIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("w-6 h-6", className)}
      fill="currentColor"
    >
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.274 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
    </svg>
  )
}

// Generic Credit Card Icon
export function CreditCardIcon({ className }: PaymentIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("w-6 h-6", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )
}

// Mobile Phone Icon
export function MobileIcon({ className }: PaymentIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("w-6 h-6", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  )
}

// QR Code Icon
export function QRCodeIcon({ className }: PaymentIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("w-6 h-6", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="5" height="5"/>
      <rect x="16" y="3" width="5" height="5"/>
      <rect x="3" y="16" width="5" height="5"/>
      <path d="m21 16-3.5 3.5-2.5-2.5"/>
      <path d="M21 21v.01"/>
      <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
      <path d="M3 12h.01"/>
      <path d="M12 3h.01"/>
      <path d="M12 16v.01"/>
      <path d="M16 12h1"/>
      <path d="M21 12v.01"/>
      <path d="M12 21v-1"/>
    </svg>
  )
}

// Lightning Icon for Fast Payment
export function LightningIcon({ className }: PaymentIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("w-6 h-6", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
    </svg>
  )
}

// Payment method logo components with proper branding colors
export const PaymentMethodLogos = {
  [PaymentMethodId.MOMO]: ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
    <div className={cn(
      "rounded-lg flex items-center justify-center bg-gradient-to-br from-pink-500 to-pink-600",
      size === 'sm' && "w-8 h-8",
      size === 'md' && "w-10 h-10",
      size === 'lg' && "w-12 h-12"
    )}>
      <MobileIcon className={cn(
        "text-white",
        size === 'sm' && "w-4 h-4",
        size === 'md' && "w-5 h-5",
        size === 'lg' && "w-6 h-6"
      )} />
    </div>
  ),
  [PaymentMethodId.ZALOPAY]: ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
    <div className={cn(
      "rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600",
      size === 'sm' && "w-8 h-8",
      size === 'md' && "w-10 h-10",
      size === 'lg' && "w-12 h-12"
    )}>
      <LightningIcon className={cn(
        "text-white",
        size === 'sm' && "w-4 h-4",
        size === 'md' && "w-5 h-5",
        size === 'lg' && "w-6 h-6"
      )} />
    </div>
  ),
  [PaymentMethodId.VNPAY]: ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
    <div className={cn(
      "rounded-lg flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600",
      size === 'sm' && "w-8 h-8",
      size === 'md' && "w-10 h-10",
      size === 'lg' && "w-12 h-12"
    )}>
      <CreditCardIcon className={cn(
        "text-white",
        size === 'sm' && "w-4 h-4",
        size === 'md' && "w-5 h-5",
        size === 'lg' && "w-6 h-6"
      )} />
    </div>
  ),
  [PaymentMethodId.VIETQR]: ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
    <div className={cn(
      "rounded-lg flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600",
      size === 'sm' && "w-8 h-8",
      size === 'md' && "w-10 h-10",
      size === 'lg' && "w-12 h-12"
    )}>
      <QRCodeIcon className={cn(
        "text-white",
        size === 'sm' && "w-4 h-4",
        size === 'md' && "w-5 h-5",
        size === 'lg' && "w-6 h-6"
      )} />
    </div>
  ),
  [PaymentMethodId.PAYPAL]: ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
    <div className={cn(
      "rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700",
      size === 'sm' && "w-8 h-8",
      size === 'md' && "w-10 h-10",
      size === 'lg' && "w-12 h-12"
    )}>
      <PayPalIcon className={cn(
        "text-white",
        size === 'sm' && "w-4 h-4",
        size === 'md' && "w-5 h-5",
        size === 'lg' && "w-6 h-6"
      )} />
    </div>
  ),
  [PaymentMethodId.STRIPE]: ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
    <div className={cn(
      "rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-700",
      size === 'sm' && "w-8 h-8",
      size === 'md' && "w-10 h-10",
      size === 'lg' && "w-12 h-12"
    )}>
      <StripeIcon className={cn(
        "text-white",
        size === 'sm' && "w-4 h-4",
        size === 'md' && "w-5 h-5",
        size === 'lg' && "w-6 h-6"
      )} />
    </div>
  )
}
