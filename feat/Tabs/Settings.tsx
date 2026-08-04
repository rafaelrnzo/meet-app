'use client'

import type { FC } from 'react'
import { default as React } from 'react'
import { cn, randomString } from '@/lib/utils'
import { useTabsSettings, useParamsState } from '@/hooks'
import { Switch } from '@/components/ui/switch'
import { ModalDelete } from '@/components/ui/modal'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
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

// TODO: menu settings hanya bisa diakses admin dan moderator
export const TabsSettings: FC = () => {
  const { openTabsSettingsRecordings, openTabsSettingsRooms, openTabsSettingsParticipants } =
    useParamsState()
  const {
    confirmGenerate,
    confirmRemovePw,
    confirmAsModerator,
    confirmFileSize,
    permissions,
    disableUploadSize,
    draftRoom,
    allModerators,
    updateDraftRoom,
    setConfirmGenerate,
    setConfirmRemovePw,
    updateRoomHandler,
    setConfirmAsModerator,
    setConfirmFileSize,
    everyoneToModeratorHandler,
  } = useTabsSettings()
  const {
    canEnableWaitingRoom,
    canGeneratePassword,
    canSearchOtherRoom,
    canSetFileSize,
    canViewMemberList,
    canChangeEveryoneToModerator,
    canViewRecordingList,
  } = permissions

  return (
    <>
      <FieldGroup className='gap-8'>
        <FormWrapper title='Mulai ruangan rapat'>
          <SwitchComponent
            id='enableStartRoom'
            title='Aktifkan mulai ruang'
            description='Jika diaktifkan, semua peserta dapat memulai rapat.'
            switchProps={{
              checked: draftRoom?.enable_start_room ?? false,
              onCheckedChange: async (checked) => {
                updateDraftRoom({ enable_start_room: checked, enable_waiting_room: false })
                await updateRoomHandler({
                  type: 'enableStartRoom',
                  value: checked,
                })
              },
            }}
          />
        </FormWrapper>

        {canEnableWaitingRoom && (
          <FormWrapper title='Ruang tunggu'>
            <SwitchComponent
              id='enableWaitingRoom'
              title='Aktifkan ruang tunggu'
              description='Jika diaktifkan, peserta baru harus disetujui oleh admin'
              switchProps={{
                checked: draftRoom?.enable_waiting_room ?? false,
                onCheckedChange: async (checked) => {
                  updateDraftRoom({ enable_waiting_room: checked })
                  await updateRoomHandler({
                    type: 'enableWaitingRoom',
                    value: checked,
                  })
                },
                disabled: !draftRoom?.enable_start_room,
              }}
            />
          </FormWrapper>
        )}

        {canSearchOtherRoom && (
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
        )}

        {canGeneratePassword && (
          <FormWrapper title='Ubah sandi ruangan'>
            <FormField
              title='Ubah sandi'
              input={
                <div className='flex gap-2'>
                  <InputGroup>
                    <InputGroupInput
                      defaultValue={draftRoom?.password ?? ''}
                      readOnly
                      placeholder='Buat kata sandi baru'
                    />
                    {draftRoom?.password && (
                      <InputGroupAddon align='inline-end'>
                        <Button
                          variant='ghost'
                          className='hover:bg-transparent'
                          onClick={() => setConfirmRemovePw(true)}
                        >
                          <Icon type='close' className='text-error' />
                        </Button>
                      </InputGroupAddon>
                    )}
                  </InputGroup>

                  <Button variant='secondary-outline' onClick={() => setConfirmGenerate(true)}>
                    <Icon type='arrow-clockwise' />
                  </Button>
                </div>
              }
              orientation='vertical'
            />
          </FormWrapper>
        )}

        <FieldSeparator className='h-fit' />

        <FormWrapper title='Izinkan peserta rapat untuk:'>
          <FieldGroup className='gap-3'>
            <SwitchComponent
              id='enableParticipantMicrophones'
              title='Bisukan mikrofon peserta'
              description='Jika diaktifkan, mikrofon peserta akan otomatis dimatikan saat bergabung ke ruang rapat. Peserta tetap dapat menyalakan mikrofon mereka selama rapat berlangsung.'
              switchProps={{
                checked: draftRoom?.is_mute_on_start ?? false,
                onCheckedChange: async (checked) => {
                  updateDraftRoom({ is_mute_on_start: checked })
                  await updateRoomHandler({ type: 'isMuteOnStart', value: checked })
                },
              }}
              withoutBackground
            />

            {canChangeEveryoneToModerator && (
              <SwitchComponent
                id='turnEveryoneIntoModerators'
                title='Ubah semua orang menjadi moderator'
                description='Jika dinyalakan, semua pengguna akan menjadi moderator.'
                switchProps={{
                  checked: allModerators,
                  onCheckedChange: () => setConfirmAsModerator(true),
                }}
                withoutBackground
              />
            )}
          </FieldGroup>
        </FormWrapper>

        <FieldSeparator className='h-fit' />

        {canViewMemberList && (
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
        )}

        {canSetFileSize && (
          <FormWrapper title='Pengaturan ukuran berkas presentasi'>
            <FormField
              title='Menyesuaikan ukuran berkas presentasi'
              input={
                <div className='flex items-center gap-2'>
                  <div className='flex-1 text-xs'>Anda dapat menyesuaikan ukuran berkas</div>
                  <InputGroup className='max-w-25'>
                    <InputGroupInput
                      id='presentationFileSize'
                      type='number'
                      min={1}
                      max={20}
                      className='[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                      value={draftRoom?.max_upload_size ?? ''}
                      onChange={(event) => {
                        updateDraftRoom({
                          max_upload_size:
                            event.target.value === '' ? undefined : +event.target.value,
                        })
                      }}
                    />
                    <InputGroupAddon align='inline-end' className='p-0'>
                      <InputGroupText>MB</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupAddon align='inline-end'>
                      <InputGroupButton
                        className='text-success hover:text-success hover:bg-transparent'
                        disabled={disableUploadSize}
                        onClick={() => setConfirmFileSize(true)}
                      >
                        <Icon type='check' />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              }
              orientation='vertical'
            />
          </FormWrapper>
        )}

        {canViewRecordingList && (
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
        )}
      </FieldGroup>

      {/* Start generate password confirmation modal */}
      <ModalDelete
        root={{ open: confirmGenerate, onOpenChange: setConfirmGenerate }}
        title={{ children: 'Apakah Anda akan membuat kata sandi baru?' }}
        content={{ onCloseAutoFocus: (e) => e.preventDefault() }}
        submit={{
          children: 'Ya, Buat Kata Sandi Baru',
          onClick: async () =>
            await updateRoomHandler({ type: 'generatePassword', value: randomString(10) }),
        }}
        cancel={{ children: 'Batal' }}
      >
        Tindakan ini akan mengubah keamanan ruang rapat. Anda dapat kembali mengubahnya menjadi
        tanpa kata sandi nanti
      </ModalDelete>
      {/* End generate password confirmation modal */}

      {/* Start remove password confirmation modal */}
      <ModalDelete
        root={{ open: confirmRemovePw, onOpenChange: setConfirmRemovePw }}
        title={{ children: 'Apakah Anda akan menghapus kata sandi?' }}
        content={{ onCloseAutoFocus: (e) => e.preventDefault() }}
        submit={{
          children: 'Ya, Hapus Kata Sandi',
          onClick: async () => await updateRoomHandler({ type: 'removePassword', value: '' }),
        }}
        cancel={{ children: 'Batal' }}
      >
        Tindakan ini akan menghapus keamanan ruang rapat. Anda dapat kembali membuat kata sandi
        nanti
      </ModalDelete>
      {/* End remove password confirmation modal */}

      {/* Start change file size confirmation modal */}
      <ModalDelete
        root={{ open: confirmFileSize, onOpenChange: setConfirmFileSize }}
        submit={{
          children: 'Ya, ubah ukuran berkas',
          onClick: async () => {
            await updateRoomHandler({
              type: 'maxUploadSize',
              value: draftRoom?.max_upload_size ?? 5,
            })
            setConfirmFileSize(false)
          },
        }}
        title={{ children: 'Ubah ukuran berkas presentasi?' }}
        content={{ className: 'w-[342px]', onCloseAutoFocus: (e) => e.preventDefault() }}
        cancel={{ children: 'Tidak, batalkan' }}
      >
        Anda dapat mengubah ketentuan ukuran berkas presentasi dengan ukuran minimal 1 MB dan
        maksimal 20 MB
      </ModalDelete>
      {/* End change file size confirmation modal */}

      {/* Start change to moderator confirmation modal */}
      <ModalDelete
        root={{ open: confirmAsModerator, onOpenChange: setConfirmAsModerator }}
        submit={{
          children: allModerators
            ? 'Kembalikan semua menjadi peserta'
            : 'Ubah semua menjadi moderator',
          onClick: async () => {
            const response = await everyoneToModeratorHandler(!allModerators)
            if (!response.error) {
              setConfirmAsModerator(false)
            }
          },
        }}
        title={{
          children: allModerators
            ? 'Kembalikan semua menjadi peserta'
            : 'Ubah semua menjadi moderator',
        }}
        content={{ className: 'w-[342px]', onCloseAutoFocus: (e) => e.preventDefault() }}
        cancel={{ children: 'Batal' }}
      >
        {allModerators
          ? 'Anda dapat kembali mengubah semua peserta menjadi moderator.'
          : 'Tindakan ini akan memengaruhi kendali ruang rapat. Apakah Anda yakin ingin mengizinkan semua orang mengendalikan ruang rapat?'}
      </ModalDelete>
      {/* End change to moderator confirmation modal */}
    </>
  )
}
