'use client'

import React from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { apiRequest } from '@/lib/api/admin-api'

export function ServerRecordingControls({ roomName }: { roomName: string }) {
  const [isRecording, setIsRecording] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [lastError, setLastError] = React.useState<string | null>(null)

  const RECORDER_API_BASE = 'http://localhost:4000'

  const getJwt = () => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('vc_token') || ''
  }

  const startRecording = async () => {
    if (loading) return
    setLoading(true)
    setLastError(null)

    try {
      await apiRequest('/admin/livekit/recordings/start', {
        method: 'POST',
        body: JSON.stringify({ room_name: roomName }),
      })

      setIsRecording(true)
    } catch (err: any) {
      console.error('[Recording] gagal start:', err)
      setLastError(err?.message || 'Gagal mulai recording')
    } finally {
      setLoading(false)
    }
  }

  const stopRecording = async () => {
    if (loading) return
    setLoading(true)
    setLastError(null)

    try {
      await apiRequest('/admin/livekit/recordings/stop', {
        method: 'POST',
        body: JSON.stringify({ room_name: roomName }),
      })

      setIsRecording(false)
    } catch (err: any) {
      console.error('[Recording] gagal stop:', err)
      setLastError(err?.message || 'Gagal stop recording')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex items-center gap-2'>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={loading}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12 ${
          isRecording
            ? 'animate-pulse border-red-600 bg-red-600 text-white ring-2 ring-red-500/30 hover:bg-red-700'
            : 'bg-card border-border text-foreground hover:bg-muted'
        }`}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {loading ? (
          <Loader2 className='h-5 w-5 animate-spin' />
        ) : (
          <div className={`h-4 w-4 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
        )}
      </button>
      {lastError && (
        <span className='bg-destructive text-destructive-foreground absolute -top-8 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded px-2 py-1 text-[10px] whitespace-nowrap shadow-lg'>
          <AlertCircle className='h-3 w-3' /> {lastError}
        </span>
      )}
    </div>
  )
}
