import { CashiaPay } from '@cashia/pay-sdk'

const statusEl = document.getElementById('status')!

function showStatus(message: string, type: 'success' | 'error') {
  statusEl.textContent = message
  statusEl.className = type
}

const pay = new CashiaPay({
  amount: 150000,        // KES 1,500.00 (in cents)
  currency: 'KES',
  merchantId: 'demo-merchant',
  reference: 'ORDER-VANILLA-001',

  onSuccess(result) {
    showStatus(`✅ Payment successful! Transaction: ${result.transactionId}`, 'success')
  },

  onError(error) {
    showStatus(`❌ Payment failed: ${error.message}`, 'error')
  },

  onClose() {
    showStatus('Payment was cancelled.', 'error')
  },
})

pay.mount('#pay-container')
