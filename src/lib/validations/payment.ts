import { z } from 'zod'
import { PaymentMethod } from '@prisma/client'
import { VNPayIPNData } from '@/lib/payments/providers/vnpay'

// Base payment validation schemas
export const createPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3, 'Currency must be 3 characters'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

// Payment webhook validation (for MoMo IPN)
export const momoWebhookSchema = z.object({
  partnerCode: z.string(),
  orderId: z.string(),
  requestId: z.string(),
  amount: z.number(),
  orderInfo: z.string(),
  orderType: z.string(),
  transId: z.number(),
  resultCode: z.number(),
  message: z.string(),
  payType: z.string(),
  responseTime: z.number(),
  extraData: z.string(),
  signature: z.string(),
})

// VNPay webhook validation (for VNPay IPN)
export const vnpayWebhookSchema = z.object({
  vnp_TmnCode: z.string(),
  vnp_Amount: z.number(),
  vnp_BankCode: z.string(),
  vnp_BankTranNo: z.string(),
  vnp_CardType: z.string(),
  vnp_OrderInfo: z.string(),
  vnp_PayDate: z.string(),
  vnp_ResponseCode: z.string(),
  vnp_TransactionNo: z.string(),
  vnp_TransactionStatus: z.string(),
  vnp_TxnRef: z.string(),
  vnp_SecureHashType: z.string(),
  vnp_SecureHash: z.string(),
}) satisfies z.ZodType<VNPayIPNData>
