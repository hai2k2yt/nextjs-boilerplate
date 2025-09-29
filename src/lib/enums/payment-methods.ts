/**
 * Payment Method Enums
 * 
 * This file contains enum constants for payment method IDs to prevent
 * the "V[e.id] is not a function" error by ensuring consistent key mapping
 * between API responses and PaymentMethodLogos object.
 */

/**
 * Payment Method IDs (lowercase for internal use)
 * These match the keys in PaymentMethodLogos object
 */
export enum PaymentMethodId {
  MOMO = 'momo',
  ZALOPAY = 'zalopay', 
  VNPAY = 'vnpay',
  VIETQR = 'vietqr',
  PAYPAL = 'paypal',
  STRIPE = 'stripe'
}

/**
 * Payment Method IDs (uppercase for API/Database)
 * These match the Prisma PaymentMethod enum values
 */
export enum PaymentMethodAPI {
  MOMO = 'MOMO',
  ZALOPAY = 'ZALOPAY',
  VNPAY = 'VNPAY',
  VIETQR = 'VIETQR',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE'
}

/**
 * Payment Provider Names (lowercase for database storage)
 * These match the provider field values in the database
 */
export enum PaymentProvider {
  MOMO = 'momo',
  ZALOPAY = 'zalopay',
  VNPAY = 'vnpay',
  VIETQR = 'vietqr',
  PAYPAL = 'paypal',
  STRIPE = 'stripe'
}

/**
 * Utility class for payment method conversions
 */
export class PaymentMethodUtils {
  /**
   * Convert API payment method (uppercase) to internal ID (lowercase)
   * This prevents the "V[e.id] is not a function" error
   */
  static apiToId(apiMethod: string): PaymentMethodId | null {
    switch (apiMethod.toUpperCase()) {
      case PaymentMethodAPI.MOMO:
        return PaymentMethodId.MOMO
      case PaymentMethodAPI.ZALOPAY:
        return PaymentMethodId.ZALOPAY
      case PaymentMethodAPI.VNPAY:
        return PaymentMethodId.VNPAY
      case PaymentMethodAPI.VIETQR:
        return PaymentMethodId.VIETQR
      case PaymentMethodAPI.PAYPAL:
        return PaymentMethodId.PAYPAL
      case PaymentMethodAPI.STRIPE:
        return PaymentMethodId.STRIPE
      default:
        return null
    }
  }


}
