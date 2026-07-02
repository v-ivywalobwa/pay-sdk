import { PayModal } from './modal'
import type { CashiaPayConfig } from './types'

export class CashiaPay {
  private readonly config: CashiaPayConfig
  private modal: PayModal | null = null

  constructor(config: CashiaPayConfig) {
    this.config = config
  }

  /**
   * Append a styled "Pay" button to the given CSS selector or element.
   * Returns the created `<button>` element.
   */
  mount(target: string | HTMLElement): HTMLButtonElement {
    const container =
      typeof target === 'string'
        ? (document.querySelector<HTMLElement>(target) ?? null)
        : target

    if (!container) throw new Error(`[CashiaPay] Element not found: "${target}"`)

    const btn = document.createElement('button')
    btn.textContent = `Pay ${this.formatAmount()}`
    Object.assign(btn.style, {
      background: '#4F46E5',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 28px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'system-ui, sans-serif',
      transition: 'background 0.15s',
    })
    btn.addEventListener('mouseenter', () => { btn.style.background = '#4338CA' })
    btn.addEventListener('mouseleave', () => { btn.style.background = '#4F46E5' })
    btn.addEventListener('click', () => this.open())

    container.appendChild(btn)
    return btn
  }

  /** Programmatically open the payment modal. */
  open(): void {
    if (this.modal) return
    this.modal = new PayModal({
      ...this.config,
      onSuccess: (result) => {
        this.modal = null
        this.config.onSuccess?.(result)
      },
      onError: (error) => {
        this.modal = null
        this.config.onError?.(error)
      },
      onClose: () => {
        this.modal = null
        this.config.onClose?.()
      },
    })
    this.modal.open()
  }

  /** Programmatically close the payment modal. */
  close(): void {
    this.modal?.close()
    this.modal = null
  }

  private formatAmount(): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.config.currency,
        minimumFractionDigits: 2,
      }).format(this.config.amount / 100)
    } catch {
      return `${this.config.currency} ${(this.config.amount / 100).toFixed(2)}`
    }
  }
}
