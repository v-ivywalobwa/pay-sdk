'use client'

import { useState } from 'react'
import { PayButton } from '@cashia/pay-sdk-react'
import type { PaymentSuccessResult, PaymentError } from '@cashia/pay-sdk-react'

const PRODUCTS = [
  { id: 1, name: 'Premium Subscription', description: '1-month full access', amount: 150000, currency: 'KES', emoji: '⭐' },
  { id: 2, name: 'Data Bundle (5 GB)', description: '30-day validity', amount: 50000, currency: 'KES', emoji: '📶' },
  { id: 3, name: 'Event Ticket', description: 'Annual developer summit', amount: 500000, currency: 'KES', emoji: '🎟' },
]

type Status = { type: 'success'; txnId: string } | { type: 'error'; message: string } | null

function fmt(cents: number, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, minimumFractionDigits: 2 }).format(cents / 100)
}

export default function ShopPage() {
  const [selected, setSelected] = useState(PRODUCTS[0])
  const [status, setStatus] = useState<Status>(null)

  function onSuccess(result: PaymentSuccessResult) {
    setStatus({ type: 'success', txnId: result.transactionId })
  }

  function onError(error: PaymentError) {
    setStatus({ type: 'error', message: error.message })
  }

  function onClose() {
    // modal closed without completing
  }

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>⚡ Cashia Pay — Next.js Demo</h1>
        <p style={{ color: '#6B7280', marginTop: 6 }}>
          Integration example using{' '}
          <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4 }}>@cashia/pay-sdk-react</code>
        </p>
      </div>

      {/* Product grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {PRODUCTS.map((p) => (
          <button
            key={p.id}
            onClick={() => { setSelected(p); setStatus(null) }}
            style={{
              background: selected.id === p.id ? '#EEF2FF' : '#fff',
              border: `2px solid ${selected.id === p.id ? '#4F46E5' : '#E5E7EB'}`,
              borderRadius: 12,
              padding: 16,
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{p.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{p.name}</div>
            <div style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>{p.description}</div>
            <div style={{ fontWeight: 700, color: '#4F46E5', marginTop: 8 }}>{fmt(p.amount, p.currency)}</div>
          </button>
        ))}
      </div>

      {/* Checkout card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.emoji} {selected.name}</div>
            <div style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>{selected.description}</div>
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: '#4F46E5' }}>{fmt(selected.amount, selected.currency)}</div>
        </div>

        {/* React component usage */}
        <PayButton
          amount={selected.amount}
          currency={selected.currency}
          merchantId="demo-merchant"
          reference={`ORDER-${selected.id}-${Date.now()}`}
          onSuccess={onSuccess}
          onError={onError}
          onClose={onClose}
        />
      </div>

      {/* Status banner */}
      {status?.type === 'success' && (
        <div
          style={{
            background: '#ECFDF5',
            border: '1px solid #6EE7B7',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <div style={{ fontWeight: 700, color: '#065F46' }}>Payment successful!</div>
            <div style={{ color: '#047857', fontSize: 13, fontFamily: 'monospace' }}>{status.txnId}</div>
          </div>
          <button
            onClick={() => setStatus(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6B7280' }}
          >
            ✕
          </button>
        </div>
      )}

      {status?.type === 'error' && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 22 }}>❌</span>
          <div>
            <div style={{ fontWeight: 700, color: '#991B1B' }}>Payment failed</div>
            <div style={{ color: '#B91C1C', fontSize: 13 }}>{status.message}</div>
          </div>
          <button
            onClick={() => setStatus(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6B7280' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Usage snippet */}
      <details style={{ marginTop: 32 }}>
        <summary style={{ cursor: 'pointer', color: '#6B7280', fontSize: 14, userSelect: 'none' }}>
          📄 View integration code
        </summary>
        <pre
          style={{
            background: '#1E1E2E',
            color: '#CDD6F4',
            borderRadius: 12,
            padding: 20,
            fontSize: 13,
            overflow: 'auto',
            marginTop: 12,
          }}
        >
{`import { PayButton } from '@cashia/pay-sdk-react'

<PayButton
  amount={${selected.amount}}         // smallest unit (KES cents)
  currency="${selected.currency}"
  merchantId="my-merchant"
  onSuccess={(result) => console.log(result.transactionId)}
  onError={(err)    => console.error(err.message)}
/>`}
        </pre>
      </details>
    </main>
  )
}
