'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CashiaPayConfig, PaymentSuccessResult, PaymentError } from '@cashia/pay-sdk'

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen =
  | 'detecting'
  | 'demo-selector'
  | 'payment'
  | 'insufficient'
  | 'topup'
  | 'topup-pending'
  | 'new-id'
  | 'new-phone'
  | 'new-topup'
  | 'new-topup-pending'
  | 'success'

interface MockUser {
  name: string
  phone: string
  balance: number
}

// ── Mock data (demo flow) ────────────────────────────────────────────────────

const MOCK_USER_SUFFICIENT: MockUser = { name: 'John Doe', phone: '0712 345 678', balance: 500000 }
const MOCK_USER_INSUFFICIENT: MockUser = { name: 'Jane Smith', phone: '0798 765 432', balance: 50000 }
const CORRECT_PIN = '1234'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(amountCents: number, currency = 'KES'): string {
  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amountCents / 100)
  } catch {
    return `${currency} ${(amountCents / 100).toFixed(2)}`
  }
}

function txnId() {
  return 'TXN-' + Math.random().toString(36).slice(2, 9).toUpperCase()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, width: '100%', boxSizing: 'border-box' }}>
      {children}
    </div>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
      {children}
    </h2>
  )
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280' }}>{children}</p>
}

function Btn({
  children,
  onClick,
  variant = 'primary',
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  disabled?: boolean
}) {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary:   { background: '#4F46E5', color: '#fff' },
    secondary: { background: '#F3F4F6', color: '#374151' },
    danger:    { background: '#FEE2E2', color: '#DC2626' },
    ghost:     { background: 'transparent', color: '#4F46E5', textDecoration: 'underline' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variantStyles[variant],
        border: 'none',
        borderRadius: 10,
        padding: variant === 'ghost' ? '6px 0' : '13px 24px',
        fontSize: 15,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: '100%',
        marginBottom: 10,
        fontFamily: 'inherit',
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid #F3F4F6', margin: '16px 0' }} />
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        border: '1.5px solid #E5E7EB',
        borderRadius: 10,
        padding: '12px 14px',
        fontSize: 16,
        fontFamily: 'inherit',
        outline: 'none',
        marginBottom: 12,
      }}
    />
  )
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 20,
        height: 20,
        border: '2px solid rgba(255,255,255,0.4)',
        borderTop: '2px solid #fff',
        borderRadius: '50%',
        animation: 'cashia-spin 0.7s linear infinite',
      }}
    />
  )
}

function PinPad({
  pin,
  onDigit,
  onDelete,
}: {
  pin: string
  onDigit: (d: string) => void
  onDelete: () => void
}) {
  const MAX = 4
  const dots = Array.from({ length: MAX }, (_, i) => (
    <span
      key={i}
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '2px solid #4F46E5',
        background: i < pin.length ? '#4F46E5' : 'transparent',
        transition: 'background 0.1s',
      }}
    />
  ))

  const keys = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']]

  function Key({ k }: { k: string }) {
    if (!k) return <div style={{ width: 60, height: 60 }} />
    const isDel = k === '⌫'
    return (
      <button
        onClick={() => (isDel ? onDelete() : pin.length < MAX && onDigit(k))}
        style={{
          width: 60,
          height: 60,
          borderRadius: 12,
          border: 'none',
          background: isDel ? '#FEE2E2' : '#F3F4F6',
          color: isDel ? '#DC2626' : '#111827',
          fontSize: isDel ? 18 : 22,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {k}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>{dots}</div>
      {keys.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: 12 }}>
          {row.map((k, ki) => (
            <Key key={ki} k={k} />
          ))}
        </div>
      ))}
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
      <span style={{ color: '#6B7280' }}>{label}</span>
      <span style={{ fontWeight: highlight ? 700 : 500, color: highlight ? '#DC2626' : '#111827' }}>
        {value}
      </span>
    </div>
  )
}

// ── CheckoutFlow ──────────────────────────────────────────────────────────────

export interface CheckoutFlowProps
  extends Pick<CashiaPayConfig, 'amount' | 'currency' | 'merchantId' | 'reference'> {
  onSuccess: (result: PaymentSuccessResult) => void
  onError: (error: PaymentError) => void
  onClose: () => void
}

/**
 * Self-contained checkout UI rendered directly in the modal.
 * Uses callbacks instead of postMessage — no iframe required.
 */
