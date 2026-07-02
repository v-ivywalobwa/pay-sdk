import type { CashiaPayConfig } from './types'

const OVERLAY_ID = 'cashia-pay-overlay'
const STYLES_ID = 'cashia-pay-styles'

// ── Mock data (demo flow) ────────────────────────────────────────────────────

const MOCK_USER_SUFFICIENT = { name: 'John Doe', phone: '0712 345 678', balance: 500000 }
const MOCK_USER_INSUFFICIENT = { name: 'Jane Smith', phone: '0798 765 432', balance: 50000 }
const CORRECT_PIN = '1234'

// ── Helpers ──────────────────────────────────────────────────────────────────

function css(el: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  Object.assign(el.style, styles)
}

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

// ── Screen types ──────────────────────────────────────────────────────────────

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

// ── PayModal ──────────────────────────────────────────────────────────────────

export class PayModal {
  private overlay: HTMLDivElement | null = null
  private contentEl: HTMLDivElement | null = null
  private readonly config: CashiaPayConfig

  // ── State ──────────────────────────────────────────────────────────────────
  private screen: Screen = 'detecting'
  private mockUser = { ...MOCK_USER_SUFFICIENT }
  private pin = ''
  private pinError = ''
  private topupAmount = ''
  private phoneNumber = ''
  private finalTxnId = ''

  constructor(config: CashiaPayConfig) {
    this.config = config
  }

  open(): void {
    if (document.getElementById(OVERLAY_ID)) return
    this.injectStyles()
    this.render()
    // Auto-advance from detecting → demo-selector
    setTimeout(() => this.navigate('demo-selector'), 1500)
  }

  close(): void {
    this.overlay?.remove()
    this.overlay = null
    this.contentEl = null
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  private navigate(screen: Screen): void {
    this.screen = screen
    if (this.contentEl) {
      this.contentEl.innerHTML = ''
      this.contentEl.appendChild(this.renderScreen())
    }
  }

  // ── Shell render ──────────────────────────────────────────────────────────

  private injectStyles(): void {
    if (document.getElementById(STYLES_ID)) return
    const style = document.createElement('style')
    style.id = STYLES_ID
    style.textContent = `
      @keyframes cashia-spin { to { transform: rotate(360deg); } }
      #${OVERLAY_ID} * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    `
    document.head.appendChild(style)
  }

  private render(): void {
    this.overlay = document.createElement('div')
    this.overlay.id = OVERLAY_ID
    css(this.overlay, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '2147483647',
    })

    const card = document.createElement('div')
    css(card, {
      position: 'relative',
      background: '#fff',
      borderRadius: '16px',
      overflow: 'hidden',
      width: '440px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 32px)',
      overflowY: 'auto',
      boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
    })

    // ── Header ───────────────────────────────────────────────────────────────
    const header = document.createElement('div')
    css(header, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      background: '#4F46E5',
      position: 'sticky',
      top: '0',
      zIndex: '1',
    })

    const logo = document.createElement('span')
    logo.textContent = '⚡ Cashia Pay'
    css(logo, { color: '#fff', fontWeight: '700', fontSize: '15px', letterSpacing: '0.3px' })

    const closeBtn = document.createElement('button')
    closeBtn.setAttribute('aria-label', 'Close payment')
    closeBtn.textContent = '✕'
    css(closeBtn, {
      background: 'rgba(255,255,255,0.2)',
      border: 'none',
      color: '#fff',
      borderRadius: '50%',
      width: '28px',
      height: '28px',
      cursor: 'pointer',
      fontSize: '13px',
      lineHeight: '1',
    })
    closeBtn.addEventListener('click', () => {
      this.config.onClose?.()
      this.close()
    })

    header.appendChild(logo)
    header.appendChild(closeBtn)

    // ── Content area ──────────────────────────────────────────────────────────
    this.contentEl = document.createElement('div')
    css(this.contentEl, { padding: '20px' })
    this.contentEl.appendChild(this.renderScreen())

    card.appendChild(header)
    card.appendChild(this.contentEl)
    this.overlay.appendChild(card)

