import type { MouseEvent } from 'react'
import type { LocalUserChoicesPassword, PreJoinProps } from '@/feat/Room/Prejoin'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useMaybeRoomContext } from '@livekit/components-react'
import { log } from '@livekit/components-core'
import { useMediaControls } from '@/hooks'

export function usePreJoin(config?: PreJoinProps) {
  const {
    defaults = {},
    onValidate,
    onSubmit,
    onError,
    metadata,
    isGuest,
    withPassword,
    persistUserChoices,
    autoCheck,
    micLabel,
    camLabel,
    videoProcessor,
  } = useMemo(() => ({ ...config }), [config])

  // useMaybeRoomContext is undefined in PreJoin (before joining).
  // useMediaControls checks for room before publishing, so this is safe.
  const { data: session } = useSession()
  const room = useMaybeRoomContext()
  const mediaControls = useMediaControls({
    defaults,
    autoCheck,
    micLabel,
    camLabel,
    onError,
    persistUserChoices,
    videoProcessor,
    room,
  })

  // initialUserChoices is already fetched inside useMediaControls — reuse it
  // here to seed username so we don't call usePersistentUserChoices twice.
  const {
    initialUserChoices,
    audioEnabled,
    videoEnabled,
    audioDeviceId,
    videoDeviceId,
    handleManualToggleAudio,
  } = mediaControls

  // Form-only state
  const [userChoices, setUserChoices] = useState(initialUserChoices)
  const [username, setUsername] = useState(isGuest ? '' : initialUserChoices.username)
  const [password, setPassword] = useState('')
  const [isValid, setIsValid] = useState(false)

  // Kept as a ref so that a non-memoised onValidate prop never triggers re-renders
  const handleValidation = useRef((values: LocalUserChoicesPassword) =>
    (onValidate?.(values) ?? (isGuest && withPassword))
      ? !!values.password && !!values.username.trim()
      : withPassword
        ? !!values.password
        : !!values.username.trim()
  )

  const handleOffMicrophoneRef = useRef(handleManualToggleAudio)
  const isMicDisabledTemporary = metadata?.is_mute_on_start && session?.profile.role.name === 'user'

  const handleSubmit = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    if (handleValidation.current({ ...userChoices, password })) {
      return onSubmit?.({ ...userChoices, password })
    }

    log.warn('Validation failed with: ', userChoices)
  }

  // Keep userChoices and isValid in sync whenever any relevant piece of state changes
  useEffect(() => {
    const newUserChoices = {
      username,
      videoEnabled,
      videoDeviceId,
      audioEnabled,
      audioDeviceId,
    }
    setUserChoices(newUserChoices)
    setIsValid(handleValidation.current({ ...newUserChoices, password }))
  }, [username, password, videoEnabled, audioEnabled, audioDeviceId, videoDeviceId])

  useEffect(() => {
    if (isMicDisabledTemporary) {
      handleOffMicrophoneRef.current(false)
    }
  }, [isMicDisabledTemporary])

  return {
    // Spread all media controls — PreJoin gets the identical flat API it had before
    ...mediaControls,

    // Form state
    userChoices,
    username,
    password,
    isValid,
    isMicDisabledTemporary,

    // Form setters
    setUserChoices,
    setUsername,
    setPassword,
    setIsValid,

    // Handlers
    handleSubmit,
  }
}
