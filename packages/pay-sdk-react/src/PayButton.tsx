'use client'

import type { ButtonHTMLAttributes } from 'react'
import type { CashiaPayConfig, PaymentSuccessResult, PaymentError } from '@cashia/pay-sdk'
import { useCashiaPay } from './useCashiaPay'
import { CheckoutModal } from './CheckoutModal'

interface PayButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'onError' | 'onClose'> {
  amount: number
  currency: string
  merchantId: string
  reference?: string
  /** Override the button label. Defaults to "Pay <formatted amount>". */
  label?: string
  onSuccess?: (result: PaymentSuccessResult) => void
  onError?: (error: PaymentError) => void
  onClose?: () => void
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount / 100)
  } catch {
    return `${currency} ${(amount / 100).toFixed(2)}`
  }
}

/**
 * Drop-in payment button.
 * Opens the self-contained Cashia payment modal on click — no iframe required.
 *
 * @example
 * ```tsx
 * <PayButton
 *   amount={150000}
 *   currency="KES"
 *   merchantId="my-merchant"
 *   onSuccess={(r) => console.log('paid', r)}
 * />
 * ```
 */
export function PayButton({
  label,
  amount,
  currency,
  merchantId,
  reference,
  onSuccess,
  onError,
  onClose,
  style,
  ...rest
}: PayButtonProps) {
  const config: CashiaPayConfig = { amount, currency, merchantId, reference, onSuccess, onError, onClose }
  const { open, close, isOpen } = useCashiaPay(config)

  function handleSuccess(result: PaymentSuccessResult) {
    onSuccess?.(result)
    close()
  }

  function handleError(error: PaymentError) {
    onError?.(error)
    close()
  }

  function handleClose() {
    onClose?.()
    close()
  }

  return (
    <>
      <button
        {...rest}
        onClick={open}
        style={{
          background: '#4F46E5',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 28px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
          transition: 'background 0.15s',
          ...style,
        }}
      >
        {label ?? `Pay ${formatAmount(amount, currency)}`}
      </button>

      <CheckoutModal
        isOpen={isOpen}
        amount={amount}
        currency={currency}
        merchantId={merchantId}
        reference={reference}
        onSuccess={handleSuccess}
        onError={handleError}
        onClose={handleClose}
      />
    </>
  )
}
