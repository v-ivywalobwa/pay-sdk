import { useCallback, useState } from 'react'
import type { CashiaPayConfig } from '@cashia/pay-sdk'

/**
 * Manages checkout modal open/close state.
 * Returns `open`, `close`, `isOpen`, and the stored `config` —
 * spread `config` and `isOpen` onto `<CheckoutModal>` to render the checkout.
 *
 * @example
 * ```tsx
 * const { open, close, isOpen, config } = useCashiaPay({ amount, currency, merchantId })
 * return (
 *   <>
 *     <button onClick={open}>Pay</button>
 *     <CheckoutModal isOpen={isOpen} {...config} onClose={close} />
 *   </>
 * )
 * ```
 */
export function useCashiaPay(config: CashiaPayConfig) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return { open, close, isOpen, config }
}
