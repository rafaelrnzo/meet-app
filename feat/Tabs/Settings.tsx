'use client'

import type { FC } from 'react'
import type { DbRoom } from '@/lib/api/admin-api'
import type { RoomSSEDTO } from '@/feat/rooms/dto'
import { default as React, useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from '@tanstack/react-form'
import { useRoomContext } from '@livekit/components-react'
import { cn, qstring } from '@/lib/utils'
import { fetchRoomByCode, generatePassword, updateDbRoom } from '@/lib/api/admin-api'
import { useEventSource } from '@/hooks/use-event-source'
import { useParamsState } from '@/hooks'
import { RoomSSEEvent } from '@/feat/rooms/dto'
import { defaultErrorMessage } from '@/config'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/sonner'
import { ModalDelete } from '@/components/ui/modal'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Icon } from '@/components/ui/icon'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
} from '@/components/ui/field'
import { Button } from '@/components/ui/button'

interface SwitchComponentProps {
  id: string
  title: string
  description: string
  switchProps: React.ComponentProps<typeof Switch>
  withoutBackground?: boolean
}

interface FormWrapperProps {
  title: string
  children: React.ReactNode
}

interface FormFieldProps {
  title: React.ComponentProps<typeof FieldTitle>['children']
  description?: React.ComponentProps<typeof FieldDescription>['children']
  input?: React.ReactNode
  orientation?: React.ComponentProps<typeof Field>['orientation']
}

function SwitchComponent({
  id,
  title,
  description,
  switchProps,
  withoutBackground,
}: SwitchComponentProps) {
  return (
    <FieldLabel
      htmlFor={id}
      className={cn(
        'border-red-800 bg-red-50 has-data-[state=checked]:border-red-800 has-data-[state=checked]:bg-red-50 *:data-[slot=field]:px-3 *:data-[slot=field]:py-2',
        withoutBackground &&
          'border-none bg-transparent has-data-[state=checked]:bg-transparent has-[>[data-slot=field]]:rounded-none *:data-[slot=field]:p-0'
      )}
    >
      <FormField
        title={
          <>
            {title}
            <Switch {...switchProps} id={id} />
          </>
        }
        description={description}
      />
    </FieldLabel>
  )
}

function FormWrapper({ title, children }: FormWrapperProps) {
  return (
    <div className='space-y-3'>
      <h1 className='text-base font-semibold text-neutral-400'>{title}</h1>
      {children}
    </div>
  )
}

function FormField({ title, description, input, orientation = 'horizontal' }: FormFieldProps) {
  return (
    <Field orientation={orientation} className='items-center! gap-2'>
      <FieldContent>
        <FieldTitle className='w-full justify-between text-base font-normal text-red-800'>
          {title}
        </FieldTitle>
        <FieldDescription className={cn('text-xs text-neutral-950', !description && 'hidden')}>
          {description}
        </FieldDescription>
      </FieldContent>
      {input}
    </Field>
  )
}

