'use client'

import { useParticipants, useLocalParticipant, useRoomContext } from '@livekit/components-react'
import {
  UserMinus,
  X,
  Video,
  PencilRuler,
  Disc,
  BarChart2,
  ChevronLeft,
  MicOff,
  Mic,
  MoreVertical,
  Ban,
  Unlock,
  RefreshCw,
  FileText,
  ChevronRight,
  Presentation,
  Hand,
  Dices,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import {
  muteParticipant,
  banParticipant,
  unbanParticipant,
  fetchUserDbRooms,
  DbRoom,
} from '@/lib/api/admin-api'
import { toast } from 'sonner'
import { Track } from 'livekit-client'
import { MeetingChat } from '../chat/MeetingChat'
import { ServerRecordingControls } from '../controls/ServerRecordingControls'
import { PollingTool } from '../tools/Polling'
import { SharedNotes } from '../tools/SharedNotes'

import dynamic from 'next/dynamic'
import { HostControls } from '../controls/HostControls'

const PDFSlideViewer = dynamic(
  () => import('../tools/PDFSlideViewer').then((mod) => ({ default: mod.PDFSlideViewer })),
  { ssr: false }
)

type SidebarTab =
  | 'chat'
  | 'participants'
  | 'tools'
  | 'settings'
  | 'host_controls'
  | 'presentation'
  | null

interface SidePanelProps {
  activeTab: SidebarTab
  onClose: () => void
  roomName: string
  onToggleWhiteboard: () => void
  isWhiteboardOpen: boolean
  onTogglePresentation: () => void
  isPresentationOpen: boolean
  hasPresentation: boolean
  isAdmin: boolean
  toolsView?: 'menu' | 'polling' | 'notes'
  onToolsViewChange?: (view: 'menu' | 'polling' | 'notes') => void
  presentationUrl?: string | null
  onUndockPresentation?: () => void
  width?: number | string
  onWidthChange?: (w: number) => void
  isYoutubeOpen?: boolean
  onToggleYouTube?: () => void
  onOpenYouTube?: (url: string) => void
}

export function SidePanel({
  activeTab,
  onClose,
  roomName,
  onToggleWhiteboard,
  isWhiteboardOpen,
  onTogglePresentation,
  isPresentationOpen,
  hasPresentation,
  isAdmin,
  toolsView = 'menu',
  onToolsViewChange,
  presentationUrl,
  onUndockPresentation,
  width: controlledWidth,
  onWidthChange,
  isYoutubeOpen,
  onToggleYouTube,
  onOpenYouTube,
}: SidePanelProps) {
  const [internalWidth, setInternalWidth] = useState(320)
  const width = controlledWidth ?? internalWidth
  const setWidth = onWidthChange ?? setInternalWidth

  const [isResizing, setIsResizing] = useState(false)

  const animationFrame = useRef<number | undefined>(undefined)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      // Throttle updates using requestAnimationFrame to prevent UI lag
      if (animationFrame.current) return

      animationFrame.current = requestAnimationFrame(() => {
        const newWidth = window.innerWidth - e.clientX
        const maxWidth = Math.min(window.innerWidth * 0.8, 800) // Max 80% or 800px
        setWidth(Math.max(280, Math.min(maxWidth, newWidth)))
        animationFrame.current = undefined
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
        animationFrame.current = undefined
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
      // Add overlay to iframe if exists to prevent capturing mouse events during drag
      const iframes = document.querySelectorAll('iframe')
      iframes.forEach((el) => (el.style.pointerEvents = 'none'))
    } else {
      const iframes = document.querySelectorAll('iframe')
      iframes.forEach((el) => (el.style.pointerEvents = 'auto'))
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
      const iframes = document.querySelectorAll('iframe')
      iframes.forEach((el) => (el.style.pointerEvents = 'auto'))
    }
  }, [isResizing, setWidth])

  // If tab is settings (handled by VirtualBackgroundSelector) or null, don't render sidebar
  if (!activeTab || activeTab === 'settings') return null

  return (
    <div
      className='bg-card/80 border-border group/sidebar relative flex h-full flex-col border-l backdrop-blur-md'
      style={{ width: typeof width === 'number' ? `${width}px` : width, willChange: 'width' }}
    >
      {/* Resize Handle */}
      <div
        className='hover:bg-primary/10 absolute top-0 bottom-0 left-0 z-50 flex w-1.5 -translate-x-1/2 cursor-ew-resize items-center justify-center transition-colors'
        onMouseDown={(e) => {
          e.preventDefault()
          setIsResizing(true)
        }}
      >
        {/* Visual Grip Indicator */}
        <div className='bg-muted-foreground/30 group-hover/sidebar:bg-primary/50 h-12 w-1 rounded-full transition-colors' />
      </div>

      {/* HEADER */}
      <div className='border-border bg-card/40 flex items-center justify-between border-b p-3'>
        <div className='flex items-center gap-2'>
          <h3 className='text-sm font-semibold capitalize'>
            {activeTab === 'tools'
              ? 'Meeting Tools'
              : activeTab === 'host_controls'
                ? 'Host Controls'
                : activeTab}
          </h3>
          {activeTab === 'presentation' && onUndockPresentation && (
            <button
              onClick={onUndockPresentation}
              className='hover:bg-muted text-muted-foreground hover:text-foreground rounded p-1 transition-colors'
              title='Undock to Overlay'
            >
              <svg
                width='14'
                height='14'
                viewBox='0 0 15 15'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M13.5 13.5H1.5V1.5h6V.5h-6a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-6h-1v6zM10 1v1h2.293l-4.147 4.146.708.708L13 2.707V5h1V1h-4z'
                  fill='currentColor'
                />
              </svg>
            </button>
          )}
        </div>
        <button onClick={onClose} className='hover:bg-muted rounded-md p-1 transition-colors'>
          <X className='text-muted-foreground h-4 w-4' />
        </button>
      </div>

      {/* CONTENT */}
      <div className='relative flex-1 overflow-hidden'>
        {activeTab === 'chat' && <MeetingChat roomCode={roomName} storage='session' />}

        {activeTab === 'participants' && (
          <ParticipantListContent roomName={roomName} isAdmin={isAdmin} />
        )}

        {activeTab === 'tools' && (
          <ToolsListContent
            roomName={roomName}
            isAdmin={isAdmin}
            onToggleWhiteboard={onToggleWhiteboard}
            isWhiteboardOpen={isWhiteboardOpen}
            onTogglePresentation={onTogglePresentation}
            isPresentationOpen={isPresentationOpen}
            hasPresentation={hasPresentation}
            view={toolsView}
            setView={onToolsViewChange || (() => {})}
            isYoutubeOpen={isYoutubeOpen}
            onToggleYouTube={onToggleYouTube}
            onOpenYouTube={onOpenYouTube}
          />
        )}

        {activeTab === 'host_controls' && <HostControls roomName={roomName} />}

        {activeTab === 'presentation' && presentationUrl && (
          <div className='relative h-full w-full bg-white'>
            <PDFSlideViewer
              url={presentationUrl}
              isOpen={true}
              onClose={() => {
                /* Handled by sidebar close */
              }}
              isAdmin={isAdmin}
              roomName={roomName}
              mode='embedded'
            />
          </div>
        )}
      </div>
    </div>
  )
}
function ToolsListContent({
  roomName,
  isAdmin,
  onToggleWhiteboard,
  isWhiteboardOpen,
  onTogglePresentation,
  isPresentationOpen,
  hasPresentation,
  view,
  setView,
  isYoutubeOpen,
  onToggleYouTube,
  onOpenYouTube,
}: {
  roomName: string
  isAdmin: boolean
  onToggleWhiteboard: () => void
  isWhiteboardOpen: boolean
  onTogglePresentation: () => void
  isPresentationOpen: boolean
  hasPresentation: boolean
  view: 'menu' | 'polling' | 'notes'
  setView: (v: 'menu' | 'polling' | 'notes') => void
  isYoutubeOpen?: boolean
  onToggleYouTube?: () => void
  onOpenYouTube?: (url: string) => void
}) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  // Local state for YouTube input
  const [ytUrl, setYtUrl] = useState('')
  const [showYtInput, setShowYtInput] = useState(false)

  if (view === 'polling') {
    return (
      <div className='flex h-full flex-col'>
        <div className='border-border border-b p-2'>
          <button
            onClick={() => setView('menu')}
            className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors'
          >
            <ChevronLeft className='h-4 w-4' /> Back to Tools
          </button>
        </div>
        <div className='flex-1 overflow-y-auto'>
          <PollingTool isAdmin={isAdmin} />
        </div>
      </div>
    )
  }

  if (view === 'notes') {
    return <SharedNotes isAdmin={isAdmin} onBack={() => setView('menu')} roomName={roomName} />
  }

  if (showYtInput) {
    return (
      <div className='border-border mt-2 flex h-full flex-col border-t pt-4'>
        <div className='border-border flex items-center justify-between border-b p-2'>
          <button
            onClick={() => setShowYtInput(false)}
            className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors'
          >
            <ChevronLeft className='h-4 w-4' /> Back
          </button>
          <span className='text-xs font-semibold'>Share YouTube</span>
        </div>
        <div className='flex flex-col gap-3 p-4'>
          <p className='text-muted-foreground text-xs'>
            Paste a YouTube link to watch together synchronously.
          </p>
          <input
            type='text'
            placeholder='https://youtube.com/watch?v=...'
            className='bg-muted/50 border-border focus:ring-primary/50 w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => {
              if (ytUrl && onOpenYouTube) {
                onOpenYouTube(ytUrl)
                setShowYtInput(false)
                setYtUrl('')
              }
            }}
            disabled={!ytUrl}
            className='w-full rounded bg-red-600 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50'
          >
            Start Sharing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-2 p-4'>
      <h4 className='text-muted-foreground mb-3 px-1 text-[11px] font-semibold tracking-wider uppercase'>
        Collaboration
      </h4>

      <ToolItem
        icon={<FileText className='h-4.5 w-4.5 text-emerald-500' />}
        title='Shared Notes'
        description='Real-time collaborative notes'
        onClick={() => setView('notes')}
      />

      <ToolItem
        icon={<BarChart2 className='h-4.5 w-4.5 text-blue-500' />}
        title='Polling'
        description='Create and manage polls'
        onClick={() => setView('polling')}
      />

      <ToolItem
        icon={<PencilRuler className='h-4.5 w-4.5 text-violet-500' />}
        title='Whiteboard'
        description='Collaborative drawing canvas'
        onClick={onToggleWhiteboard}
        actionLabel={isWhiteboardOpen ? 'Open' : 'Start'}
        isActive={isWhiteboardOpen}
      />

      {hasPresentation && (
        <div className='pt-2'>
          <h4 className='text-muted-foreground mb-3 px-1 text-[11px] font-semibold tracking-wider uppercase'>
            Content
          </h4>
          <ToolItem
            icon={<FileText className='h-4.5 w-4.5 text-orange-500' />}
            title='Presentation'
            description='View uploaded slides'
            onClick={onTogglePresentation}
            actionLabel={isPresentationOpen ? 'Close' : 'Open'}
            isActive={isPresentationOpen}
          />
        </div>
      )}

      <div className='pt-2'>
        <h4 className='text-muted-foreground mb-3 px-1 text-[11px] font-semibold tracking-wider uppercase'>
          Media
        </h4>
        <ToolItem
          icon={<Video className='h-4.5 w-4.5 text-red-500' />}
          title='YouTube Sync'
          description='Watch video together'
          onClick={() => {
            if (isYoutubeOpen && onToggleYouTube) {
              onToggleYouTube()
            } else {
              setShowYtInput(true)
            }
          }}
          actionLabel={isYoutubeOpen ? 'Close' : 'Open'}
          isActive={isYoutubeOpen}
        />
      </div>

      {isAdmin && (
        <div className='pt-2'>
          <h4 className='text-muted-foreground mb-3 px-1 text-[11px] font-semibold tracking-wider uppercase'>
            Admin
          </h4>
          <div className='flex flex-col gap-2'>
            <div className='hover:bg-accent/50 group hover:border-border flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-2 transition-colors'>
              <div className='flex items-center gap-2.5'>
                <div className='bg-muted/60 group-hover:bg-background rounded-md p-2 transition-all group-hover:shadow-sm'>
                  <Disc className='h-4.5 w-4.5 text-red-500' />
                </div>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-sm font-semibold'>Recording</span>
                  <span className='text-muted-foreground text-[11px] font-medium'>
                    Record meeting
                  </span>
                </div>
              </div>
              <div className='origin-right scale-90'>
                <ServerRecordingControls roomName={roomName} />
              </div>
            </div>

            <ToolItem
              icon={<Dices className='h-4.5 w-4.5 text-blue-500' />}
              title='Pick Random User'
              description='Select a participant randomly'
              onClick={async () => {
                if (!room || !localParticipant) return
                const participants = Array.from(room.remoteParticipants.values())
                // Filter out those who are waiting
                const activeParticipants = participants.filter((p) => {
                  try {
                    const md = p.metadata ? JSON.parse(p.metadata) : {}
                    return md.status !== 'waiting'
                  } catch {
                    return true
                  }
                })

                if (activeParticipants.length === 0) {
                  toast.error('No other participants to pick from!')
                  return
                }

                const randomIdx = Math.floor(Math.random() * activeParticipants.length)
                const winner = activeParticipants[randomIdx]
                const winnerName = winner.identity

                // Broadcast to room
                try {
                  const data = new TextEncoder().encode(
                    JSON.stringify({
                      type: 'random_user_selected',
                      winner: winnerName,
                    })
                  )
                  await localParticipant.publishData(data, { reliable: true })
                  toast.success(`Selected: ${winnerName}`)
                } catch (e) {
                  console.error('Failed to broadcast winner', e)
                  toast.error('Failed to select user')
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ToolItem({
  icon,
  title,
  description,
  onClick,
  actionLabel,
  isActive,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  actionLabel?: string
  isActive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-lg border p-2 text-left transition-all duration-200 ${
        isActive
          ? 'bg-primary/5 border-primary/20'
          : 'bg-card hover:bg-accent hover:border-border border-transparent'
      }`}
    >
      <div className='flex items-center gap-3'>
        <div
          className={`rounded-md p-2 transition-colors ${
            isActive
              ? 'bg-background shadow-sm'
              : 'bg-muted/60 group-hover:bg-background group-hover:shadow-sm'
          }`}
        >
          {icon}
        </div>
        <div className='flex flex-col gap-0.5'>
          <span className='text-foreground text-sm font-semibold'>{title}</span>
          <span className='text-muted-foreground text-[11px] font-medium'>{description}</span>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        {actionLabel && (
          <span
            className={`bg-background border-border rounded border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase shadow-sm ${isActive ? 'text-primary border-primary/20' : 'text-muted-foreground'}`}
          >
            {actionLabel}
          </span>
        )}
        {!actionLabel && (
          <ChevronRight className='text-muted-foreground/50 group-hover:text-muted-foreground h-4 w-4 flex-shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100' />
        )}
      </div>
    </button>
  )
}

function ParticipantListContent({ roomName, isAdmin }: { roomName: string; isAdmin: boolean }) {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [bannedUsers, setBannedUsers] = useState<string[]>([])
  const [isCreator, setIsCreator] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    loadBannedUsers()
  }, [roomName])

  const loadBannedUsers = async () => {
    try {
      const userStr = localStorage.getItem('vc_user')
      const currentUserId = userStr ? JSON.parse(userStr).id : null

      const rooms = await fetchUserDbRooms()
      const room = rooms.find((r) => r.name === roomName || r.room_code === roomName)

      if (room) {
        if (room.banned_users) {
          setBannedUsers(room.banned_users)
        }
        if (currentUserId && room.createdById === currentUserId) {
          setIsCreator(true)
        }
      }
    } catch (e) {
      console.error('Failed to load banned users', e)
    }
  }

  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') || 'http://localhost:8080'

  const getJwt = () => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('vc_token') || ''
  }

  const handleKick = async (identity: string) => {
    if (!confirm(`Are you sure you want to kick ${identity}?`)) return
    setActionLoading(identity)
    try {
      const res = await fetch(`${API_BASE}/api/livekit/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwt()}`,
        },
        body: JSON.stringify({ room_code: roomName, identity }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to kick')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBan = async (identity: string) => {
    if (
      !confirm(`Are you sure you want to ban ${identity}? They will be removed and unable to join.`)
    )
      return
    setActionLoading(identity)
    try {
      await banParticipant(roomName, identity)
      toast.success(`Banned ${identity}`)
      loadBannedUsers()
    } catch (err: any) {
      toast.error('Failed to ban: ' + err.message)
    } finally {
      setActionLoading(null)
      setOpenMenuId(null)
    }
  }

  const handleUnban = async (identity: string) => {
    setActionLoading(identity)
    try {
      await unbanParticipant(roomName, identity)
      toast.success(`Unbanned ${identity}`)
      loadBannedUsers()
    } catch (err: any) {
      toast.error('Failed to unban: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAdmit = async (identity: string) => {
    setActionLoading(identity)
    try {
      const res = await fetch(`${API_BASE}/api/livekit/admit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwt()}`,
        },
        body: JSON.stringify({ room_code: roomName, identity }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to admit')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMute = async (identity: string, isMuted: boolean) => {
    const action = isMuted ? 'Unmute' : 'Mute'
    setActionLoading(identity)
    try {
      await muteParticipant(roomName, identity, !isMuted, !isMuted)
      toast.success(`${action}d ${identity}`)
    } catch (err: any) {
      toast.error(`Failed to ${action.toLowerCase()}: ` + err.message)
    } finally {
      setActionLoading(null)
      setOpenMenuId(null)
    }
  }

  const waitingParticipants = participants.filter((p) => {
    const metadata = p.metadata ? JSON.parse(p.metadata) : {}
    return metadata.status === 'waiting'
  })

  const activeParticipants = participants.filter((p) => {
    const metadata = p.metadata ? JSON.parse(p.metadata) : {}
    return metadata.status !== 'waiting'
  })

  return (
    <div className='h-full flex-1 space-y-4 overflow-y-auto p-2'>
      {/* Waiting Room Section */}
      {isAdmin && waitingParticipants.length > 0 && (
        <div className='space-y-2'>
          <h4 className='text-muted-foreground px-2 text-xs font-semibold tracking-wider uppercase'>
            Waiting Room ({waitingParticipants.length})
          </h4>
          <div className='space-y-1'>
            {waitingParticipants.map((p) => (
              <div
                key={p.sid}
                className='bg-muted/30 border-border flex items-center justify-between rounded-md border p-2'
              >
                <div className='flex items-center gap-2 overflow-hidden'>
                  <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-500'>
                    {p.identity?.[0]?.toUpperCase()}
                  </div>
                  <div className='flex min-w-0 flex-col'>
                    <span className='truncate text-sm font-medium'>{p.identity}</span>
                    <span className='text-muted-foreground text-[10px]'>Waiting...</span>
                  </div>
                </div>
                <div className='flex gap-1'>
                  <button
                    onClick={() => handleAdmit(p.identity)}
                    disabled={!!actionLoading}
                    className='bg-primary text-primary-foreground hover:bg-primary/90 rounded px-2 py-1 text-xs font-medium transition-colors'
                  >
                    Admit
                  </button>
                  <button
                    onClick={() => handleKick(p.identity)}
                    disabled={!!actionLoading}
                    className='text-destructive hover:bg-destructive/10 rounded p-1 transition-colors'
                    title='Remove'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Participants Section */}
      <div className='h-full space-y-2'>
        <h4 className='text-muted-foreground px-2 text-xs font-semibold tracking-wider uppercase'>
          In Meeting ({activeParticipants.length})
        </h4>
        <div className='space-y-1'>
          {activeParticipants.map((p) => {
            const isMe = p.identity === localParticipant.identity
            return (
              <div
                key={p.sid}
                className='hover:bg-muted/50 flex items-center justify-between rounded-md p-2 transition-colors'
              >
                <div className='flex items-center gap-2 overflow-hidden'>
                  <div className='bg-primary/20 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold'>
                    {p.identity?.[0]?.toUpperCase()}
                  </div>
                  <div className='flex min-w-0 flex-col'>
                    <span className='truncate text-sm font-medium'>
                      {p.identity} {isMe && '(You)'}
                    </span>
                    <span className='text-muted-foreground text-[10px]'>
                      {p.isSpeaking ? 'Speaking' : 'Idle'}
                    </span>
                  </div>
                </div>
                {!isMe && isAdmin && (
                  <div className='relative'>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === p.identity ? null : p.identity)}
                      className='hover:bg-muted text-muted-foreground hover:text-foreground rounded-md p-1.5 transition-colors'
                      title='Options'
                    >
                      <MoreVertical className='h-4 w-4' />
                    </button>

                    {openMenuId === p.identity && (
                      <div
                        ref={menuRef}
                        className='bg-popover border-border absolute top-full right-0 z-50 mt-1 w-32 rounded-md border py-1 shadow-md'
                      >
                        {(() => {
                          const audioTrack = p.getTrackPublication(Track.Source.Microphone)
                          const isMuted = audioTrack ? audioTrack.isMuted : true // Assume muted if no track

                          return (
                            <button
                              onClick={() => handleMute(p.identity, isMuted)}
                              disabled={!!actionLoading}
                              className='hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors'
                            >
                              {isMuted ? (
                                <Mic className='h-3.5 w-3.5' />
                              ) : (
                                <MicOff className='h-3.5 w-3.5' />
                              )}
                              {isMuted ? 'Unmute' : 'Mute'}
                            </button>
                          )
                        })()}
                        <button
                          onClick={() => handleKick(p.identity)}
                          disabled={!!actionLoading}
                          className='text-destructive hover:text-destructive flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-red-500/10'
                        >
                          <UserMinus className='h-3.5 w-3.5' />
                          Kick
                        </button>
                        <button
                          onClick={() => handleBan(p.identity)}
                          disabled={!!actionLoading}
                          className='text-destructive hover:text-destructive flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-red-500/10'
                        >
                          <Ban className='h-3.5 w-3.5' />
                          Ban User
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {/* Hand Raised Icon */}
                {(() => {
                  const md = p.metadata ? JSON.parse(p.metadata) : {}
                  return md.handRaised ? (
                    <div
                      className='rounded border border-yellow-500/20 bg-yellow-500/10 p-1'
                      title='Hand Raised'
                    >
                      <Hand className='h-3.5 w-3.5 text-yellow-500' />
                    </div>
                  ) : null
                })()}
              </div>
            )
          })}
        </div>
      </div>

      {/* Banned Users Section */}
      {(isAdmin || isCreator) && (
        <div className='border-border space-y-2 border-t pt-2'>
          <div className='flex items-center justify-between px-2'>
            <h4 className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
              Banned Users ({bannedUsers.length})
            </h4>
            <button
              onClick={() => loadBannedUsers()}
              className='hover:bg-muted text-muted-foreground hover:text-foreground rounded p-1 transition-colors'
              title='Refresh banned list'
            >
              <RefreshCw className='h-3 w-3' />
            </button>
          </div>

          {bannedUsers.length === 0 ? (
            <div className='border-border rounded-md border border-dashed px-2 py-4 text-center'>
              <p className='text-muted-foreground text-xs italic'>No banned users</p>
            </div>
          ) : (
            <div className='space-y-1'>
              {bannedUsers.map((identity) => (
                <div
                  key={identity}
                  className='bg-destructive/5 hover:bg-destructive/10 border-destructive/20 flex items-center justify-between rounded-md border p-2 transition-colors'
                >
                  <div className='flex items-center gap-2 overflow-hidden'>
                    <div className='bg-destructive/10 text-destructive flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold'>
                      <Ban className='h-4 w-4' />
                    </div>
                    <div className='flex min-w-0 flex-col'>
                      <span className='truncate text-sm font-medium'>{identity}</span>
                      <span className='text-destructive text-[10px]'>Banned</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnban(identity)}
                    disabled={!!actionLoading}
                    className='bg-background border-border hover:bg-muted flex items-center gap-1 rounded border p-1.5 text-xs font-medium transition-colors'
                    title='Unban'
                  >
                    <Unlock className='h-3 w-3' />
                    Unban
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
