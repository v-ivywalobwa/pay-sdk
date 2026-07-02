'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { CashiaPayConfig } from '@cashia/pay-sdk'
import { CheckoutFlow } from './CheckoutFlow'

export interface CheckoutModalProps
  extends Pick<CashiaPayConfig, 'amount' | 'currency' | 'merchantId' | 'reference'
    | 'onSuccess' | 'onError' | 'onClose'> {
  isOpen: boolean
}

/**
 * Portal-based modal that renders the self-contained checkout UI directly
 * into the document body — no iframe required.
 * Mark parent layouts as Server Components; only this leaf is a Client Component.
 */
export function CheckoutModal({
  isOpen,
  amount,
  currency,
  merchantId,
  reference,
  onSuccess,
  onError,
  onClose,
}: CheckoutModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Create a stable container div on the client
  if (typeof document !== 'undefined' && !containerRef.current) {
    containerRef.current = document.createElement('div')
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    document.body.appendChild(el)
    return () => {
      document.body.removeChild(el)
    }
  }, [])

  if (!isOpen || !containerRef.current) return null

  const handleClose = () => {
    onClose?.()
  }

  const handleSuccess: NonNullable<CashiaPayConfig['onSuccess']> = (result) => {
    onSuccess?.(result)
  }

  const handleError: NonNullable<CashiaPayConfig['onError']> = (error) => {
    onError?.(error)
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cashia Payment"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          width: 440,
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: '#4F46E5',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '0.3px' }}>
            ⚡ Cashia Pay
          </span>
          <button
            aria-label="Close payment"
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              borderRadius: '50%',
              width: 28,
              height: 28,
              cursor: 'pointer',
              fontSize: 13,
              lineHeight: '1',
            }}
          >
            ✕
          </button>
        </div>

        {/* Checkout UI rendered directly — no iframe */}
        <div style={{ padding: 20 }}>
          <CheckoutFlow
            amount={amount}
            currency={currency}
            merchantId={merchantId}
            reference={reference}
            onSuccess={handleSuccess}
            onError={handleError}
            onClose={handleClose}
          />
        </div>
      </div>
    </div>,
    containerRef.current,
  )
}
