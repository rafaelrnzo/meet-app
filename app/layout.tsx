import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './globals.css'

export const metadata = {
  title: 'LiveKit Meeting',
  description: 'Minimal video conference UI',
}

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${inter.variable} antialiased`}>
      <body style={{ margin: 0 }}>
        <ErrorBoundary>
          <SessionProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </SessionProvider>
        </ErrorBoundary>
        <Toaster position='bottom-right' richColors />
      </body>
    </html>
  )
}

export const viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming for native feel
}
