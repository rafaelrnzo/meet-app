'use client'

import type { FC } from 'react'
import type { LocalUserChoices, PreJoinProps as PrejoinPropsBase } from '@livekit/components-react'
import type { RoomMetadata } from '@/feat/rooms/dto'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CameraDisabledIcon,
  CameraIcon,
  Chevron,
  MediaDeviceMenu,
  MicDisabledIcon,
  MicIcon,
} from '@livekit/components-react'
import { cn } from '@/lib/utils'
import { usePreJoin, useTabEffect } from '@/hooks'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Icon } from '@/components/ui/icon'
import { FieldError } from '@/components/ui/field'
import { ToggleTrack } from '@/components/ToggleTrack'
import { HugeIcon, Alert01Icon, Loading03Icon } from '@/components/HugeIcon'

export const defaultPrejoin = {
  autoCheck: false,
  isLoading: false,
  isLoadingLabel: 'Menghubungkan...',
  pageTitle: 'MEET',
  roomTitle: 'Test Room',
  roomIntro: 'Siap untuk bergabung?',
  joinLabel: 'Masuk Ruang Rapat',
  joinWithPasswordLabel: 'Masukkan Kata Sandi untuk Masuk',
  micLabel: 'Mikrofon utama',
  camLabel: 'Kamera utama',
  camOffLabel: 'Kamera mati',
  cancelLabel: 'Batal',
  rolesLabel: 'Bergabung sebagai',
  roleName: 'Super Admin',
  isGuest: true,
  withPassword: false,
  persistUserChoices: true,
}

export interface LocalUserChoicesPassword extends LocalUserChoices {
  password: string
}

export interface PreJoinProps extends Omit<PrejoinPropsBase, 'onSubmit' | 'onValidate'> {
  metadata: RoomMetadata
  autoCheck?: boolean
  camOffLabel?: string
  roomTitle?: string
  roomIntro?: string
  pageTitle?: string
  cancelLabel?: string
  rolesLabel?: string
  roleName?: string
  isLoading?: boolean
  isLoadingLabel?: string
  isGuest?: boolean
  withPassword?: boolean
  isWrongPassword?: boolean
  setIsWrongPassword?: React.Dispatch<boolean>
  onSubmit?: (values: LocalUserChoicesPassword) => void
  onValidate?: (values: LocalUserChoicesPassword) => boolean
}

