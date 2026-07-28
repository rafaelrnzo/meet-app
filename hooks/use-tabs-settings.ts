'use client'

import type { RoomMetadata, RoomPayload, RoomSSEDTO } from '@/feat/rooms/dto'
import { useCallback, useEffect, useState } from 'react'
import { RoomEvent } from 'livekit-client'
import { useParticipants, useRoomContext } from '@livekit/components-react'
import { createResponseError, createResponseSuccess, omit, qstring } from '@/lib/utils'
import { changeEveryoneToModerator, fetchRoomByCode, updateDbRoom } from '@/lib/api/admin-api'
import { useEventSource } from '@/hooks/use-event-source'
import { useAuth } from '@/hooks/use-auth'
import { useRoomsAuth } from '@/hooks'
import { RoomSSEEvent } from '@/feat/rooms/dto'
import { ParticipantAttribute } from '@/feat/enum'
import { defaultErrorMessage } from '@/config'
import { toast } from '@/components/ui/sonner'

type PatchRoom =
  | {
      type: 'generatePassword'
      value: string
    }
  | {
      type: 'removePassword'
      value: ''
    }
  | {
      type: 'enableStartRoom'
      value: boolean
    }
  | {
      type: 'maxUploadSize'
      value: number
    }
  | {
      type: 'isMuteOnStart'
      value: boolean
    }
  | {
      type: 'enableWaitingRoom'
      value: boolean
    }

type PatchRoomByType<T extends PatchRoom['type']> = Extract<PatchRoom, { type: T }>

type UpdateRoomAction = {
  [K in PatchRoom['type']]: {
    key: keyof RoomPayload

    toastSuccess: (value: PatchRoomByType<K>['value']) => {
      title: string
      description: string
    }

    toastError: (value: PatchRoomByType<K>['value']) => {
      title: string
      description?: string
    }

    toastInvalidPayload?: {
      title: string
      description?: string
    }

    onSuccess?: () => void
  }
}

