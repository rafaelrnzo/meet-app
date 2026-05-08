import { fetchRoomByCode } from '@/lib/api/admin-api'
import { fetchToken } from '@/lib/api/api'
import { djs } from '@/lib/utils'
import { toast } from 'sonner'

const DEFAULT_ERROR_MESSAGE =
  'Ada kendala dari sistem, mohon tunggu sebentar atau coba muat ulang laman'

const showGenericError = () =>
  toast.error('Gagal masuk ke ruang rapat', {
    description: DEFAULT_ERROR_MESSAGE,
  })

const showMeetingNotStartedError = (startDate?: string) =>
  toast.error('Gagal masuk ke ruang rapat', {
    description: startDate
      ? `Ruang rapat dimulai pada ${djs(startDate).format('DD MMMM YYYY')}`
      : 'Ruang rapat belum dimulai',
  })

const showMeetingHasEndedError = (roomName: string | undefined, targetCode: string) =>
  toast.error('Ruang rapat tidak ada', {
    description: `Ruang rapat "${roomName ?? targetCode}" tidak ditemukan. Coba salin kode ruang lainnya.`,
  })

const showInvalidCodeError = (targetCode: string) =>
  toast.error('Kode ruangan salah', {
    description: `Kode '${targetCode}' tidak valid. Coba salin kode ruang lainnya.`,
  })

const showEmptyCodeError = () =>
  toast.error('Kode ruangan tidak ada', {
    description: 'Mohon masukkan kode ruangan agar bisa masuk ke ruang rapat',
  })

const joinRoomAction = async ({
  code,
  setIsEmptyRoomCode,
  onSuccess,
}: {
  code: string
  setIsEmptyRoomCode?: React.Dispatch<boolean>
  onSuccess: (code: string) => void
}) => {
  const targetCode = code.trim()
  if (!targetCode) {
    showEmptyCodeError()
    setIsEmptyRoomCode?.(true)
    return
  }

  setIsEmptyRoomCode?.(false)

  try {
    await fetchToken(targetCode)
    onSuccess(targetCode)
  } catch (error) {
    if (!(error instanceof Error)) {
      return showGenericError()
    }

    const { message, cause } = error
    const status = (cause as { status?: number })?.status

    const room = await fetchRoomByCode(targetCode).catch(() => null)

    switch (status) {
      case 403: {
        if (message.toLowerCase().includes(`meeting hasn't started yet`)) {
          return showMeetingNotStartedError(room?.start_date)
        }

        if (message.toLowerCase().includes(`meeting has ended`)) {
          return showMeetingHasEndedError(room?.name, targetCode)
        }

        // TODO: handle full participant case
        return
      }

      case 404:
        return showInvalidCodeError(targetCode)

      default:
        return showGenericError()
    }
  }
}

export {
  showGenericError,
  showMeetingNotStartedError,
  showMeetingHasEndedError,
  showInvalidCodeError,
  showEmptyCodeError,
  joinRoomAction,
}
