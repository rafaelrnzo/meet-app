'use client'

import { useEffect, useState } from 'react'
import { Loader2, ExternalLink } from 'lucide-react'
import { apiRequest } from '@/lib/api/admin-api'

interface LinkMeta {
  title: string
  description: string
  image: string
  url: string
}

export function LinkPreview({ url }: { url: string }) {
  const [meta, setMeta] = useState<LinkMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchMeta = async () => {
      try {
        setLoading(true)
        const res = await apiRequest<LinkMeta>(`/api/meta?url=${encodeURIComponent(url)}`)
        if (mounted) {
          if (res.title || res.image) {
            setMeta(res)
          } else {
            setError(true)
          }
        }
      } catch (e) {
        if (mounted) setError(true)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchMeta()
    return () => {
      mounted = false
    }
  }, [url])

  if (error || (!loading && !meta)) return null

  return (
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      className='group mt-2 block no-underline select-none'
    >
      <div className='bg-muted/40 border-border/60 hover:bg-muted/60 hover:border-primary/30 flex max-w-[300px] flex-col overflow-hidden rounded-lg border transition-all'>
        {loading ? (
          <div className='bg-muted/20 flex h-20 items-center justify-center'>
            <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
          </div>
        ) : (
          <>
            {meta?.image && (
              <div className='relative h-32 w-full overflow-hidden bg-black/5'>
                <img
                  src={meta.image}
                  alt={meta.title}
                  className='h-full w-full object-cover transition-transform group-hover:scale-105'
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
            <div className='p-2.5'>
              <div className='text-foreground mb-1 line-clamp-2 text-xs leading-tight font-semibold'>
                {meta?.title || url}
              </div>
              {meta?.description && (
                <div className='text-muted-foreground line-clamp-2 text-[10px] leading-snug'>
                  {meta.description}
                </div>
              )}
              <div className='text-muted-foreground/70 mt-1.5 flex items-center gap-1 text-[9px] tracking-wide uppercase'>
                <ExternalLink className='h-2.5 w-2.5' />
                {new URL(url).hostname}
              </div>
            </div>
          </>
        )}
      </div>
    </a>
  )
}