export function useTabsSettings() {
  const roomContext = useRoomContext()
  const { publicUrl, token } = useAuth()
  const participants = useParticipants()
  const { hasPermissionInMeeting } = useRoomsAuth()
  const [confirmAsModerator, setConfirmAsModerator] = useState(false)
  const [confirmGenerate, setConfirmGenerate] = useState(false)
  const [confirmRemovePw, setConfirmRemovePw] = useState(false)
  const [confirmFileSize, setConfirmFileSize] = useState(false)
  const [savedRoom, setSavedRoom] = useState<(RoomPayload & { id: number }) | null>(null) // get from api
  const [draftRoom, setDraftRoom] = useState(savedRoom) // temporary
  const [allModerators, setAllModerators] = useState(false)
  const [
    canEnableWaitingRoom,
    canSearchOtherRoom,
    canGeneratePassword,
    canViewMemberList,
    canSetFileSize,
    canChangeEveryoneToModerator,
    canViewRecordingList,
  ] = [
    hasPermissionInMeeting('room:waiting_room'),
    hasPermissionInMeeting('room:search_other'),
    hasPermissionInMeeting('room:generate_password'),
    hasPermissionInMeeting('room:view_member_list'),
    hasPermissionInMeeting('room:set_file_size'),
    roomContext.localParticipant.attributes[ParticipantAttribute.RoleName.toLowerCase()] ===
      'admin',
    hasPermissionInMeeting('module:recordings:access'),
  ]
  const disableUploadSize =
    !draftRoom?.max_upload_size ||
    draftRoom.max_upload_size > 20 ||
    draftRoom.max_upload_size === savedRoom?.max_upload_size ||
    participants.some((user) =>
      ['user', 'moderator'].includes(user.attributes[ParticipantAttribute.RoleName.toLowerCase()])
    )

  /** Get room data based on room code from room context */
  const fetchRoom = useCallback(async () => {
    try {
      const response = await fetchRoomByCode(roomContext.name)
      setSavedRoom({
        id: response.id,
        name: response.name,
        description: response.description,
        max_participants: response.max_participants,
        assigned_to: response.assigned_to,
        group_id: Number(response.group_id ?? 0),
        start_date: response.start_date,
        end_date: response.end_date,
        password: response.password ?? '',
        is_mute_on_start: response.metadata.is_mute_on_start,
        enable_start_room: response.enable_start_room,
        max_upload_size: response.max_upload_size,
        enable_waiting_room: response.enable_waiting_room,
      })
    } catch {
      setSavedRoom(null)
    }
  }, [roomContext.name])

  const updateDraftRoom = (payload: Partial<RoomPayload>) => {
    setDraftRoom((prev) => (!prev ? prev : { ...prev, ...payload }))
  }

  const fetchIsAllModerators = useCallback(() => {
    if (!roomContext.metadata) return setAllModerators(false)
    const { all_moderators }: RoomMetadata = JSON.parse(roomContext.metadata)
    return setAllModerators(all_moderators ?? false)
  }, [roomContext.metadata])

  /** Update participant metadata rolename */
  const everyoneToModeratorHandler = async (value: boolean) => {
    setAllModerators(value)

    try {
      const response = await changeEveryoneToModerator({
        room_code: roomContext.name,
        promote: value,
      })

      toast.success(
        `Fitur ubah semua orang menjadi moderator berhasil di${value ? 'aktifkan' : 'nonaktifkan'}`,
        {
          description: value
            ? 'Sekarang semua peserta dapat mengontrol penuh berlangsungnya rapat'
            : 'Hanya super admin dan moderator yang dapat mengontrol penuh berlangsungnya rapat',
        }
      )

      return createResponseSuccess(response)
    } catch (error) {
      fetchIsAllModerators() // rollback

      toast.error(
        `Gagal ${value ? 'mengaktifkan' : 'menonaktifkan'} fitur ubah semua orang menjadi moderator`,
        {
          description: error instanceof Error ? error.message : defaultErrorMessage,
        }
      )

      return createResponseError(error)
    }
  }

  /** Update room password, enable start room, max upload size, and is mute on start */
  const updateRoomHandler = async (props: PatchRoom) => {
    if (!savedRoom) return

    const action: UpdateRoomAction = {
      generatePassword: {
        key: 'password',
        toastSuccess: () => ({
          title: 'Sandi ruangan berhasil dimuat ulang',
          description: `Anda berhasil memuat ulang sandi ruangan "${savedRoom.name}"`,
        }),
        toastError: () => ({
          title: 'Gagal memuat ulang sandi ruangan',
        }),
        onSuccess: () => setConfirmGenerate(false),
      },
      removePassword: {
        key: 'password',
        toastSuccess: () => ({
          title: 'Sandi ruangan berhasil dihapus',
          description: 'Anda berhasil menghapus sandi ruangan',
        }),
        toastError: () => ({
          title: 'Gagal menghapus sandi ruangan',
        }),
        onSuccess: () => setConfirmRemovePw(false),
      },
      enableStartRoom: {
        key: 'enable_start_room',
        toastSuccess: (value) => ({
          title: `Fitur "Aktifkan mulai ruang" berhasil ${value ? 'diaktifkan' : 'dinonaktifkan'}`,
          description: `Sekarang semua peserta ${value ? 'dapat' : 'tidak dapat'} memulai rapat`,
        }),
        toastError: (value) => ({
          title: `Gagal ${value ? 'mengaktifkan' : 'menonaktifkan'} fitur "Aktifkan mulai ruang"`,
        }),
      },
      maxUploadSize: {
        key: 'max_upload_size',
        toastSuccess: (value) => ({
          title: 'Ukuran berkas presentasi berhasil diubah',
          description: `Berhasil mengatur minimal ukuran berkas menjadi ${value} MB`,
        }),
        toastError: () => ({
          title: 'Gagal mengubah ukuran berkas presentasi',
          description: 'Minimal ukuran berkas adalah 1 MB dan maksimal adalah 20 MB',
        }),
        toastInvalidPayload: {
          title: 'Gagal mengubah ukuran berkas presentasi',
          description: 'Ukuran berkas harus berupa bilangan bulat',
        },
      },
      isMuteOnStart: {
        key: 'is_mute_on_start',
        toastSuccess: (value) => ({
          title: `Fitur "Bisukan mikrofon peserta" berhasil di${value ? 'aktifkan' : 'nonaktifkan'}`,
          description: `Sekarang semua peserta ${value ? 'tidak dapat' : 'dapat'} menggunakan mikrofon mereka`,
        }),
        toastError: (value) => ({
          title: `Gagal ${value ? 'mengaktifkan' : 'menonaktifkan'} fitur "Bisukan mikrofon peserta"`,
        }),
      },
      enableWaitingRoom: {
        key: 'enable_waiting_room',
        toastSuccess: (value) => ({
          title: `Fitur "Aktifkan ruang tunggu" berhasil ${value ? 'aktifkan' : 'nonaktifkan'}`,
          description: `Sekarang semua peserta ${!value && 'tidak'} harus menunggu izin admin agar bisa memulai rapat`,
        }),
        toastError: (value) => ({
          title: `Gagal ${value ? 'mengaktifkan' : 'menonaktifkan'} fitur "Aktifkan ruang tunggu"`,
        }),
      },
    }

    const { key, toastSuccess, toastError, toastInvalidPayload, onSuccess } = action[props.type]

    const payload: RoomPayload & { id: number } = {
      ...savedRoom,
      group_id: Number(savedRoom.group_id),
      password: savedRoom.password ?? '',
      [key]: props.value,
      ...(props.type === 'enableStartRoom' &&
        !props.value && { [action.enableWaitingRoom.key]: false }),
    }

    const value = props.value as never // TODO

    try {
      await updateDbRoom(savedRoom.id, omit(payload, ['id']))
      toast.success(toastSuccess(value).title, {
        description: toastSuccess(value).description,
      })
      onSuccess?.()
    } catch (error) {
      setDraftRoom(savedRoom) // rollback value

      if (error instanceof Error && error.message === 'invalid payload' && toastInvalidPayload) {
        toast.error(toastInvalidPayload.title, {
          description: toastInvalidPayload.description,
        })
        return
      }

      toast.error(toastError(value).title, {
        description: error instanceof Error ? error.message : defaultErrorMessage,
      })
    }
  }

  useEffect(() => {
    fetchRoom()
    fetchIsAllModerators()

    roomContext.on(RoomEvent.Connected, fetchRoom)
    roomContext.on(RoomEvent.Connected, fetchIsAllModerators)
    roomContext.on(RoomEvent.RoomMetadataChanged, fetchIsAllModerators)

    return () => {
      roomContext.off(RoomEvent.Connected, fetchRoom)
      roomContext.off(RoomEvent.Connected, fetchIsAllModerators)
      roomContext.off(RoomEvent.RoomMetadataChanged, fetchIsAllModerators)
    }
  }, [fetchIsAllModerators, fetchRoom, roomContext])

  useEffect(() => {
    setDraftRoom(savedRoom)
  }, [savedRoom])

  useEventSource<RoomSSEDTO>({
    eventUrl: qstring(`${publicUrl}/api/rooms/events`, { token: token }),
    onMessage: (event) => {
      if (event.type === RoomSSEEvent.RoomUpdated) {
        fetchRoom()
      }
    },
  })

  return {
    confirmAsModerator,
    confirmGenerate,
    confirmRemovePw,
    confirmFileSize,
    permissions: {
      canEnableWaitingRoom,
      canSearchOtherRoom,
      canGeneratePassword,
      canViewMemberList,
      canSetFileSize,
      canChangeEveryoneToModerator,
      canViewRecordingList,
    },
    disableUploadSize,
    draftRoom,
    allModerators,
    updateDraftRoom,
    setConfirmAsModerator,
    setConfirmGenerate,
    setConfirmRemovePw,
    setConfirmFileSize,
    updateRoomHandler,
    everyoneToModeratorHandler,
  }
}
