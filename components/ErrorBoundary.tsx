'use client'

import type { FC, ReactNode } from 'react'
import { useEffect } from 'react'

export const ErrorBoundary: FC<{ children?: ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Keep a reference to the original console.error function
    const originalConsoleError = console.error

    console.error = (...args: any[]) => {
      const errorMessage = args.join('\n')

      // Track in local as normal log
      if (!window.location.host.toLowerCase().endsWith('.nip.io')) {
        console.log('[Surpressed]', errorMessage)
      }

      // Check if the error string matches LiveKit's placeholder layout bug
      if (
        errorMessage.includes('Element not part of the array') &&
        errorMessage.includes('camera_placeholder')
      ) {
        // Silently swallow the error, preventing it from showing up in the console
        return
      }

      // Allow all other legitimate errors to pass through normally
      originalConsoleError(...args)
    }

    return () => {
      // Restore standard console error when component unmounts
      console.error = originalConsoleError
    }
  }, [])

  return children
}
