import { useEffect } from 'react'

type UseEventSourceProps<T> =
  | {
      eventUrl: string
      onMessage: (data: T) => void
    }
  | {
      eventUrl: string
      eventName: string
      onEventHandler: (data: T) => void
    }

export function useEventSource<T = []>(props: UseEventSourceProps<T>) {
  useEffect(() => {
    const eventSource = new EventSource(props.eventUrl)

    const handler = (event: MessageEvent) => {
      const data: T = JSON.parse(event.data)

      if ('onMessage' in props) {
        props.onMessage(data)
      } else {
        props.onEventHandler(data)
      }
    }

    if ('eventName' in props) {
      eventSource.addEventListener(props.eventName, handler)
    } else {
      eventSource.onmessage = handler
    }

    return () => {
      if ('eventName' in props) {
        eventSource.removeEventListener(props.eventName, handler)
      }
      eventSource.close()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
