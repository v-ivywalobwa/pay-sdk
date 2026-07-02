# Cashia Pay SDK - Monorepo

Embeddable payment SDK with a self-contained modal checkout flow. Use the core SDK in any web app, or use the React bindings for drop-in components and hooks.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Host page (your app)                                   │
│                                                         │
│  ┌──────────────┐   open()   ┌────────────────────────┐ │
│  │  Pay button  │──────────▶ │   Modal overlay        │ │
│  │  (SDK)       │            │                        │ │
│  └──────────────┘            │   (Checkout UI )       │ │
│                              │                        │ │
│  onSuccess / onError ◀───────│                        │ │
│  (postMessage)               │                        │ │
└─────────────────────────────────────────────────────────┘
```

**Three payment flows (mocked):**

| Flow | Trigger |
|------|---------|
| Existing account, sufficient balance | Enter 4-digit PIN -> success |
| Existing account, insufficient balance | Top up via M-Pesa -> retry PIN |
| New user | Enter National ID -> phone -> create account -> top up -> PIN |

---

## Packages

| Package | Description |
|---------|-------------|
| [`packages/pay-sdk`](./packages/pay-sdk) | Framework-agnostic TypeScript SDK |
| [`packages/pay-sdk-react`](./packages/pay-sdk-react) | React `PayButton`, `CheckoutModal`, and `useCashiaPay` |

## Example apps

| App | Port | Description |
|-----|------|-------------|
| [`apps/nextjs-example`](./apps/nextjs-example) | 3000 | Next.js example using `@cashia/pay-sdk-react` |
| [`apps/vanilla-example`](./apps/vanilla-example) | 3002 | Vite + vanilla TypeScript example using `@cashia/pay-sdk` |

---

## Quick start

```bash
# Install dependencies
pnpm install

# Build SDK packages and run example apps
pnpm dev
```

`pnpm dev` builds packages first, then runs all apps under `apps/**` in parallel.

---

## Build packages only

```bash
pnpm build:pkgs
```

Build output:

- `packages/pay-sdk/dist`
- `packages/pay-sdk-react/dist`

---

## Usage

### React (Next.js / Vite / CRA)

```bash
npm install @cashia/pay-sdk-react
```

```tsx
import { PayButton } from '@cashia/pay-sdk-react'

export default function CheckoutPage() {
  return (
    <PayButton
      amount={150000} // KES 1,500.00 in smallest unit
      currency="KES"
      merchantId="my-merchant"
      reference="ORDER-123"
      onSuccess={(result) => console.log('Paid:', result.transactionId)}
      onError={(err) => console.error(err.message)}
      onClose={() => console.log('Checkout closed')}
    />
  )
}
```

Hook usage:

```tsx
import { CheckoutModal, useCashiaPay } from '@cashia/pay-sdk-react'

export function CheckoutTrigger() {
  const { open, close, isOpen, config } = useCashiaPay({
    amount: 150000,
    currency: 'KES',
    merchantId: 'my-merchant',
  })

  return (
    <>
      <button onClick={open}>Checkout</button>
      <CheckoutModal isOpen={isOpen} {...config} onClose={close} />
    </>
  )
}
```

### Vanilla JavaScript / TypeScript

```bash
npm install @cashia/pay-sdk
```

```ts
import { CashiaPay } from '@cashia/pay-sdk'

const pay = new CashiaPay({
  amount: 150000,
  currency: 'KES',
  merchantId: 'my-merchant',
  reference: 'ORDER-123',
  onSuccess: (result) => alert(`Paid: ${result.transactionId}`),
  onError: (err) => alert(err.message),
  onClose: () => alert('Checkout closed'),
})

pay.mount('#pay-container') // adds a default button
// or call pay.open() to trigger checkout programmatically
```

### Script tag (UMD/IIFE)

```html
<script src="https://unpkg.com/@cashia/pay-sdk/dist/index.global.js"></script>
<script>
  const pay = new CashiaPay.CashiaPay({
    amount: 150000,
    currency: 'KES',
    merchantId: 'my-merchant'
  })
  pay.mount('#pay-container')
</script>
```

---

## Core API (`CashiaPayConfig`)

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | `number` | Yes | Amount in the smallest currency unit |
| `currency` | `string` | Yes | ISO currency code (for example `KES`) |
| `merchantId` | `string` | Yes | Merchant identifier |
| `reference` | `string` | No | Optional order/idempotency reference |
| `onSuccess` | `(result) => void` | No | Called when payment succeeds |
| `onError` | `(error) => void` | No | Called when payment fails |
| `onClose` | `() => void` | No | Called when the modal is dismissed |

---

## Development notes

- Correct demo PIN: `1234`
- Demo selector allows switching through all three mock flows
- No `hostedUrl` config is required in the current SDK API
