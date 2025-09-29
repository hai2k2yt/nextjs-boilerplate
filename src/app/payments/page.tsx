'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

import { CreditCard, Globe, MapPin } from 'lucide-react'
import { VietnamesePaymentMethods } from '@/components/payments/vietnamese-payment-methods'
import { InternationalPaymentMethods } from '@/components/payments/international-payment-methods'

export default function PaymentsPage() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  // Sample order data - in a real app, this would come from props or context
  const orderData = {
    amount: 10298, // $102.98 in cents
    currency: 'USD',
    description: 'Sample order payment',
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CreditCard className="h-8 w-8" />
            Payment Methods
          </h1>
          <p className="text-muted-foreground mt-2">
            Choose your preferred payment method to complete your transaction
          </p>
        </div>

        {/* Payment Amount Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="text-2xl font-bold">$99.99</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">Processing Fee:</span>
              <span className="text-sm">$2.99</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Final Total:</span>
              <span className="text-xl font-bold text-primary">$102.98</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Tabs */}
        <Tabs defaultValue="vietnamese" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vietnamese" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Vietnamese Methods
              <Badge variant="secondary" className="ml-2">4</Badge>
            </TabsTrigger>
            <TabsTrigger value="international" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              International Methods
              <Badge variant="secondary" className="ml-2">2</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vietnamese" className="mt-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Vietnamese Payment Methods
                  </CardTitle>
                  <CardDescription>
                    Popular payment methods in Vietnam with instant processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VietnamesePaymentMethods
                    selectedMethod={selectedMethod}
                    onMethodSelect={setSelectedMethod}
                    amount={orderData.amount}
                    currency={orderData.currency}
                    description={orderData.description}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="international" className="mt-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    International Payment Methods
                  </CardTitle>
                  <CardDescription>
                    Secure global payment options with worldwide acceptance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InternationalPaymentMethods
                    selectedMethod={selectedMethod}
                    onMethodSelect={setSelectedMethod}
                    amount={orderData.amount}
                    currency={orderData.currency}
                    description={orderData.description}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
