import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop — Cashia Pay Demo',
  description: 'Next.js integration example for @cashia/pay-sdk-react',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          background: '#F9FAFB',
          color: '#111827',
        }}
      >
        {children}
      </body>
    </html>
  )
}
