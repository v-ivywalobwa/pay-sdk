# Cashia Pay SDK — Monorepo

Embeddable payment SDK that renders a **button → iframe modal** flow, letting users pay, top up, or create an account — all inside a secure hosted iframe.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Host page (your app)                                   │
│                                                         │
│  ┌──────────────┐   open()   ┌────────────────────────┐ │
│  │  Pay button  │──────────▶ │   Modal overlay        │ │
│  │  (SDK)       │            │  ┌──────────────────┐  │ │
│  └──────────────┘            │  │   <iframe>       │  │ │
│                               │  │  hosted-flow-web │  │ │
│  onSuccess / onError ◀────────│  │  (Next.js app)   │  │ │
│  (postMessage)                │  └──────────────────┘  │ │
└─────────────────────────────────────────────────────────┘
```

**Three payment flows (mocked):**

| Flow | Trigger |
|------|---------|
| ✅ Existing account, sufficient balance | Enter 4-digit PIN → success |
| ⚠️ Existing account, insufficient balance | Top up via M-Pesa → retry PIN |
| 👤 New user | Enter National ID → phone → create account → top up → PIN |

---

## Packages

| Package | Description |
|---------|-------------|
| [`packages/pay-sdk`](./packages/pay-sdk) | Framework-agnostic TypeScript SDK |
| [`packages/pay-sdk-react`](./packages/pay-sdk-react) | React `<PayButton>` + `useCashiaPay` hook |

## Apps

| App | Port | Description |
|-----|------|-------------|
| [`apps/hosted-flow-web`](./apps/hosted-flow-web) | 3001 | Next.js app served inside the iframe |
| [`apps/nextjs-example`](./apps/nextjs-example) | 3000 | Next.js checkout page using `@cashia/pay-sdk-react` |
| [`apps/vanilla-example`](./apps/vanilla-example) | 3002 | Vite + vanilla TS using `@cashia/pay-sdk` directly |

---

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Build SDK packages + start all apps in parallel
pnpm dev
```

> **Tip:** `pnpm dev` builds the SDK packages first, then starts all three apps concurrently. Open http://localhost:3000 for the Next.js example.

---

## Build SDK only

```bash
pnpm build:pkgs
```

Outputs to `packages/pay-sdk/dist` and `packages/pay-sdk-react/dist`.

---

## Usage

### React (Next.js / CRA / Vite)

```bash
npm install @cashia/pay-sdk-react
```

```tsx
import { PayButton } from '@cashia/pay-sdk-react'

export default function CheckoutPage() {
  return (
    <PayButton
      amount={150000}           // KES 1,500.00 (smallest unit)
      currency="KES"
      merchantId="my-merchant"
      hostedUrl="https://pay.cashia.com"
      onSuccess={(result) => console.log('Paid!', result.transactionId)}
      onError={(err)     => console.error(err.message)}
    />
  )
}
```

Or use the hook for a custom button:

```tsx
import { useCashiaPay } from '@cashia/pay-sdk-react'

const { open } = useCashiaPay({ amount: 150000, currency: 'KES', merchantId: 'my-merchant' })

<button onClick={open}>Checkout</button>
```

### Vanilla JS / ES modules

```bash
npm install @cashia/pay-sdk
```

```ts
import { CashiaPay } from '@cashia/pay-sdk'

const pay = new CashiaPay({
  amount: 150000,
  currency: 'KES',
  merchantId: 'my-merchant',
  hostedUrl: 'https://pay.cashia.com',
  onSuccess: (result) => alert(`Paid! ${result.transactionId}`),
  onError:   (err)    => alert(err.message),
})

pay.mount('#pay-container')  // appends button to the element
// or: pay.open()            // open modal programmatically
```

### Via `<script>` tag (UMD/IIFE)

```html
<script src="https://unpkg.com/@cashia/pay-sdk/dist/index.global.js"></script>
<script>
  const pay = new CashiaPay.CashiaPay({ amount: 150000, currency: 'KES', merchantId: 'x' })
  pay.mount('#pay-container')
</script>
```

---

## postMessage protocol

The SDK and hosted iframe communicate via `window.postMessage`:

**SDK → iframe** (after load)
```json
{ "type": "SDK_INIT", "payload": { "amount": 150000, "currency": "KES", "merchantId": "x" } }
```

**iframe → SDK**
```json
{ "type": "PAYMENT_SUCCESS",  "payload": { "transactionId": "TXN-ABC123", "amount": 150000, "currency": "KES" } }
{ "type": "PAYMENT_ERROR",    "payload": { "code": "WRONG_PIN", "message": "Incorrect PIN" } }
{ "type": "PAYMENT_CANCELLED" }
```

---

## Development tips

- The correct mock PIN is **1234**
- The demo selector screen lets you switch between all three flows without any backend
- Set `NEXT_PUBLIC_CASHIA_HOSTED_URL` / `VITE_CASHIA_HOSTED_URL` env vars to point at a different hosted-flow-web instance
