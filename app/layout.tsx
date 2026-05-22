import '@/lib/polyfill'
import '@livekit/components-styles'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'LiveKit Meeting',
  description: 'Minimal video conference UI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body style={{ margin: 0 }}>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position='top-center' richColors />
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