export const TabsSettings: FC = () => {
  const { openTabsSettingsRecordings, openTabsSettingsRooms, openTabsSettingsParticipants } =
    useParamsState()
  const room = useRoomContext()
  const { data: session } = useSession()
  const [confirmAsModerator, setConfirmAsModerator] = useState(false)
  const [confirmGenerate, setConfirmGenerate] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [password, setPassword] = useState<string>('')
  const [roomData, setRoomData] = useState<DbRoom | null>(null)
  const inputPasswordRef = useRef<HTMLDivElement>(null)

  const form = useForm({
    defaultValues: {
      enableStartRoom: false,
      enableWaitingRoom: false,
      enableParticipantMicrophones: false,
      turnEveryoneIntoModerators: false,
      presentationFileSize: '10',
    },
  })

  const getRoom = useCallback(async () => {
    try {
      const response = await fetchRoomByCode(room.name)
      setRoomData(response)
      setPassword(response.password ?? '')
    } catch {
      setRoomData(null)
      setPassword('')
    }
  }, [room.name])

  const manualUpdatePasswordHandler = async () => {
    if (!roomData) return

    try {
      await updateDbRoom(roomData.id, {
        name: roomData.name,
        max_participants: roomData.max_participants,
        password,
      })
      toast.success('Berhasil ubah sandi ruangan', {
        description: `Sandi ruangan “${roomData.password}” menjadi “${password}”`,
      })
      setConfirmGenerate(false)
      setIsEditingPassword(false)
    } catch (error) {
      toast.error('Gagal ubah sandi ruangan', {
        description: error instanceof Error ? error.message : defaultErrorMessage,
      })
    }
  }

  const generatePasswordHandler = async () => {
    if (!roomData) return

    try {
      const response = await generatePassword(roomData.id)
      toast.success('Berhasil ubah sandi ruangan', {
        description: `Sandi ruangan “${roomData.password}” menjadi “${response.password}”`,
      })
      setConfirmGenerate(false)
      getRoom()
    } catch (error) {
      toast.error('Gagal ubah sandi ruangan', {
        description: error instanceof Error ? error.message : defaultErrorMessage,
      })
    }
  }

  const resetPasswordHandler = useCallback(async () => {
    setPassword(roomData?.password ?? '')
    setIsEditingPassword(false)
  }, [roomData?.password])

  useEffect(() => {
    getRoom()
  }, [getRoom])

  useEventSource<RoomSSEDTO>({
    eventUrl: qstring(`${session?.publicUrl}/api/rooms/events`, { token: session?.access_token }),
    onMessage: (event) => {
      if (event.type === RoomSSEEvent.RoomUpdated) {
        getRoom()
      }
    },
  })

  useEffect(() => {
    const handleClickOutsideRename = (event: MouseEvent | TouchEvent) => {
      if (!inputPasswordRef.current) return

      if (
        event.target instanceof Node &&
        !inputPasswordRef.current.contains(event.target) &&
        !confirmGenerate
      ) {
        resetPasswordHandler()
      }
    }

    document.addEventListener('mousedown', handleClickOutsideRename)
    document.addEventListener('touchstart', handleClickOutsideRename)

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideRename)
      document.removeEventListener('touchstart', handleClickOutsideRename)
    }
  }, [confirmGenerate, resetPasswordHandler])

  return (
    <>
      <FieldGroup className='gap-8'>
        <FormWrapper title='Mulai ruangan rapat'>
          <form.Field name='enableStartRoom'>
            {(field) => {
              return (
                <SwitchComponent
                  id={field.name}
                  title='Aktifkan mulai ruang'
                  description='Jika diaktifkan, semua peserta dapat memulai rapat.'
                  switchProps={{
                    checked: field.state.value,
                    onCheckedChange: field.handleChange,
                  }}
                />
              )
            }}
          </form.Field>
        </FormWrapper>

        <FormWrapper title='Ruang tunggu'>
          <form.Field name='enableWaitingRoom'>
            {(field) => {
              return (
                <SwitchComponent
                  id={field.name}
                  title='Aktifkan ruang tunggu'
                  description='Jika diaktifkan, peserta baru harus disetujui oleh admin'
                  switchProps={{
                    checked: field.state.value,
                    onCheckedChange: field.handleChange,
                  }}
                />
              )
            }}
          </form.Field>
        </FormWrapper>

        <FormWrapper title='Cari ruangan'>
          <FormField
            title='Cari ruangan lain'
            description='Anda dapat mencari ruang lain saat rapat berlangsung.'
            input={
              <Button variant='secondary-outline' onClick={() => openTabsSettingsRooms()}>
                Cari Ruangan
              </Button>
            }
          />
        </FormWrapper>

        <FormWrapper title='Ubah sandi ruangan'>
          <FormField
            title='Ubah sandi'
            input={
              <div className='flex gap-2'>
                <InputGroup ref={inputPasswordRef}>
                  <InputGroupInput
                    value={password}
                    onChange={(event) => {
                      if (!isEditingPassword) return
                      setPassword(event.target.value)
                    }}
                    disabled={!isEditingPassword}
                  />
                  <InputGroupAddon align='inline-end'>
                    <Button
                      variant='ghost'
                      className={cn(
                        'hover:bg-transparent',
                        isEditingPassword && 'text-success hover:text-green-600'
                      )}
                      onClick={() => {
                        if (!isEditingPassword) {
                          setIsEditingPassword(true)
                          return
                        }

                        if (roomData?.password === password) {
                          setIsEditingPassword(false)
                          return
                        }

                        setConfirmGenerate(true)
                      }}
                      disabled={!roomData}
                    >
                      {isEditingPassword ? (
                        <Icon type='check' className='fill-transparent stroke-0' />
                      ) : (
                        <Icon type='pencil' />
                      )}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>

                <Button variant='secondary-outline' onClick={() => setConfirmGenerate(true)}>
                  <Icon type='arrow-clockwise' />
                </Button>
              </div>
            }
            orientation='vertical'
          />
        </FormWrapper>

        <FieldSeparator className='h-fit' />

        <FormWrapper title='Izinkan peserta rapat untuk:'>
          <FieldGroup className='gap-3'>
            <form.Field name='enableParticipantMicrophones'>
              {(field) => {
                return (
                  <SwitchComponent
                    id={field.name}
                    title='Aktifkan mikrofon peserta'
                    description='Jika dimatikan, peserta tidak dapat menyalakan mikrofon mereka. Admin tetap
                    dapat menyalakan mikrofon mereka.'
                    switchProps={{
                      checked: field.state.value,
                      onCheckedChange: field.handleChange,
                    }}
                    withoutBackground
                  />
                )
              }}
            </form.Field>

            <form.Field name='turnEveryoneIntoModerators'>
              {(field) => {
                return (
                  <SwitchComponent
                    id={field.name}
                    title='Ubah semua orang menjadi moderator'
                    description='Jika dinyalakan, semua pengguna akan menjadi moderator.'
                    switchProps={{
                      checked: field.state.value,
                      onCheckedChange: () => setConfirmAsModerator(true),
                    }}
                    withoutBackground
                  />
                )
              }}
            </form.Field>
          </FieldGroup>
        </FormWrapper>

        <FieldSeparator className='h-fit' />

        <FormWrapper title='Daftar peserta yang telah masuk'>
          <FormField
            title='Lihat peserta'
            input={
              <Button variant='secondary-outline' onClick={() => openTabsSettingsParticipants()}>
                Lihat peserta
              </Button>
            }
          />
        </FormWrapper>

        <FormWrapper title='Daftar peserta yang telah masuk'>
          <form.Field name='presentationFileSize'>
            {(field) => {
              return (
                <FormField
                  title='Menyesuaikan ukuran berkas presentasi'
                  input={
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 text-xs'>Anda dapat menyesuaikan ukuran berkas</div>
                      <InputGroup className='max-w-25'>
                        <InputGroupInput
                          id={field.name}
                          type='number'
                          min={1}
                          className='[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                        />
                        <InputGroupAddon align='inline-end'>
                          <InputGroupText>MB</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </div>
                  }
                  orientation='vertical'
                />
              )
            }}
          </form.Field>
        </FormWrapper>

        <FormWrapper title='Daftar rekaman rapat'>
          <FormField
            title='Lihat rekaman rapat'
            input={
              <Button variant='secondary-outline' onClick={() => openTabsSettingsRecordings()}>
                Lihat hasil rekaman rapat
              </Button>
            }
          />
        </FormWrapper>
      </FieldGroup>

      <ModalDelete
        root={{ open: confirmAsModerator, onOpenChange: setConfirmAsModerator }}
        submit={{ children: 'Ubah semua menjadi moderator' }}
        title={{ children: 'Ubah semua menjadi moderator' }}
        content={{ className: 'w-[342px]', onCloseAutoFocus: (e) => e.preventDefault() }}
        cancel={{ children: 'Batal' }}
      >
        Tindakan ini akan memengaruhi kendali ruang rapat. Apakah Anda yakin ingin mengizinkan semua
        orang mengendalikan ruang rapat?
      </ModalDelete>

      <ModalDelete
        root={{ open: confirmGenerate, onOpenChange: setConfirmGenerate }}
        submit={{
          children: 'Ya, ubah sandi ruangan',
          onClick: async () => {
            if (isEditingPassword) {
              await manualUpdatePasswordHandler()
            } else {
              await generatePasswordHandler()
            }
          },
        }}
        title={{ children: 'Ubah sandi ruangan?' }}
        content={{ className: 'w-[342px]', onCloseAutoFocus: (e) => e.preventDefault() }}
        cancel={{
          children: 'Tetap pakai sandi yang sekarang',
          onClick: () => {
            resetPasswordHandler()
            setConfirmGenerate(false)
          },
        }}
      >
        Sandi ruangan saat ini akan diganti dengan sandi baru. Setelah proses ini dilakukan, Anda
        akan keluar dari ruangan rapat dan kembali ke halaman utama. Peserta hanya dapat bergabung
        menggunakan kode ruangan yang baru.
      </ModalDelete>
    </>
  )
}