export const PreJoin: FC<PreJoinProps> = ({ metadata, ...props }) => {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const {
    isLoading,
    isLoadingLabel,
    pageTitle,
    roomTitle,
    roomIntro,
    joinLabel,
    joinWithPasswordLabel,
    camOffLabel,
    cancelLabel,
    rolesLabel,
    roleName,
    isGuest,
    withPassword,
    isWrongPassword,
    setIsWrongPassword,
    className,
    micLabel,
    camLabel,
  } = useMemo(() => ({ ...defaultPrejoin, ...props }), [props])

  const {
    deniedDevices,
    formattedLabel,
    videoEl,
    facingMode,
    audioEnabled,
    audioDeviceId,
    audioTrack,
    videoEnabled,
    videoDeviceId,
    videoTrack,
    activeAudioLabel,
    activeVideoLabel,
    username,
    isValid,
    password,
    isMicDisabledTemporary,
    setAudioDeviceId,
    setVideoDeviceId,
    setUsername,
    setMedia,
    setPassword,
    handleToggleAudio,
    handleToggleVideo,
    handleSubmit,
  } = usePreJoin({ micLabel, camLabel, metadata, ...props })

  // Handle redirect invalid tabs
  useTabEffect()

  return (
    <main
      className={cn('flex h-full min-h-screen w-full items-center justify-center py-10', className)}
    >
      <figure className='fixed inset-0'>
        <img
          src='/img/prejoin-background.jpg'
          width={960}
          className='h-full w-full bg-black object-cover brightness-75'
        />
      </figure>
      <div className='relative mx-auto w-125 max-w-[87.5%]'>
        <h2 className='mb-6 text-center text-[48px] leading-12 font-semibold text-white'>
          {pageTitle}
        </h2>
        <div className='bg-background flex flex-col gap-4 rounded-md p-4 pt-8 text-sm md:p-8'>
          <header className='text-center'>
            <p className='text-primary text-2xl font-semibold'>{roomIntro}</p>
            <p className='mt-2'>{roomTitle}</p>
          </header>
          {!!deniedDevices.length && (
            <p className='text-destructive grid grid-cols-[18px_1fr] gap-3 rounded-md bg-red-200 p-4'>
              <HugeIcon icon={Alert01Icon} size={18} />
              Error: Tidak dapat menemukan {formattedLabel}, atau pengguna menolak atas izin akses{' '}
              {formattedLabel}. Silahkan muat ulang halaman ini, atau tutup dan kembali ke halaman
              ini untuk mengaktifkan {formattedLabel}.
            </p>
          )}
          <div className='bg-secondary relative aspect-video min-h-50 w-full overflow-hidden rounded-md'>
            <div className='absolute inset-0 flex flex-col items-center justify-end p-4'>
              <video
                ref={videoEl}
                width='1280'
                height='720'
                data-facing-mode={facingMode}
                className={cn(
                  'absolute inset-0 bg-cover data-[facing-mode=user]:rotate-y-180',
                  (!videoTrack || !videoEnabled) && 'invisible'
                )}
              />
              {(!videoTrack || !videoEnabled) && (
                <div className='text-muted-foreground absolute inset-0 flex flex-col items-center justify-center'>
                  <CameraDisabledIcon className='scale-[2]' />
                  <p className='mt-5 text-base font-semibold'>{camOffLabel}</p>
                </div>
              )}
              <div className='bg-background relative flex gap-1 overflow-hidden rounded-full'>
                <div className='bg-primary/20 absolute inset-0 h-auto! w-auto!' />
                <ToggleTrack
                  title={audioEnabled ? 'Bisukan mikrofon' : 'Aktifkan mikrofon'}
                  isActive={audioEnabled}
                  onClick={handleToggleAudio}
                  wrapperProps={{ className: cn('p-1') }}
                  disabled={isMicDisabledTemporary}
                  className='disabled:opacity-40'
                >
                  {audioEnabled ? <MicIcon /> : <MicDisabledIcon />}
                </ToggleTrack>
                <ToggleTrack
                  title={videoEnabled ? 'Tutup kamera' : 'Aktifkan kamera'}
                  isActive={videoEnabled}
                  onClick={handleToggleVideo}
                  wrapperProps={{ className: cn('p-1') }}
                >
                  {videoEnabled ? <CameraIcon /> : <CameraDisabledIcon />}
                </ToggleTrack>
              </div>
            </div>
          </div>
          {isMicDisabledTemporary && (
            <p className='-mt-3 text-center text-[80%] opacity-60'>
              Mikrofon dapat diaktifkan didalam ruang rapat.
            </p>
          )}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='flex flex-col gap-2'>
              <p>Mikrofon</p>
              <div id='list-audio' className='h-11 rounded-md border'>
                <MediaDeviceMenu
                  initialSelection={audioDeviceId}
                  kind='audioinput'
                  disabled={!audioTrack || !audioEnabled}
                  tracks={{ audioinput: audioTrack }}
                  onActiveDeviceChange={(_, id) => {
                    setAudioDeviceId(id)
                    setMedia((prev) => ({
                      ...prev,
                      audio:
                        typeof prev.audio === 'object'
                          ? { ...prev.audio, deviceId: id }
                          : prev.audio,
                    }))
                  }}
                  className={cn(
                    'hover:not-disabled:bg-secondary inline-flex h-11 w-full items-center justify-between gap-3 rounded-md px-3 disabled:opacity-40',
                    '[&+*]:bg-background [&+*]:absolute [&+*]:z-1 [&+*]:w-max [&+*]:min-w-40 [&+*]:rounded-md [&+*]:border [&+*]:p-2 [&+*]:shadow-lg',
                    '[&+*>ul>li:not([data-lk-active="true"])]:hover:not-disabled:bg-secondary [&+*_button]:h-10 [&+*_button]:w-full [&+*_button]:px-4 [&+*_button]:text-left [&+*>ul>li]:overflow-hidden [&+*>ul>li]:rounded-md [&+*>ul>li:not(:first-child)]:mt-1',
                    '[&+*_[data-lk-active="true"]>button]:bg-primary [&+*_[data-lk-active="true"]>button]:text-primary-foreground [&+*_[data-lk-active="true"]>button]:font-semibold'
                  )}
                >
                  <span className='flex w-full items-center gap-2 truncate text-left'>
                    <MicIcon />
                    <span className='block w-full truncate'>{activeAudioLabel}</span>
                  </span>
                  <Chevron />
                </MediaDeviceMenu>
              </div>
            </div>
            <div className='flex flex-col gap-2'>
              <p>Kamera</p>
              <div id='list-video' className='h-11 rounded-md border'>
                <MediaDeviceMenu
                  initialSelection={videoDeviceId}
                  kind='videoinput'
                  disabled={!videoTrack || !videoEnabled}
                  tracks={{ videoinput: videoTrack }}
                  onActiveDeviceChange={(_, id) => {
                    setVideoDeviceId(id)
                    setMedia((prev) => ({
                      ...prev,
                      video:
                        typeof prev.video === 'object'
                          ? { ...prev.video, deviceId: id }
                          : prev.video,
                    }))
                  }}
                  className={cn(
                    'hover:not-disabled:bg-secondary inline-flex h-11 w-full items-center justify-between gap-3 rounded-md px-3 disabled:opacity-40',
                    '[&+*]:bg-background [&+*]:absolute [&+*]:z-1 [&+*]:w-max [&+*]:min-w-40 [&+*]:rounded-md [&+*]:border [&+*]:p-2 [&+*]:shadow-lg',
                    '[&+*>ul>li:not([data-lk-active="true"])]:hover:not-disabled:bg-secondary [&+*_button]:h-10 [&+*_button]:w-full [&+*_button]:px-4 [&+*_button]:text-left [&+*>ul>li]:overflow-hidden [&+*>ul>li]:rounded-md [&+*>ul>li:not(:first-child)]:mt-1',
                    '[&+*_[data-lk-active="true"]>button]:bg-primary [&+*_[data-lk-active="true"]>button]:text-primary-foreground [&+*_[data-lk-active="true"]>button]:font-semibold'
                  )}
                >
                  <span className='flex w-full items-center gap-2 truncate text-left'>
                    <CameraIcon />
                    <span className='block w-full truncate'>{activeVideoLabel}</span>
                  </span>
                  <Chevron />
                </MediaDeviceMenu>
              </div>
            </div>
          </div>
          <div className='flex items-center justify-center gap-2.5'>
            <p className='text-right'>{rolesLabel}</p>
            <span className='border-primary text-primary rounded-full border p-3 whitespace-nowrap first-letter:capitalize'>
              {isGuest ? 'Tamu' : roleName}
            </span>
          </div>
          <form className='grid grid-cols-1 gap-3'>
            {isGuest && (
              <div className='flex items-center justify-center'>
                <input
                  id='username'
                  name='username'
                  type='text'
                  className='hover:not-disabled:bg-secondary inline-flex h-11 w-full items-center justify-between rounded-md border px-3 text-sm disabled:opacity-40'
                  value={username}
                  required
                  onChange={(e) => setUsername(e.currentTarget.value)}
                  autoComplete='off'
                  placeholder='Masukkan nama'
                />
              </div>
            )}
            {withPassword && (
              <div className='mb-1 space-y-2'>
                <InputGroup>
                  <InputGroupInput
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                    onChange={(e) => {
                      setPassword(e.target.value)

                      if (isWrongPassword) {
                        setIsWrongPassword?.(false)
                      }
                    }}
                    autoComplete='off'
                    placeholder='Masukkan kata sandi'
                    aria-invalid={isWrongPassword}
                  />
                  <InputGroupAddon
                    align='inline-end'
                    onClick={() => setShowPassword((prev) => !prev)}
                    className='cursor-pointer'
                  >
                    <Icon
                      type={showPassword ? 'eye-off' : 'eye'}
                      className='active:text-neutral-950'
                    />
                  </InputGroupAddon>
                </InputGroup>
                {isWrongPassword && (
                  <FieldError
                    errors={[
                      {
                        message:
                          '✕ Kata sandi salah, harap gunakan kata sandi yang dibagikan oleh admin',
                      },
                    ]}
                    className='text-error text-xs'
                  />
                )}
              </div>
            )}
            <button
              type='submit'
              className={cn(
                'bg-primary text-primary-foreground inline-flex h-11 items-center justify-center rounded-md px-4 font-semibold hover:bg-red-900 disabled:opacity-40',
                withPassword &&
                  !password &&
                  'border border-neutral-400 bg-neutral-50 text-neutral-400 hover:bg-neutral-50 disabled:opacity-100'
              )}
              onClick={handleSubmit}
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
                <>
                  <HugeIcon icon={Loading03Icon} size={20} className='animate-spin' />
                  {isLoadingLabel && <span className='ml-2 inline-block'>{isLoadingLabel}</span>}
                </>
              ) : withPassword && !password ? (
                joinWithPasswordLabel
              ) : (
                joinLabel
              )}
            </button>
            <button
              type='button'
              className='hover:not-disabled:bg-secondary inline-flex h-11 items-center justify-center rounded-md border px-4 font-semibold shadow'
              onClick={() => router.back()}
            >
              {cancelLabel}
            </button>
          </form>
        </div>
        <p className='text-background mt-6 text-center text-sm font-semibold'>
          Dengan bergabung, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.
        </p>
      </div>
    </main>
  )
}
