'use client'

import type { ComponentProps, FC } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'

export * from '@hugeicons/core-free-icons'

export const HugeIcon: FC<ComponentProps<typeof HugeiconsIcon>> = (props) => {
  return <HugeiconsIcon color='currentColor' {...props} />
}
