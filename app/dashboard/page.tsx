'use client'

import ProtectedRoute from '@/src/components/ProtectedRoute'
import { authService } from '@/src/services/auth'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import api from '@/src/services/api'
import { motion } from 'framer-motion'
import {
  Activity,
  LogOut,
  Radio,
  RefreshCw,
  Loader2,
  ShieldCheck,
  User,
  Users,
  Presentation,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRealTimeRooms, applyRoomEventToActiveRooms } from '@/hooks/use-real-time-rooms'
import { fetchActiveRooms } from '@/lib/api/admin-api'
import type { ActiveRoom } from '@/lib/api/admin-api'

interface UserProfile {
  id?: number
  username: string
  role?: string | { name?: string }
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
  const loadingActiveRoomsRef = useRef(false)

  const loadActiveRooms = useCallback(async () => {
    if (loadingActiveRoomsRef.current) return
    loadingActiveRoomsRef.current = true
    try {
      const rooms = await fetchActiveRooms()
      setActiveRooms(rooms || [])
    } catch (err) {
      console.error('Failed to fetch active rooms', err)
    } finally {
      loadingActiveRoomsRef.current = false
    }
  }, [])

  useEffect(() => {
    loadActiveRooms()
  }, [loadActiveRooms])

  useEffect(() => {
    const intervalId = window.setInterval(loadActiveRooms, 2000)
    return () => window.clearInterval(intervalId)
  }, [loadActiveRooms])

  const { status: roomEventStatus, lastEvent } = useRealTimeRooms((event) => {
    setActiveRooms((current) => applyRoomEventToActiveRooms(current, event))
    loadActiveRooms()
  })

