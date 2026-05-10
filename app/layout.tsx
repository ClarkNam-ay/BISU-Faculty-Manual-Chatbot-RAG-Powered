import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NYEL | BISU Faculty Manual Assistant',
  description: 'NYEL chatbot for the Bohol Island State University Faculty Manual',
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
