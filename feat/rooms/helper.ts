import { defaultErrorMessage } from '@/config'
import { fetchRoomByCode } from '@/lib/api/admin-api'
import { fetchToken } from '@/lib/api/api'
import { copyHandler, djs } from '@/lib/utils'
import { toast } from '@/components/ui/sonner'

const showGenericError = (message?: string) =>
  toast.error('Gagal masuk ke ruang rapat', {
    description: message || defaultErrorMessage,
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

const showSuccess = (roomName: string | undefined, targetCode: string) =>
  toast.success('Sukses bergabung rapat', {
    description: `Berhasil bergabung ke ruang rapat “${roomName ?? targetCode}”`,
  })

const showRoomIsFullError = () =>
  toast.error('Gagal masuk ke ruang rapat', {
    description: 'Jumlah maksimal peserta sudah tercapai',
  })

const showBannedUserError = () =>
  toast.error('Gagal masuk ke ruang rapat', {
    description: 'Anda tidak diizinkan untuk memulai rapat',
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

  const room = await fetchRoomByCode(targetCode).catch(() => null)

  try {
    await fetchToken(targetCode)
    showSuccess(room?.name, targetCode)
    onSuccess(targetCode)
  } catch (error) {
    if (!(error instanceof Error)) {
      return showGenericError(typeof error === 'string' ? error : '')
    }

    const { message, cause } = error
    const status = (cause as { status?: number })?.status

    switch (status) {
      case 403: {
        if (message.toLowerCase().includes(`meeting hasn't started yet`)) {
          return showMeetingNotStartedError(room?.start_date)
        }

        if (message.toLowerCase().includes(`meeting has ended`)) {
          return showMeetingHasEndedError(room?.name, targetCode)
        }

        if (message.toLowerCase().includes('room is full')) {
          return showRoomIsFullError()
        }

        if (message.toLowerCase().includes('you banned from this room')) {
          return showBannedUserError()
        }

        return
      }

      case 404:
        return showInvalidCodeError(targetCode)

      default:
        return showGenericError(message)
    }
  }
}

const handleSearchNotFound = ({ search, countData }: { search?: string; countData: number }) => {
  if (!search || countData) return

  return toast.error('Ruang rapat tidak ada', {
    description: `Ruang rapat "${search}" tidak ditemukan.`,
  })
}

async function shareLinkHandler(data: ShareData & Required<Pick<ShareData, 'url'>>) {
  try {
    const { success: successCopy } = await copyHandler(data.url)
    const canShare = typeof navigator.share === 'function' && navigator.canShare?.(data)

    if (canShare) {
      await navigator.share(data)
    }

    if (!canShare && !successCopy) {
      throw new Error()
    }
    return { success: true }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return { success: true }
    return { success: false }
  }
}

export {
  showGenericError,
  showMeetingNotStartedError,
  showMeetingHasEndedError,
  showInvalidCodeError,
  showEmptyCodeError,
  joinRoomAction,
  handleSearchNotFound,
  shareLinkHandler,
}
