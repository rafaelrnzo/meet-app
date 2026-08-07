'use client'

import { useEffect } from 'react'

function RecordingClient({ blob, filename }: { blob: Blob; filename: string }) {
  useEffect(() => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = filename
    a.style.display = 'none'

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [blob, filename])

  return (
    <div className='flex h-[calc(100vh-56px-64px)] items-center justify-center'>
      <div className='text-center'>
        <p className='text-lg font-medium'>Sedang menyiapkan file...</p>
        <p className='mt-2 text-sm text-gray-500'>Proses unduhan akan dimulai secara otomatis.</p>
      </div>
    </div>
  )
}

export default RecordingClient
