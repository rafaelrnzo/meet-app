'use client'

import type { FC, ReactElement } from 'react'
import type { ConnectionStateToastProps } from '@livekit/components-react'
import { useState, useEffect } from 'react'
import { ConnectionState } from 'livekit-client'
import { SpinnerIcon } from '@phosphor-icons/react'
import { useConnectionState } from '@livekit/components-react'

export const RoomToast: FC<ConnectionStateToastProps> = (props) => {
  const [notification, setNotification] = useState<ReactElement | undefined>(undefined)
  const state = useConnectionState(props.room)

  useEffect(() => {
    switch (state) {
      case ConnectionState.Connecting:
        setNotification(
          <>
            <SpinnerIcon /> Connecting
          </>
        )
        break
      case ConnectionState.SignalReconnecting:
      case ConnectionState.Reconnecting:
        setNotification(
          <>
            <SpinnerIcon /> Reconnecting
          </>
        )
        break

      case ConnectionState.Disconnected:
        setNotification(<>Disconnected</>)
        break
      default:
        setNotification(undefined)
        break
    }
  }, [state])

  return !notification ? null : (
    <div className='bg-foreground/70 text-muted border-muted-foreground fixed top-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-md border py-2 pr-5 pl-3 *:size-6 *:animate-spin'>
      {notification}
    </div>
  )
}
