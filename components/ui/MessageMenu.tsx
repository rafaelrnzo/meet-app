import type { ReceivedChatMessage } from '@livekit/components-core'
import { useState } from 'react'
import { Check, ChevronDown, Copy, Trash } from 'lucide-react'
import { useLocalParticipant } from '@livekit/components-react'
import { cn, copyHandler } from '@/lib/utils'
import { ParticipantAttribute, Role } from '@/feat/enum'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function MessageMenu({
  entry,
  setModalConfirm,
}: {
  entry: ReceivedChatMessage
  setModalConfirm: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { localParticipant } = useLocalParticipant()
  const roleName =
    (localParticipant?.attributes?.[ParticipantAttribute.RoleName.toLowerCase()] as Role) ?? ''
  const isModerator = [Role.Moderator, Role.Admin, Role.WI].includes(roleName)

  const copyMessage = async () => {
    const text = entry.message

    try {
      await copyHandler(text)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 1000)
    } catch (err) {
      console.error('Failed to copy message', err)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'absolute top-0.5 right-2 cursor-pointer transition-colors',
            open ? 'text-foreground' : 'group-hover:text-foreground text-transparent',
            {
              'group-hover:text-white': entry.from?.isLocal,
              'text-white': open && entry.from?.isLocal,
            }
          )}
        >
          <ChevronDown className='h-4 w-4' />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='min-w-44'>
        <DropdownMenuItem
          className='cursor-pointer'
          onSelect={(e) => {
            e.preventDefault()
            copyMessage()
          }}
        >
          {copied ? (
            <Check className='text-success mr-1 h-4 w-4' />
          ) : (
            <Copy className='mr-1 h-4 w-4' />
          )}
          Salin Pesan
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setModalConfirm(true)}
          className='text-destructive focus:text-destructive cursor-pointer'
          hidden={!isModerator}
        >
          <Trash className='mr-1 h-4 w-4' />
          Hapus Pesan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
