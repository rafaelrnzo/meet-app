import { qstring } from '@/lib/utils'
import { useParamsState } from '@/hooks/use-params-state'
import { SearchParamsKey } from '@/feat/enum'

export function useJoinRoom() {
  const { router, pathname, currentParams } = useParamsState()

  function joinRoom(roomCode: string) {
    router.push(
      qstring(
        `/rooms/${encodeURIComponent(roomCode)}`,
        {
          ...currentParams,
          [SearchParamsKey.FromCode]: pathname.split('/').filter(Boolean).join(''),
        },
        { skipEmpty: true }
      )
    )
  }

  return { router, joinRoom }
}