    // Close on backdrop click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.config.onClose?.()
        this.close()
      }
    })

    document.body.appendChild(this.overlay)
  }

  // ── Screen router ─────────────────────────────────────────────────────────

  private renderScreen(): HTMLElement {
    switch (this.screen) {
      case 'detecting':       return this.renderDetecting()
      case 'demo-selector':   return this.renderDemoSelector()
      case 'payment':         return this.renderPayment()
      case 'insufficient':    return this.renderInsufficient()
      case 'topup':           return this.renderTopup('topup-pending')
      case 'topup-pending':   return this.renderTopupPending()
      case 'new-id':          return this.renderNewId()
      case 'new-phone':       return this.renderNewPhone()
      case 'new-topup':       return this.renderTopup('new-topup-pending')
      case 'new-topup-pending': return this.renderTopupPending()
      case 'success':         return this.renderSuccess()
      default:                return this.renderDemoSelector()
    }
  }

  // ── UI helpers ────────────────────────────────────────────────────────────

  private makeTitle(text: string): HTMLElement {
    const el = document.createElement('h2')
    el.textContent = text
    css(el, { margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#111827' })
    return el
  }

  private makeSubtitle(html: string): HTMLElement {
    const el = document.createElement('p')
    el.innerHTML = html
    css(el, { margin: '0 0 20px', fontSize: '14px', color: '#6B7280' })
    return el
  }

  private makeBtn(
    text: string,
    onClick: () => void,
    variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary',
  ): HTMLButtonElement {
    const el = document.createElement('button')
    el.textContent = text
    const variantStyles: Record<string, Partial<CSSStyleDeclaration>> = {
      primary:   { background: '#4F46E5', color: '#fff' },
      secondary: { background: '#F3F4F6', color: '#374151' },
      danger:    { background: '#FEE2E2', color: '#DC2626' },
      ghost:     { background: 'transparent', color: '#4F46E5', textDecoration: 'underline' },
    }
    css(el, {
      ...variantStyles[variant],
      border: 'none',
      borderRadius: '10px',
      padding: variant === 'ghost' ? '6px 0' : '13px 24px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%',
      marginBottom: '10px',
    })
    el.addEventListener('click', onClick)
    return el
  }

  private makeDivider(): HTMLHRElement {
    const el = document.createElement('hr')
    css(el, { border: 'none', borderTop: '1px solid #F3F4F6', margin: '16px 0' })
    return el
  }

  private makeInput(placeholder: string, type = 'text', value = ''): HTMLInputElement {
    const el = document.createElement('input')
    el.type = type
    el.placeholder = placeholder
    el.value = value
    css(el, {
      width: '100%',
      border: '1.5px solid #E5E7EB',
      borderRadius: '10px',
      padding: '12px 14px',
      fontSize: '16px',
      marginBottom: '12px',
      outline: 'none',
    })
    return el
  }

  private makeSpinner(): HTMLElement {
    const el = document.createElement('div')
    css(el, {
      width: '36px',
      height: '36px',
      border: '3px solid #E5E7EB',
      borderTop: '3px solid #4F46E5',
      borderRadius: '50%',
      animation: 'cashia-spin 0.8s linear infinite',
      margin: '0 auto',
    })
    return el
  }

  // ── Screens ───────────────────────────────────────────────────────────────

  private renderDetecting(): HTMLElement {
    const wrap = document.createElement('div')
    css(wrap, { textAlign: 'center', padding: '20px 0' })
    const spin = this.makeSpinner()
    css(spin, { marginBottom: '16px' })
    const p = document.createElement('p')
    p.textContent = 'Verifying your account…'
    css(p, { color: '#6B7280', fontSize: '15px', margin: '0' })
    wrap.appendChild(spin)
    wrap.appendChild(p)
    return wrap
  }

  private renderDemoSelector(): HTMLElement {
    const el = document.createElement('div')

    const banner = document.createElement('div')
    banner.innerHTML = '🛠 <strong>Demo Mode</strong> — choose a flow to test'
    css(banner, {
      background: '#EEF2FF',
      borderRadius: '10px',
      padding: '10px 14px',
      marginBottom: '20px',
      fontSize: '13px',
      color: '#4338CA',
    })
    el.appendChild(banner)
    el.appendChild(this.makeTitle('Payment Request'))
    el.appendChild(this.makeSubtitle(
      `${this.config.merchantId} · ${fmt(this.config.amount, this.config.currency)}`,
    ))
    el.appendChild(this.makeDivider())
    el.appendChild(this.makeBtn('🏦  Existing account — sufficient balance', () => {
      this.mockUser = { ...MOCK_USER_SUFFICIENT }
      this.navigate('payment')
    }))
    el.appendChild(this.makeBtn('⚠️  Existing account — insufficient balance', () => {
      this.mockUser = { ...MOCK_USER_INSUFFICIENT }
      this.navigate('insufficient')
    }, 'secondary'))
    el.appendChild(this.makeBtn('👤  New user — no account', () => {
      this.navigate('new-id')
    }, 'secondary'))
    el.appendChild(this.makeDivider())
    el.appendChild(this.makeBtn('Cancel', () => {
      this.config.onClose?.()
      this.close()
    }, 'ghost'))
    return el
  }

  private renderPayment(): HTMLElement {
    const el = document.createElement('div')
    el.appendChild(this.makeTitle('Enter PIN'))

    const sub = document.createElement('p')
    sub.innerHTML = `Paying <strong>${fmt(this.config.amount, this.config.currency)}</strong> to ${this.config.merchantId}`
    css(sub, { margin: '0 0 20px', fontSize: '14px', color: '#6B7280' })
    el.appendChild(sub)

    const info = document.createElement('div')
    info.textContent = `👤 ${this.mockUser.name}  ·  Balance: ${fmt(this.mockUser.balance, this.config.currency)}`
    css(info, {
      background: '#F9FAFB', borderRadius: '10px', padding: '10px 14px',
      marginBottom: '20px', fontSize: '13px', color: '#6B7280',
    })
    el.appendChild(info)

    if (this.pinError) {
      const err = document.createElement('div')
      err.textContent = this.pinError
      css(err, {
        background: '#FEF2F2', color: '#DC2626', borderRadius: '8px',
        padding: '10px 12px', fontSize: '13px', marginBottom: '16px',
      })
      el.appendChild(err)
    }

    // PIN dots
    const dotsWrap = document.createElement('div')
    css(dotsWrap, { display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '20px' })
    for (let i = 0; i < 4; i++) {
      const dot = document.createElement('span')
      css(dot, {
        display: 'inline-block', width: '14px', height: '14px',
        borderRadius: '50%', border: '2px solid #4F46E5',
        background: i < this.pin.length ? '#4F46E5' : 'transparent',
        transition: 'background 0.1s',
      })
      dotsWrap.appendChild(dot)
    }
    el.appendChild(dotsWrap)

    // PIN keypad
    const padWrap = document.createElement('div')
    css(padWrap, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '16px' })
    const rows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']]
    rows.forEach((row) => {
      const rowEl = document.createElement('div')
      css(rowEl, { display: 'flex', gap: '12px' })
      row.forEach((k) => {
        if (!k) {
          const spacer = document.createElement('div')
          css(spacer, { width: '60px', height: '60px' })
          rowEl.appendChild(spacer)
          return
        }
        const isDel = k === '⌫'
        const keyBtn = document.createElement('button')
        keyBtn.textContent = k
        css(keyBtn, {
          width: '60px', height: '60px', borderRadius: '12px', border: 'none',
          background: isDel ? '#FEE2E2' : '#F3F4F6',
          color: isDel ? '#DC2626' : '#111827',
          fontSize: isDel ? '18px' : '22px', fontWeight: '600', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        })
        keyBtn.addEventListener('click', () => {
          if (isDel) {
            this.pin = this.pin.slice(0, -1)
            this.pinError = ''
          } else if (this.pin.length < 4) {
            this.pin += k
            this.pinError = ''
            if (this.pin.length === 4) {
              this.submitPin()
              return
            }
          }
          this.navigate('payment')
        })
        rowEl.appendChild(keyBtn)
      })
      padWrap.appendChild(rowEl)
    })
    el.appendChild(padWrap)

    const hint = document.createElement('p')
    hint.innerHTML = 'Hint: correct PIN is <strong>1234</strong>'
    css(hint, { fontSize: '12px', color: '#9CA3AF', textAlign: 'center', marginBottom: '16px' })
    el.appendChild(hint)

    el.appendChild(this.makeDivider())
    el.appendChild(this.makeBtn("I don't have enough balance", () => this.navigate('insufficient'), 'ghost'))
    el.appendChild(this.makeBtn('Cancel', () => { this.config.onClose?.(); this.close() }, 'ghost'))
    return el
  }

  private submitPin(): void {
    if (this.pin !== CORRECT_PIN) {
      this.pinError = 'Incorrect PIN. Please try again.'
      this.pin = ''
      this.navigate('payment')
      return
    }
    this.pinError = ''
    this.finalTxnId = txnId()
    this.config.onSuccess?.({
      transactionId: this.finalTxnId,
      amount: this.config.amount,
      currency: this.config.currency,
      reference: this.config.reference,
    })
    this.navigate('success')
  }

  private renderInsufficient(): HTMLElement {
    const el = document.createElement('div')
    const center = document.createElement('div')
    css(center, { textAlign: 'center', marginBottom: '20px' })
    const emoji = document.createElement('div')
    emoji.textContent = '⚠️'
    css(emoji, { fontSize: '40px', marginBottom: '8px' })
    center.appendChild(emoji)
    center.appendChild(this.makeTitle('Insufficient Balance'))
    center.appendChild(this.makeSubtitle('Top up to complete this payment'))
    el.appendChild(center)

    const box = document.createElement('div')
    css(box, {
      background: '#FFFBEB', border: '1px solid #FDE68A',
      borderRadius: '10px', padding: '14px', marginBottom: '20px',
    })
    const balance = fmt(this.mockUser.balance, this.config.currency)
    const needed = fmt(this.config.amount, this.config.currency)
    const shortfall = fmt(Math.max(0, this.config.amount - this.mockUser.balance), this.config.currency)
    ;[['Your balance', balance], ['Amount needed', needed], ['Shortfall', shortfall]].forEach(([label, value]) => {
      const row = document.createElement('div')
      css(row, { display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' })
      const l = document.createElement('span')
      l.textContent = label
      css(l, { color: '#6B7280' })
      const v = document.createElement('span')
      v.textContent = value
      css(v, { fontWeight: '500', color: '#111827' })
      row.appendChild(l)
      row.appendChild(v)
      box.appendChild(row)
    })
    el.appendChild(box)

    el.appendChild(this.makeBtn('Top Up Now', () => this.startTopup('topup')))
    el.appendChild(this.makeBtn('Cancel', () => { this.config.onClose?.(); this.close() }, 'ghost'))
    return el
  }

  private startTopup(target: 'topup' | 'new-topup'): void {
    const shortfall = this.config.amount - this.mockUser.balance
    this.topupAmount = String(Math.max(100, Math.ceil(shortfall / 100)))
    this.navigate(target)
  }

  private renderTopup(nextPending: 'topup-pending' | 'new-topup-pending'): HTMLElement {
    const el = document.createElement('div')
    el.appendChild(this.makeTitle('💰 Top Up'))
    el.appendChild(this.makeSubtitle(`Top up via M-Pesa to ${this.mockUser.phone}`))

    const label = document.createElement('p')
    label.textContent = 'Amount (KES):'
    css(label, { fontSize: '14px', color: '#374151', marginBottom: '6px' })
    el.appendChild(label)

    const inp = this.makeInput('Enter amount', 'number', this.topupAmount)
    inp.addEventListener('input', () => { this.topupAmount = inp.value })
    el.appendChild(inp)

    el.appendChild(this.makeBtn('Send M-Pesa Prompt', () => {
      if (!this.topupAmount || Number(this.topupAmount) <= 0) return
      this.navigate(nextPending)
    }))
    el.appendChild(this.makeBtn('Cancel', () => { this.config.onClose?.(); this.close() }, 'ghost'))
    return el
  }

  private renderTopupPending(): HTMLElement {
    const el = document.createElement('div')
    css(el, { textAlign: 'center' })

    const emoji = document.createElement('div')
    emoji.textContent = '📱'
    css(emoji, { fontSize: '40px', marginBottom: '8px' })
    el.appendChild(emoji)
    el.appendChild(this.makeTitle('Check your phone'))
    const sub = document.createElement('p')
    sub.innerHTML = `An M-Pesa prompt has been sent to <strong>${this.mockUser.phone}</strong>.<br>Enter your M-Pesa PIN to proceed.`
    css(sub, { margin: '0 0 20px', fontSize: '14px', color: '#6B7280' })
    el.appendChild(sub)
    el.appendChild(this.makeSpinner())

    const btns = document.createElement('div')
    css(btns, { marginTop: '24px' })
    btns.appendChild(this.makeBtn('✅ Simulate M-Pesa Success', () => {
      const topped = Math.round(Number(this.topupAmount) * 100)
      this.mockUser.balance += topped
      this.navigate('payment')
    }))
    btns.appendChild(this.makeBtn('❌ Simulate M-Pesa Failure', () => {
      this.config.onError?.({ code: 'TOPUP_FAILED', message: 'Top-up was cancelled.' })
      this.close()
    }, 'danger'))
    el.appendChild(btns)
    return el
  }

  private renderNewId(): HTMLElement {
    const el = document.createElement('div')
    const center = document.createElement('div')
    css(center, { textAlign: 'center', marginBottom: '20px' })
    const emoji = document.createElement('div')
    emoji.textContent = '👤'
    css(emoji, { fontSize: '40px', marginBottom: '8px' })
    center.appendChild(emoji)
    center.appendChild(this.makeTitle('Create Account'))
    center.appendChild(this.makeSubtitle('Enter your National ID to get started'))
    el.appendChild(center)

    const inp = this.makeInput('e.g. 12345678')
    el.appendChild(inp)
    el.appendChild(this.makeBtn('Continue', () => {
      if (!inp.value) return
      this.navigate('new-phone')
    }))
    el.appendChild(this.makeBtn('Cancel', () => { this.config.onClose?.(); this.close() }, 'ghost'))
    return el
  }

  private renderNewPhone(): HTMLElement {
    const el = document.createElement('div')
    el.appendChild(this.makeTitle('📱 Phone Number'))
    el.appendChild(this.makeSubtitle("We'll link your M-Pesa number to your new account"))

    const inp = this.makeInput('e.g. 0712345678')
    el.appendChild(inp)
    el.appendChild(this.makeBtn('Create Account & Top Up', () => {
      if (!inp.value) return
      this.phoneNumber = inp.value
      this.mockUser = { name: 'New User', phone: this.phoneNumber || '0700 000 000', balance: 0 }
      this.startTopup('new-topup')
    }))
    el.appendChild(this.makeBtn('Cancel', () => { this.config.onClose?.(); this.close() }, 'ghost'))
    return el
  }

  private renderSuccess(): HTMLElement {
    const el = document.createElement('div')
    css(el, { textAlign: 'center', padding: '20px 0' })
    const emoji = document.createElement('div')
    emoji.textContent = '✅'
    css(emoji, { fontSize: '56px', marginBottom: '12px' })
    el.appendChild(emoji)
    el.appendChild(this.makeTitle('Payment Successful!'))

    const amount = document.createElement('p')
    amount.textContent = fmt(this.config.amount, this.config.currency)
    css(amount, { fontSize: '22px', fontWeight: '700', color: '#4F46E5', margin: '8px 0' })
    el.appendChild(amount)

    const merchant = document.createElement('p')
    merchant.innerHTML = `paid to <strong>${this.config.merchantId}</strong>`
    css(merchant, { color: '#6B7280', fontSize: '14px', margin: '4px 0' })
    el.appendChild(merchant)

    const txnEl = document.createElement('div')
    txnEl.textContent = this.finalTxnId
    css(txnEl, {
      background: '#F9FAFB', borderRadius: '8px', padding: '8px 14px',
      margin: '16px 0', fontSize: '12px', color: '#9CA3AF', fontFamily: 'monospace',
    })
    el.appendChild(txnEl)

    el.appendChild(this.makeBtn('Done', () => this.close()))
    return el
  }
}