export function CheckoutFlow({
  amount,
  currency,
  merchantId,
  reference,
  onSuccess,
  onError,
  onClose,
}: CheckoutFlowProps) {
  const [screen, setScreen] = useState<Screen>('detecting')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [topupAmount, setTopupAmount] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [mockUser, setMockUser] = useState<MockUser>(MOCK_USER_SUFFICIENT)
  const [finalTxnId, setFinalTxnId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Auto-advance from detecting → demo-selector
  useEffect(() => {
    if (screen !== 'detecting') return
    const t = setTimeout(() => setScreen('demo-selector'), 1500)
    return () => clearTimeout(t)
  }, [screen])

  // ── PIN submit ─────────────────────────────────────────────────────────────

  const submitPin = useCallback(() => {
    if (pin !== CORRECT_PIN) {
      setPinError('Incorrect PIN. Please try again.')
      setPin('')
      return
    }
    setPinError('')
    const id = txnId()
    setFinalTxnId(id)
    onSuccess({ transactionId: id, amount, currency, reference })
    setScreen('success')
  }, [pin, amount, currency, reference, onSuccess])

  useEffect(() => {
    if (pin.length === 4) submitPin()
  }, [pin, submitPin])

  // ── Topup helpers ──────────────────────────────────────────────────────────

  function startTopup(target: 'topup' | 'new-topup') {
    const shortfall = amount - mockUser.balance
    setTopupAmount(String(Math.max(100, Math.ceil(shortfall / 100))))
    setScreen(target)
  }

  function simulateTopupSent(next: 'topup-pending' | 'new-topup-pending') {
    setIsLoading(true)
    setTimeout(() => { setIsLoading(false); setScreen(next) }, 800)
  }

  function completeTopup() {
    setIsLoading(true)
    setTimeout(() => {
      const topped = Math.round(Number(topupAmount) * 100)
      setMockUser((u) => ({ ...u, balance: u.balance + topped }))
      setIsLoading(false)
      setScreen('payment')
    }, 1200)
  }

  // ── Screens ────────────────────────────────────────────────────────────────

  const amountLabel = fmt(amount, currency)
  const balanceLabel = fmt(mockUser.balance, currency)
  const shortfall = fmt(Math.max(0, amount - mockUser.balance), currency)

  function renderDetecting() {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div
            style={{
              width: 48, height: 48,
              border: '3px solid #E5E7EB', borderTop: '3px solid #4F46E5',
              borderRadius: '50%', animation: 'cashia-spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#6B7280', fontSize: 15 }}>Verifying your account…</p>
        </div>
      </Card>
    )
  }

  function renderDemoSelector() {
    return (
      <Card>
        <div
          style={{
            background: '#EEF2FF', borderRadius: 10, padding: '10px 14px',
            marginBottom: 20, fontSize: 13, color: '#4338CA',
          }}
        >
          🛠 <strong>Demo Mode</strong> — choose a flow to test
        </div>
        <Title>Payment Request</Title>
        <Subtitle>{merchantId} · {amountLabel}</Subtitle>
        <Divider />
        <Btn onClick={() => { setMockUser(MOCK_USER_SUFFICIENT); setScreen('payment') }}>
          🏦 &nbsp;Existing account — sufficient balance
        </Btn>
        <Btn
          variant="secondary"
          onClick={() => { setMockUser(MOCK_USER_INSUFFICIENT); setScreen('insufficient') }}
        >
          ⚠️ &nbsp;Existing account — insufficient balance
        </Btn>
        <Btn variant="secondary" onClick={() => setScreen('new-id')}>
          👤 &nbsp;New user — no account
        </Btn>
        <Divider />
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </Card>
    )
  }

  function renderPayment() {
    return (
      <Card>
        <Title>Enter PIN</Title>
        <Subtitle>
          Paying <strong>{amountLabel}</strong> to {merchantId}
        </Subtitle>
        <div
          style={{
            background: '#F9FAFB', borderRadius: 10, padding: '10px 14px',
            marginBottom: 20, fontSize: 13, color: '#6B7280',
          }}
        >
          👤 {mockUser.name} &nbsp;·&nbsp; Balance: {balanceLabel}
        </div>
        {pinError && (
          <div
            style={{
              background: '#FEF2F2', color: '#DC2626', borderRadius: 8,
              padding: '10px 12px', fontSize: 13, marginBottom: 16,
            }}
          >
            {pinError}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <PinPad
            pin={pin}
            onDigit={(d) => { setPinError(''); setPin((p) => (p.length < 4 ? p + d : p)) }}
            onDelete={() => setPin((p) => p.slice(0, -1))}
          />
        </div>
        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 }}>
          Hint: correct PIN is <strong>1234</strong>
        </p>
        <Divider />
        <Btn variant="ghost" onClick={() => setScreen('insufficient')}>
          I don&apos;t have enough balance
        </Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </Card>
    )
  }

  function renderInsufficient() {
    return (
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
          <Title>Insufficient Balance</Title>
          <Subtitle>Top up to complete this payment</Subtitle>
        </div>
        <div
          style={{
            background: '#FFFBEB', border: '1px solid #FDE68A',
            borderRadius: 10, padding: 14, marginBottom: 20,
          }}
        >
          <Row label="Your balance" value={balanceLabel} />
          <Row label="Amount needed" value={amountLabel} />
          <Divider />
          <Row label="Shortfall" value={shortfall} highlight />
        </div>
        <Btn onClick={() => startTopup('topup')}>Top Up Now</Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </Card>
    )
  }

  function renderTopup(nextPending: 'topup-pending' | 'new-topup-pending') {
    return (
      <Card>
        <Title>💰 Top Up</Title>
        <Subtitle>Top up via M-Pesa to {mockUser.phone}</Subtitle>
        <p style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>Amount (KES):</p>
        <Input
          type="number"
          value={topupAmount}
          onChange={setTopupAmount}
          placeholder="Enter amount"
        />
        <Btn
          onClick={() => simulateTopupSent(nextPending)}
          disabled={!topupAmount || Number(topupAmount) <= 0 || isLoading}
        >
          {isLoading ? <Spinner /> : 'Send M-Pesa Prompt'}
        </Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </Card>
    )
  }

  function renderTopupPending() {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📱</div>
          <Title>Check your phone</Title>
          <Subtitle>
            An M-Pesa prompt has been sent to <strong>{mockUser.phone}</strong>.
            <br />
            Enter your M-Pesa PIN to proceed.
          </Subtitle>
        </div>
        <div
          style={{
            width: 36, height: 36,
            border: '3px solid #E5E7EB', borderTop: '3px solid #4F46E5',
            borderRadius: '50%', animation: 'cashia-spin 0.8s linear infinite',
            margin: '0 auto 24px',
          }}
        />
        <Btn onClick={() => { if (!isLoading) completeTopup() }} disabled={isLoading}>
          {isLoading ? <Spinner /> : '✅ Simulate M-Pesa Success'}
        </Btn>
        <Btn
          variant="danger"
          onClick={() => {
            onError({ code: 'TOPUP_FAILED', message: 'Top-up was cancelled.' })
          }}
        >
          ❌ Simulate M-Pesa Failure
        </Btn>
      </Card>
    )
  }

  function renderNewId() {
    return (
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>👤</div>
          <Title>Create Account</Title>
          <Subtitle>Enter your National ID to get started</Subtitle>
        </div>
        <Input value={idNumber} onChange={setIdNumber} placeholder="e.g. 12345678" />
        <Btn
          onClick={() => {
            setIsLoading(true)
            setTimeout(() => { setIsLoading(false); setScreen('new-phone') }, 1000)
          }}
          disabled={!idNumber || isLoading}
        >
          {isLoading ? <Spinner /> : 'Continue'}
        </Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </Card>
    )
  }

  function renderNewPhone() {
    return (
      <Card>
        <Title>📱 Phone Number</Title>
        <Subtitle>We&apos;ll link your M-Pesa number to your new account</Subtitle>
        <Input value={phoneNumber} onChange={setPhoneNumber} placeholder="e.g. 0712345678" />
        <Btn
          onClick={() => {
            setIsLoading(true)
            setTimeout(() => {
              setMockUser({ name: 'New User', phone: phoneNumber || '0700 000 000', balance: 0 })
              setIsLoading(false)
              startTopup('new-topup')
            }, 1000)
          }}
          disabled={!phoneNumber || isLoading}
        >
          {isLoading ? <Spinner /> : 'Create Account & Top Up'}
        </Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </Card>
    )
  }

  function renderSuccess() {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <Title>Payment Successful!</Title>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#4F46E5', margin: '8px 0' }}>{amountLabel}</p>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0' }}>
            paid to <strong>{merchantId}</strong>
          </p>
          <div
            style={{
              background: '#F9FAFB', borderRadius: 8, padding: '8px 14px',
              margin: '16px 0', fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace',
            }}
          >
            {finalTxnId}
          </div>
          <Btn onClick={onClose}>Done</Btn>
        </div>
      </Card>
    )
  }

  // ── Screen router ─────────────────────────────────────────────────────────

  const content = (() => {
    switch (screen) {
      case 'detecting':         return renderDetecting()
      case 'demo-selector':     return renderDemoSelector()
      case 'payment':           return renderPayment()
      case 'insufficient':      return renderInsufficient()
      case 'topup':             return renderTopup('topup-pending')
      case 'topup-pending':     return renderTopupPending()
      case 'new-id':            return renderNewId()
      case 'new-phone':         return renderNewPhone()
      case 'new-topup':         return renderTopup('new-topup-pending')
      case 'new-topup-pending': return renderTopupPending()
      case 'success':           return renderSuccess()
      default:                  return renderDemoSelector()
    }
  })()

  return (
    <>
      <style>{`
        @keyframes cashia-spin { to { transform: rotate(360deg); } }
        .cashia-modal * { box-sizing: border-box; }
      `}</style>
      <div className="cashia-modal" style={{ width: '100%', maxWidth: 400 }}>
        {content}
      </div>
    </>
  )
}
