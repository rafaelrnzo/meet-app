'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  createLocalVideoTrack,
  createLocalAudioTrack,
  LocalVideoTrack,
  LocalAudioTrack,
} from 'livekit-client'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  Users,
  ArrowRight,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function LocalVideoPreview({ track }: { track: LocalVideoTrack }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (el && track) {
      track.attach(el)
    }
    return () => {
      if (el && track) {
        track.detach(el)
      }
    }
  }, [track])

  return (
    <video
      ref={videoRef}
      className='h-full w-full scale-x-[-1] transform object-cover'
      muted
      playsInline
      autoPlay
    />
  )
}

export interface MediaChoices {
  audioEnabled: boolean
  videoEnabled: boolean
  audioDeviceId: string
  videoDeviceId: string
  username: string
  password?: string
}

interface PreJoinProps {
  roomName: string
  initialUsername: string
  isKicked?: boolean
  isAdmin?: boolean
  onJoin: (choices: MediaChoices) => void
  isLoading?: boolean
  passwordRequired?: boolean
  disableNameInput?: boolean
}

export default function PreJoin({
  roomName,
  initialUsername,
  onJoin,
  isLoading,
  passwordRequired,
  disableNameInput,
}: PreJoinProps) {
  const router = useRouter()
  const [username, setUsername] = useState(initialUsername)
  const [password, setPassword] = useState('')
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)

  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null)
  const [audioTrack, setAudioTrack] = useState<LocalAudioTrack | null>(null)

  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])

  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('')

  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        if (videoEnabled) {
          try {
            if (!navigator.mediaDevices) {
              throw new Error('Media devices not supported or secure context required.')
            }
            const vTrack = await createLocalVideoTrack({
              resolution: { width: 1280, height: 720 },
            })
            if (mounted) setVideoTrack(vTrack)
          } catch (e) {
            console.error('Failed to create video track', e)
          }
        }

        let devices: MediaDeviceInfo[] = []
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          devices = await navigator.mediaDevices.enumerateDevices()
        }
        const audios = devices.filter((d) => d.kind === 'audioinput' && d.deviceId !== '')
        const videos = devices.filter((d) => d.kind === 'videoinput' && d.deviceId !== '')

        if (mounted) {
          setAudioDevices(audios)
          setVideoDevices(videos)
          if (audios.length > 0) setSelectedAudioDevice(audios[0].deviceId)
          if (videos.length > 0) setSelectedVideoDevice(videos[0].deviceId)
        }

        setInitializing(false)
      } catch (e) {
        console.error('Error initializing media:', e)
        setInitializing(false)
      }
    }

    init()

    return () => {
      mounted = false
      videoTrack?.stop()
      audioTrack?.stop()
    }
  }, [])

  const toggleVideo = async () => {
    if (videoEnabled) {
      setVideoEnabled(false)
      videoTrack?.stop()
      setVideoTrack(null)
    } else {
      setVideoEnabled(true)
      try {
        if (!navigator.mediaDevices) throw new Error('Media devices not supported')
        const vTrack = await createLocalVideoTrack({
          deviceId: selectedVideoDevice,
          resolution: { width: 1280, height: 720 },
        })
        setVideoTrack(vTrack)
      } catch (e) {
        console.error('Failed to enable video', e)
        setVideoEnabled(false)
      }
    }
  }

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled)
  }

  const changeVideoDevice = async (deviceId: string) => {
    setSelectedVideoDevice(deviceId)
    if (videoEnabled) {
      videoTrack?.stop()
      try {
        if (!navigator.mediaDevices) throw new Error('Media devices not supported')
        const vTrack = await createLocalVideoTrack({
          deviceId: deviceId,
          resolution: { width: 1280, height: 720 },
        })
        setVideoTrack(vTrack)
      } catch (e) {
        console.error('Failed to switch video device', e)
      }
    }
  }

  const handleJoin = () => {
    videoTrack?.stop()

    onJoin({
      audioEnabled,
      videoEnabled,
      audioDeviceId: selectedAudioDevice,
      videoDeviceId: selectedVideoDevice,
      username,
      password: passwordRequired ? password : '',
    })
  }

  return (
    <div className='bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4'>
      <div className='bg-grid-white/[0.02] absolute inset-0 bg-[size:50px_50px]' />
      <div className='bg-background absolute h-full w-full [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]' />

      <div className='absolute top-6 left-6 z-20'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.back()}
          className='text-muted-foreground hover:text-foreground gap-2 hover:bg-white/5'
        >
          <ArrowLeft className='h-4 w-4' />
          Back
        </Button>
      </div>

      <div className='relative z-10 flex w-full max-w-md flex-col gap-4'>
        {typeof window !== 'undefined' &&
          !window.isSecureContext &&
          window.location.hostname !== 'localhost' && (
            <div className='bg-destructive/90 text-destructive-foreground animate-in fade-in slide-in-from-top-4 rounded-lg p-3 text-center text-sm font-medium'>
              Warning: Camera and microphone are blocked on insecure connections (HTTP). Please
              access via HTTPS or localhost.
            </div>
          )}

        <div className='bg-card/40 animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-4 rounded-3xl border border-white/10 p-4 shadow-xl backdrop-blur-xl duration-500'>
          <div className='space-y-1 text-center'>
            <h1 className='text-xl font-bold tracking-tight'>Ready to join?</h1>
            <p className='text-muted-foreground text-xs'>
              <span className='text-foreground font-semibold'>{roomName}</span>
            </p>
          </div>

          <div className='bg-muted/30 group relative aspect-video overflow-hidden rounded-xl border border-white/10 shadow-inner'>
            {videoEnabled && videoTrack ? (
              <LocalVideoPreview track={videoTrack} />
            ) : (
              <div className='bg-card/50 text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2'>
                <div className='bg-background/50 rounded-full p-3 backdrop-blur-sm'>
                  <VideoOff className='h-6 w-6 opacity-50' />
                </div>
                <p className='text-xs font-medium'>Camera is off</p>
              </div>
            )}

            <div className='absolute bottom-3 left-1/2 flex -translate-x-1/2 translate-y-2 items-center gap-2 rounded-full border border-white/10 bg-black/60 p-1.5 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100'>
              <Button
                variant={audioEnabled ? 'secondary' : 'destructive'}
                size='icon'
                className='h-8 w-8 rounded-full transition-all'
                onClick={toggleAudio}
              >
                {audioEnabled ? (
                  <Mic className='h-3.5 w-3.5' />
                ) : (
                  <MicOff className='h-3.5 w-3.5' />
                )}
              </Button>
              <Button
                variant={videoEnabled ? 'secondary' : 'destructive'}
                size='icon'
                className='h-8 w-8 rounded-full transition-all'
                onClick={toggleVideo}
              >
                {videoEnabled ? (
                  <Video className='h-3.5 w-3.5' />
                ) : (
                  <VideoOff className='h-3.5 w-3.5' />
                )}
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-2'>
            <div className='space-y-1'>
              <Select
                value={selectedAudioDevice}
                onValueChange={setSelectedAudioDevice}
                disabled={audioDevices.length === 0}
              >
                <SelectTrigger className='bg-background/50 h-8 border-white/10 text-xs'>
                  <span className='truncate'>
                    {audioDevices.find((d) => d.deviceId === selectedAudioDevice)?.label || 'Mic'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map((d, i) => (
                    <SelectItem key={d.deviceId} value={d.deviceId} className='text-xs'>
                      {d.label || `Mic ${i + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Select
                value={selectedVideoDevice}
                onValueChange={changeVideoDevice}
                disabled={videoDevices.length === 0}
              >
                <SelectTrigger className='bg-background/50 h-8 border-white/10 text-xs'>
                  <span className='truncate'>
                    {videoDevices.find((d) => d.deviceId === selectedVideoDevice)?.label ||
                      'Camera'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map((d, i) => (
                    <SelectItem key={d.deviceId} value={d.deviceId} className='text-xs'>
                      {d.label || `Camera ${i + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-3 pt-1'>
            {!disableNameInput ? (
              <div className='space-y-1'>
                <label className='ml-1 text-xs font-medium'>Display Name</label>
                <input
                  type='text'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className='border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  placeholder='Enter your name'
                />
              </div>
            ) : (
              <div className='flex items-center justify-center gap-2 py-1'>
                <span className='text-muted-foreground text-xs'>Joining as</span>
                <div className='bg-primary/10 text-primary flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium'>
                  <div className='bg-primary/20 flex h-4 w-4 items-center justify-center rounded-full text-[10px]'>
                    {username.charAt(0).toUpperCase()}
                  </div>
                  {username}
                </div>
              </div>
            )}

            {passwordRequired && (
              <div className='space-y-1'>
                <label className='ml-1 text-xs font-medium'>Room Password</label>
                <input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  placeholder='Enter password'
                />
              </div>
            )}

            <Button
              size='lg'
              className='mt-2 h-10 w-full gap-2 text-sm'
              onClick={handleJoin}
              disabled={isLoading || !username.trim()}
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <ArrowRight className='h-4 w-4' />
              )}
              Join Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
