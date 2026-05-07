'use client'

import { useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { leaveRoomBackend } from '@/lib/api/api'
import { muteAllParticipants } from '@/lib/api/admin-api'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo, useRef } from 'react'
import {
  RoomEvent,
  VideoPresets,
  VideoPreset,
  Track,
  TrackPublication,
  Participant,
} from 'livekit-client'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  Loader2,
  MessageSquare,
  Users,
  Sparkles,
  Phone,
  Settings,
  Lock,
  Smile,
  Copy,
  Check,
  LayoutGrid,
  ChevronUp,
  FileText,
  Hand,
} from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'

type SidebarTab =
  | 'chat'
  | 'participants'
  | 'tools'
  | 'settings'
  | 'host_controls'
  | 'presentation'
  | null

export function Controls({
  roomName,
  activeSidebar,
  onSidebarChange,
  onTogglePresentation,
  isPresentationOpen,
  hasPresentation,
}: {
  roomName: string
  activeSidebar: SidebarTab
  onSidebarChange: (tab: SidebarTab) => void
  onTogglePresentation?: () => void
  isPresentationOpen?: boolean
  hasPresentation?: boolean
}) {
  const room = useRoomContext()
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    lastMicrophoneError,
    lastCameraError,
  } = useLocalParticipant()

  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [showCameraMenu, setShowCameraMenu] = useState(false)
  const [videoQuality, setVideoQuality] = useState<VideoPreset>(VideoPresets.h720)
  const [metadataStr, setMetadataStr] = useState('')
  const [copied, setCopied] = useState(false)

  const qualities = [
    { label: 'QHD (2K)', preset: VideoPresets.h2160 },
    { label: 'Full HD (1080p)', preset: VideoPresets.h1080 },
    { label: 'High Definition (720p)', preset: VideoPresets.h720 },
    { label: 'Standard (540p)', preset: VideoPresets.h540 },
    { label: 'Data Saver (360p)', preset: VideoPresets.h360 },
  ]

  const changeVideoQuality = async (preset: VideoPreset) => {
    setVideoQuality(preset)
    setShowCameraMenu(false)

    if (isCameraEnabled && localParticipant) {
      const trackPub = localParticipant.getTrackPublication(Track.Source.Camera)
      if (trackPub && trackPub.videoTrack) {
        try {
          await trackPub.videoTrack.restartTrack({ resolution: preset })
          toast.success('Camera quality updated')
        } catch (error) {
          console.error('Failed to update camera quality', error)
          toast.error('Failed to update camera quality')
        }
      }
    }
  }

  const sendReaction = async (emoji: string) => {
    if (!room) return
    try {
      const data = new TextEncoder().encode(JSON.stringify({ type: 'reaction', emoji }))
      await localParticipant.publishData(data, { reliable: true })
      window.dispatchEvent(new CustomEvent('local-reaction', { detail: { emoji } }))
    } catch (e) {
      console.error('Failed to send reaction:', e)
    }
  }

  // Check Admin Role
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('vc_user')
        if (userStr) {
          const user = JSON.parse(userStr)
          const role = user.role
          if (role === 'admin' || (typeof role === 'object' && role?.name === 'admin')) {
            setIsAdmin(true)
          }
        }
      } catch (e) {
        console.error('Failed to parse user role', e)
      }
    }
  }, [])

  // Sync Metadata
  useEffect(() => {
    if (!room) return
    setMetadataStr(room.metadata || '{}')

    const onMeta = (meta: string | undefined) => {
      setMetadataStr(meta || '{}')
    }
    room.on(RoomEvent.RoomMetadataChanged, onMeta)
    return () => {
      room.off(RoomEvent.RoomMetadataChanged, onMeta)
    }
  }, [room])

  const metadata = useMemo(() => {
    try {
      return JSON.parse(metadataStr)
    } catch {
      return {}
    }
  }, [metadataStr])

  const allowAudio = metadata.allow_audio !== false
  const allowVideo = metadata.allow_video !== false
  const allowScreen = metadata.allow_screen !== false
  const allowReaction = metadata.allow_reaction !== false

  // Local Participant Metadata (for Hard Mute)
  const [localMeta, setLocalMeta] = useState<any>({})

  useEffect(() => {
    if (!room || !localParticipant) return

    const parseMeta = () => {
      try {
        setLocalMeta(JSON.parse(localParticipant.metadata || '{}'))
      } catch {
        setLocalMeta({})
      }
    }

    // Initial parse
    parseMeta()

    const onMetaChanged = (_: string | undefined, p: any) => {
      if (p === localParticipant) {
        parseMeta()
      }
    }

    room.on(RoomEvent.ParticipantMetadataChanged, onMetaChanged)
    return () => {
      room.off(RoomEvent.ParticipantMetadataChanged, onMetaChanged)
    }
  }, [room, localParticipant])

  const adminMuteAudio = localMeta.admin_muted_audio === true
  const adminMuteVideo = localMeta.admin_muted_video === true
  const handRaised = localMeta.handRaised === true

  // Notification for remote mute/unmute
  useEffect(() => {
    if (!room) return

    const onTrackMuted = (pub: TrackPublication, participant: Participant) => {
      if (participant.isLocal && pub.source === Track.Source.Microphone) {
        // Only show toast if it wasn't triggered by our own metadata enforcement (to avoid double toast)
        // But metadata update might happen after.
        // For now, simple toast is fine.
        toast.info('Your microphone was muted by the host')
      }
    }

    const onTrackUnmuted = (pub: TrackPublication, participant: Participant) => {
      if (participant.isLocal && pub.source === Track.Source.Microphone) {
        toast.success('Your microphone was unmuted by the host')
      }
    }

    room.on(RoomEvent.TrackMuted, onTrackMuted)
    room.on(RoomEvent.TrackUnmuted, onTrackUnmuted)

    return () => {
      room.off(RoomEvent.TrackMuted, onTrackMuted)
      room.off(RoomEvent.TrackUnmuted, onTrackUnmuted)
    }
  }, [room])

  // Enforce Mute if permissions revoked (and not admin)
  useEffect(() => {
    if (isAdmin) return

    // Room-level permissions
    if (!allowAudio && isMicrophoneEnabled) {
      localParticipant.setMicrophoneEnabled(false)
    }
    if (!allowVideo && isCameraEnabled) {
      localParticipant.setCameraEnabled(false)
    }

    // Individual Hard Mute (metadata)
    if (adminMuteAudio && isMicrophoneEnabled) {
      localParticipant.setMicrophoneEnabled(false)
    }
    if (adminMuteVideo && isCameraEnabled) {
      localParticipant.setCameraEnabled(false)
    }

    if (!allowScreen && isScreenShareEnabled) {
      localParticipant.setScreenShareEnabled(false)
    }
    if (!allowReaction && showReactions) {
      setShowReactions(false)
    }
  }, [
    allowAudio,
    allowVideo,
    allowScreen,
    allowReaction,
    isAdmin,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    localParticipant,
    showReactions,
    adminMuteAudio,
    adminMuteVideo,
  ])

  const toggleMic = async () => {
    if (busy || !localParticipant) return
    if ((!allowAudio && !isAdmin) || (adminMuteAudio && !isAdmin)) {
      toast.error('Microphone is disabled by admin')
      return
    }
    try {
      setBusy(true)
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
    } catch (e) {
      console.error('toggle mic error:', e, {
        lastMicrophoneError,
        isMicrophoneEnabled,
        allowAudio,
        isAdmin,
      })
      toast.error(`Gagal mic: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  const toggleCam = async () => {
    if (busy || !localParticipant) return
    if ((!allowVideo && !isAdmin) || (adminMuteVideo && !isAdmin)) {
      toast.error('Camera is disabled by admin')
      return
    }
    try {
      setBusy(true)
      await localParticipant.setCameraEnabled(!isCameraEnabled, { resolution: videoQuality })
    } catch (e) {
      console.error('toggle camera error:', e, {
        lastCameraError,
        isCameraEnabled,
        allowVideo,
        isAdmin,
      })
      toast.error(`Gagal kamera: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  const toggleScreen = async () => {
    if (busy || !localParticipant) return
    try {
      setBusy(true)
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled)
    } catch (e) {
      console.error('toggle screen share error:', e)
      toast.error(`Gagal share screen: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  const toggleHandRaise = async () => {
    if (!localParticipant) return
    try {
      const currentMeta = localParticipant.metadata ? JSON.parse(localParticipant.metadata) : {}
      const newHandState = !handRaised
      await localParticipant.setMetadata(
        JSON.stringify({ ...currentMeta, handRaised: newHandState })
      )
      if (newHandState) {
        toast.success('Hand raised')
      } else {
        // toast.info("Hand lowered");
      }
    } catch (e) {
      console.error('Failed to toggle hand raise', e)
    }
  }

  const leaveRoom = async () => {
    try {
      if (room) {
        await room.disconnect()
      }
      await leaveRoomBackend()
      router.push('/')
    } catch (e) {
      console.error('leave error:', e)
      router.push('/') // Fallback
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomName)
    setCopied(true)
    toast.success('Room code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const baseBtn = (
    active: boolean,
    disabled: boolean,
    variant: 'default' | 'destructive' | 'normal' = 'normal'
  ) => `
    w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md relative
    ${
      variant === 'destructive'
        ? 'bg-red-600 border-red-600 text-white hover:bg-red-700 ring-2 ring-red-500/30'
        : active
          ? 'bg-primary border-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-card border-border text-foreground hover:bg-muted'
    } 
    ${disabled ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border/50' : ''}
  `

  const minimalBtn = (active: boolean, disabled: boolean) => `
    w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed relative
    ${
      active
        ? 'bg-primary/15 text-primary'
        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
    }
  `

  return (
    <div className='flex w-full items-center justify-between px-4 py-3 sm:px-6'>
      {/* LEFT: Room Info */}
      <div className='hidden min-w-0 flex-1 items-center justify-start gap-4 md:flex'>
        <div className='flex flex-col'>
          <div className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
            Room Code
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-foreground font-mono text-sm font-medium select-all'>
              {roomName}
            </span>
            <button
              onClick={copyRoomCode}
              className='text-muted-foreground hover:text-primary transition-colors'
            >
              {copied ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
            </button>
          </div>
        </div>
      </div>

      {/* CENTER: Media Controls */}
      <div className='flex flex-shrink-0 items-center justify-center gap-2 sm:gap-4'>
        {/* MIC */}
        <button
          onClick={toggleMic}
          disabled={
            busy || !localParticipant || (!allowAudio && !isAdmin) || (adminMuteAudio && !isAdmin)
          }
          className={baseBtn(
            false,
            busy || !localParticipant || (!allowAudio && !isAdmin) || (adminMuteAudio && !isAdmin),
            isMicrophoneEnabled ? 'normal' : 'destructive'
          )}
          title={adminMuteAudio ? 'Muted by Host' : 'Microphone'}
        >
          {busy ? (
            <Loader2 className='h-5 w-5 animate-spin' />
          ) : isMicrophoneEnabled ? (
            <Mic className='h-5 w-5' />
          ) : (
            <MicOff className='h-5 w-5' />
          )}
          {((!allowAudio && !isAdmin) || (adminMuteAudio && !isAdmin)) && (
            <div className='bg-muted border-border absolute -top-1 -right-1 rounded-full border p-0.5'>
              <Lock className='text-destructive h-3 w-3' />
            </div>
          )}
        </button>

        {/* CAMERA GROUP */}
        <div className='bg-secondary relative flex items-center gap-1 rounded-full pr-2'>
          <button
            onClick={toggleCam}
            disabled={
              busy || !localParticipant || (!allowVideo && !isAdmin) || (adminMuteVideo && !isAdmin)
            }
            className={baseBtn(
              false,
              busy ||
                !localParticipant ||
                (!allowVideo && !isAdmin) ||
                (adminMuteVideo && !isAdmin),
              isCameraEnabled ? 'normal' : 'normal'
            )}
            title={adminMuteVideo ? 'Camera Disabled by Host' : 'Camera'}
          >
            {busy ? (
              <Loader2 className='h-5 w-5 animate-spin' />
            ) : isCameraEnabled ? (
              <Video className='h-5 w-5' />
            ) : (
              <VideoOff className='h-5 w-5' />
            )}
            {((!allowVideo && !isAdmin) || (adminMuteVideo && !isAdmin)) && (
              <div className='bg-muted border-border absolute -top-1 -right-1 rounded-full border p-0.5'>
                <Lock className='text-destructive h-3 w-3' />
              </div>
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setShowCameraMenu(!showCameraMenu)}
            className={`hover:text-muted-foreground hover:text-foreground flex h-11 w-6 items-center justify-center rounded-full bg-transparent transition-all sm:h-12 ${showCameraMenu ? 'bg-muted text-foreground' : ''} `}
            title='Camera Settings'
          >
            <ChevronUp className='h-4 w-4' />
          </button>

          {/* Quality Menu */}
          {showCameraMenu && (
            <div className='bg-card border-border animate-in fade-in slide-in-from-bottom-2 absolute bottom-full left-1/2 z-50 mb-3 w-56 -translate-x-1/2 rounded-lg border p-1 shadow-lg'>
              <div className='text-muted-foreground px-2 py-2 text-xs font-semibold tracking-wider uppercase'>
                Camera Quality
              </div>
              <div className='flex flex-col gap-0.5'>
                {qualities.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => changeVideoQuality(q.preset)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      videoQuality === q.preset
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-foreground/80 hover:text-foreground'
                    } `}
                  >
                    <span>{q.label}</span>
                    {videoQuality === q.preset && <Check className='h-4 w-4' />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SCREEN SHARE */}
        {(allowScreen || isAdmin) && (
          <button
            onClick={toggleScreen}
            disabled={busy || !localParticipant}
            className={baseBtn(isScreenShareEnabled, busy, 'normal')}
            title='Screen Share'
          >
            {busy ? (
              <Loader2 className='h-5 w-5 animate-spin' />
            ) : isScreenShareEnabled ? (
              <ScreenShareOff className='h-5 w-5' />
            ) : (
              <ScreenShare className='h-5 w-5' />
            )}
          </button>
        )}

        {/* REACTIONS */}
        {(allowReaction || isAdmin) && (
          <div className='relative'>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={baseBtn(showReactions, busy, 'normal')}
              title='Reactions'
            >
              <Smile className='h-5 w-5' />
            </button>
            {showReactions && (
              <div className='bg-card border-border animate-in fade-in slide-in-from-bottom-2 absolute bottom-full left-1/2 z-50 mb-4 flex -translate-x-1/2 gap-2 rounded-full border p-2 shadow-xl'>
                {['💖', '👍', '🎉', '👏', '😂', '😮'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className='p-1 text-2xl transition-transform hover:scale-125'
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RAISE HAND */}
        <button
          onClick={toggleHandRaise}
          className={baseBtn(handRaised, busy, 'normal')}
          title={handRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <Hand className='h-5 w-5' />
        </button>

        {/* LEAVE */}
        <button
          onClick={leaveRoom}
          className={`${baseBtn(false, false, 'destructive')} border-red-600 bg-red-600 hover:bg-red-700`}
          title='Leave'
        >
          <Phone className='h-5 w-5 rotate-135' />
        </button>
      </div>

      {/* RIGHT: Tools & Sidebars */}
      <div className='no-scrollbar mask-image-linear-to-l flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto pl-2 sm:gap-2'>
        <div className='flex flex-nowrap items-center gap-1 sm:gap-2'>
          {/* Tools Toggle (Whiteboard, Record, etc) */}
          <button
            onClick={() => onSidebarChange(activeSidebar === 'tools' ? null : 'tools')}
            className={minimalBtn(activeSidebar === 'tools', busy)}
            title='Tools & Activities'
          >
            <LayoutGrid className='h-5 w-5' />
          </button>

          {/* Presentation Toggle (If available) */}
          {hasPresentation && (
            <button
              onClick={onTogglePresentation}
              className={minimalBtn(isPresentationOpen ?? false, busy)}
              title='View Presentation'
            >
              <FileText className='h-5 w-5' />
            </button>
          )}

          {/* Participants */}
          <button
            onClick={() =>
              onSidebarChange(activeSidebar === 'participants' ? null : 'participants')
            }
            className={minimalBtn(activeSidebar === 'participants', busy)}
            title='Participants'
          >
            <Users className='h-5 w-5' />
          </button>

          {/* Chat */}
          <button
            onClick={() => onSidebarChange(activeSidebar === 'chat' ? null : 'chat')}
            className={minimalBtn(activeSidebar === 'chat', busy)}
            title='Chat'
          >
            <MessageSquare className='h-5 w-5' />
          </button>

          {/* Effects */}
          <button
            onClick={() => onSidebarChange(activeSidebar === 'settings' ? null : 'settings')}
            className={minimalBtn(activeSidebar === 'settings', busy)}
            title='Effects & Settings'
          >
            <Sparkles className='h-5 w-5' />
          </button>

          {/* Admin Permissions Menu */}
          {isAdmin && (
            <button
              onClick={() =>
                onSidebarChange(activeSidebar === 'host_controls' ? null : 'host_controls')
              }
              className={minimalBtn(activeSidebar === 'host_controls', busy)}
              title='Host Controls'
            >
              <Settings className='h-5 w-5' />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Controls