  const handleLogout = () => {
    authService.logout()
  }

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/me')
      setProfile(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch profile from backend')
    } finally {
      setLoading(false)
    }
  }

  const roleName =
    typeof profile?.role === 'string' ? profile.role : profile?.role?.name || 'Not loaded'
  const participantCount =
    lastEvent?.data?.participant_count ?? lastEvent?.data?.participants ?? undefined
  const roomId = lastEvent?.data?.room_id
  const totalParticipants = useMemo(
    () => activeRooms.reduce((acc, room) => acc + (room.num_publishers || 0), 0),
    [activeRooms]
  )
  const hasLiveRooms = activeRooms.length > 0
  const hasLiveParticipants = totalParticipants > 0

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-slate-950 p-6 text-slate-100 md:p-10'>
        <div className='mx-auto max-w-4xl space-y-8'>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='flex flex-col justify-between gap-4 md:flex-row md:items-center'
          >
            <div>
              <h1 className='bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent'>
                Dashboard
              </h1>
              <p className='mt-2 text-slate-400'>Welcome back! You are securely logged in.</p>
            </div>
            <Button
              variant='destructive'
              onClick={handleLogout}
              className='w-full gap-2 shadow-lg shadow-red-500/20 transition-all hover:shadow-red-500/30 md:w-auto'
            >
              <LogOut className='h-4 w-4' />
              Sign Out
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='grid gap-6 md:grid-cols-2'
          >
            <Card className='border-slate-800 bg-slate-900/50 shadow-xl backdrop-blur-sm'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-xl text-slate-100'>
                  <User className='h-5 w-5 text-emerald-400' />
                  User Profile
                </CardTitle>
                <CardDescription className='text-slate-400'>
                  Fetch your profile information from the secure backend.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='group relative flex min-h-[120px] items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-950/50 p-4'>
                  {loading ? (
                    <div className='flex flex-col items-center gap-2 text-emerald-400'>
                      <Loader2 className='h-8 w-8 animate-spin' />
                      <span className='text-sm font-medium'>Fetching data...</span>
                    </div>
                  ) : profile ? (
                    <div className='w-full space-y-2 text-left'>
                      <div className='flex items-center justify-between border-b border-slate-800 pb-2'>
                        <span className='text-sm text-slate-400'>Username</span>
                        <span className='font-medium text-slate-200'>{profile.username}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-slate-400'>Role</span>
                        <span className='font-medium text-slate-200'>{roleName}</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className='text-center'>
                      <p className='mb-1 text-sm font-medium text-red-400'>{error}</p>
                      <p className='text-xs text-slate-500'>Is the backend running?</p>
                    </div>
                  ) : (
                    <div className='text-center text-slate-500'>
                      <p className='text-sm'>No profile data loaded</p>
                      <p className='mt-1 text-xs'>Click the button below to fetch</p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={fetchProfile}
                  disabled={loading}
                  className='w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700'
                >
                  {loading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <RefreshCw className='h-4 w-4' />
                  )}
                  {loading ? 'Fetching...' : 'Fetch Profile Data'}
                </Button>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className='border-slate-800 bg-slate-900/50 shadow-xl backdrop-blur-sm'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-xl text-slate-100'>
                  <ShieldCheck className='h-5 w-5 text-cyan-400' />
                  Realtime Status
                </CardTitle>
                <CardDescription className='text-slate-400'>
                  Current session and room event stream information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center rounded-lg border border-slate-800 bg-slate-950/30 p-3'>
                    <div className='mr-3 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'></div>
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-slate-200'>Session Active</p>
                      <p className='text-xs text-slate-500'>
                        You have a valid authentication token
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center rounded-lg border border-slate-800 bg-slate-950/30 p-3'>
                    <div
                      className={`mr-3 h-2 w-2 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)] ${
                        roomEventStatus === 'connected' ? 'bg-cyan-500' : 'bg-amber-500'
                      }`}
                    ></div>
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-slate-200'>Room Events</p>
                      <p className='text-xs text-slate-500 capitalize'>{roomEventStatus}</p>
                    </div>
                  </div>
                  <div className='rounded-lg border border-slate-800 bg-slate-950/30 p-3'>
                    <div className='mb-3 flex items-center gap-2'>
                      <Presentation className='h-4 w-4 text-emerald-400' />
                      <p className='text-sm font-medium text-slate-200'>Active Rooms Overview</p>
                    </div>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <div className='flex flex-col gap-1 rounded border border-slate-800/60 bg-slate-900/40 p-2'>
                        <span className='text-xs text-slate-400'>Total Live Rooms</span>
                        <div className='flex items-center gap-2 text-lg font-semibold text-slate-200'>
                          <span className='relative flex h-2.5 w-2.5'>
                            {hasLiveRooms && (
                              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75'></span>
                            )}
                            <span
                              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${hasLiveRooms ? 'bg-red-500' : 'bg-slate-500'}`}
                            ></span>
                          </span>
                          {activeRooms.length}
                        </div>
                      </div>
                      <div className='flex flex-col gap-1 rounded border border-slate-800/60 bg-slate-900/40 p-2'>
                        <span className='text-xs text-slate-400'>Total Participants</span>
                        <div className='flex items-center gap-2 text-lg font-semibold text-slate-200'>
                          <span className='relative flex h-2.5 w-2.5'>
                            {hasLiveParticipants && (
                              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75'></span>
                            )}
                            <span
                              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${hasLiveParticipants ? 'bg-emerald-500' : 'bg-slate-500'}`}
                            ></span>
                          </span>
                          <Users className='h-4 w-4 text-emerald-500' />
                          {totalParticipants}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='rounded-lg border border-slate-800 bg-slate-950/30 p-3'>
                    <div className='mb-3 flex items-center justify-between gap-3'>
                      <div className='flex items-center gap-2'>
                        <Radio className='h-4 w-4 text-emerald-400' />
                        <p className='text-sm font-medium text-slate-200'>Last Room Event</p>
                      </div>
                      <Badge className='rounded-md border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-900'>
                        {lastEvent?.type || 'waiting'}
                      </Badge>
                    </div>
                    <div className='grid gap-2 text-xs text-slate-400'>
                      <div className='flex items-center justify-between gap-3'>
                        <span>Room</span>
                        <span className='truncate text-slate-200'>{roomId || '-'}</span>
                      </div>
                      <div className='flex items-center justify-between gap-3'>
                        <span>Participants</span>
                        <span className='text-slate-200'>
                          {typeof participantCount === 'number' ? participantCount : '-'}
                        </span>
                      </div>
                      <div className='flex items-center justify-between gap-3'>
                        <span>Identity</span>
                        <span className='truncate text-slate-200'>
                          {lastEvent?.data?.identity || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className='border-slate-800 bg-slate-900/50 shadow-xl backdrop-blur-sm'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-xl text-slate-100'>
                  <Activity className='h-5 w-5 text-emerald-400' />
                  Room Event Payload
                </CardTitle>
                <CardDescription className='text-slate-400'>
                  Live SSE payload from the backend room event stream.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className='max-h-72 overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs leading-5 text-slate-300'>
                  {lastEvent ? JSON.stringify(lastEvent, null, 2) : 'Waiting for room events...'}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
