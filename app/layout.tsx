import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BISU Faculty Manual Assistant',
  description: 'AI-powered chatbot for the Bohol Island State University Faculty Manual',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
