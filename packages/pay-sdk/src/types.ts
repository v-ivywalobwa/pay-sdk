/** Configuration passed when creating a CashiaPay instance. */
export interface CashiaPayConfig {
  /** Payment amount in the smallest currency unit (e.g. KES cents). */
  amount: number
  /** ISO 4217 currency code, e.g. "KES". */
  currency: string
  /** Your merchant identifier. */
  merchantId: string
  /** Optional idempotency / order reference. */
  reference?: string
  /** Called on successful payment. */
  onSuccess?: (result: PaymentSuccessResult) => void
  /** Called on payment failure. */
  onError?: (error: PaymentError) => void
  /** Called when the user closes the modal without completing. */
  onClose?: () => void
}

export interface PaymentSuccessResult {
  transactionId: string
  amount: number
  currency: string
  reference?: string
}

export interface PaymentError {
  code: string
  message: string
}
