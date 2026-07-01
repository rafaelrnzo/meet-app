'use client'

import type { FC } from 'react'
import type { HostMessage } from '@/feat/Tabs'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useParticipants } from '@livekit/components-react'
import {
  BlockGameIcon,
  DoNotTouch01Icon,
  EllipsisVertical,
  HandIcon,
  Logout,
  Mic,
  MicOff,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { useTabsParticipant } from '@/hooks/use-tabs-participant'
import { useHandRaises } from '@/hooks'
import {
  TabsList,
  TabsListItemContent,
  TabsListGroup,
  TabsListItem,
  TabsListItemText,
  TabsListItemTitle,
  TabsListGroups,
} from '@/feat/Tabs/List'
import { acceptOrDeniedParticipant } from '@/feat/api'
import { ModalDelete } from '@/components/ui/modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HugeIcon } from '@/components/HugeIcon'
import { Button } from '@/components/Button'

export const ListParticipantPending: FC<{ participantPending: HostMessage['participants'] }> = ({
  participantPending,
}) => {
  const { name: roomName } = useParams<{ name: string }>()
  const [loadingId, setLoadingId] = useState<string[]>([])
  const mergedParticipant = useParticipants()

  async function handleParticipant(action: 'accept' | 'reject', participantId: string) {
    try {
      setLoadingId((prev) => [...prev, participantId])
      await acceptOrDeniedParticipant({
        action,
        roomName,
        identity: participantId,
      })
    } catch (e) {
      console.log('Failed to accept/reject:', e)
    } finally {
      setLoadingId((prev) => prev.filter((id) => id !== participantId))
    }
  }

  return (
    <div>
      {!!participantPending.length && (
        <div>
          <h3>Pending</h3>
          <ul>
            {participantPending.map(({ participantId, participantName }) => (
              <li key={participantId} className='flex items-center justify-between'>
                <p>{participantName}</p>
                <button
                  className='text-destructive disabled:opacity-70'
                  disabled={loadingId.includes(participantId)}
                  onClick={() => handleParticipant('reject', participantId)}
                >
                  Tolak
                </button>
                <button
                  className='disabled:opacity-70'
                  disabled={loadingId.includes(participantId)}
                  onClick={() => handleParticipant('accept', participantId)}
                >
                  Terima
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h3>Semua</h3>
        <ul>
          {mergedParticipant.map(({ identity, ...participant }) => (
            <li key={identity}>
              <p>{participant.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function ListParticipant() {
  const {
    participantGroups,
    shouldMuteAll,
    isModerator,
    modalConfirm,
    handleBroadcastMuteAll,
    handleParticipantMute,
    handleDismissParticipant,
    setModalConfirm,
  } = useTabsParticipant()
  const { lowerHand, lowerHandLocal } = useHandRaises()
  const modalOptions: Record<
    string,
    { title: string; description: string; confirm: string; onConfirm: () => void }
  > = {
    ['mute-all']: {
      title: 'Bisukan Semua Peserta',
      description: 'Tindakan ini akan membisukan semua peserta rapat. Apa Anda ingin lanjut?',
      confirm: 'Bisukan Semua',
      onConfirm: handleBroadcastMuteAll,
    },
    ['dismiss-participant']: {
      title: 'Keluarkan Peserta',
      description: 'Tindakan ini akan mengeluarkan peserta dari rapat. Apa Anda ingin lanjut?',
      confirm: 'Keluarkan Peserta',
      onConfirm: () => handleDismissParticipant(modalConfirm.identity ?? ''),
    },
  }

  return (
    <div className='flex w-full flex-col bg-white'>
      <TabsListGroups className='flex h-full flex-col'>
        <div className='flex-1 overflow-x-hidden overflow-y-auto'>
          {participantGroups.map(({ id, lists }) => (
            <TabsListGroup key={id} className='flex flex-col'>
              <TabsList className={cn('max-h-[calc(100vh - 180px] space-y-2 overflow-y-auto px-2')}>
                {lists.map(({ id: identity, name, isMuted, isLocal, isModerator, isRaised }) => {
                  const currentUser = lists.find((p) => p.isLocal)
                  const amIModerator = currentUser?.isModerator ?? false
                  const showDropdown = amIModerator && !isLocal
                  const canClickHand = isRaised && (isLocal || amIModerator)
                  const canClickMic = !isMuted && (isLocal || amIModerator)

                  return (
                    <TabsListItem
                      key={identity}
                      className='relative flex items-center justify-between'
                    >
                      <div className='flex h-10 w-10 items-center justify-center rounded-full border border-neutral-400 bg-red-50'>
                        <span className='font-semibold text-red-800 uppercase'>
                          {name?.slice(0, 2)}
                        </span>
                      </div>

                      <TabsListItemContent className='flex flex-col justify-center'>
                        <TabsListItemTitle className='max-w-45.5 truncate'>
                          {name}
                        </TabsListItemTitle>

                        {isModerator && (
                          <TabsListItemText
                            className='max-w-50 truncate text-xs text-neutral-500'
                            title={isModerator ? 'Moderator' : ''}
                          >
                            {isModerator ? 'Moderator' : ''}
                          </TabsListItemText>
                        )}
                      </TabsListItemContent>

                      <menu className='flex items-center'>
                        <button
                          onClick={() => (isLocal ? lowerHandLocal() : lowerHand(identity))}
                          disabled={!canClickHand}
                          className={cn('rounded-full p-2 transition-colors', {
                            'cursor-pointer hover:bg-neutral-100': canClickHand,
                            'cursor-default hover:bg-transparent': !canClickHand,
                            'opacity-70': !isLocal && !isRaised,
                          })}
                        >
                          {isRaised ? (
                            <HugeIcon icon={HandIcon} size={20} color='#991B1B' />
                          ) : (
                            <HugeIcon icon={DoNotTouch01Icon} size={20} color='#A3A3A3' />
                          )}
                        </button>
                        <button
                          onClick={async () =>
                            handleParticipantMute({
                              isLocal: isLocal,
                              identity,
                            })
                          }
                          disabled={!canClickMic}
                          className={cn('rounded-full p-2 transition-colors', {
                            'cursor-pointer hover:bg-neutral-100': canClickMic,
                            'cursor-default hover:bg-transparent': !canClickMic,
                            'opacity-70': !amIModerator && !isLocal,
                          })}
                        >
                          {isMuted ? (
                            <HugeIcon icon={MicOff} size={20} color='#A3A3A3' />
                          ) : (
                            <HugeIcon icon={Mic} size={20} color='#991B1B' />
                          )}
                        </button>

                        {showDropdown && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className='cursor-pointer rounded-full p-2 hover:bg-neutral-100'>
                                <HugeIcon icon={EllipsisVertical} size={20} />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align='end'
                              className='w-56 rounded-xl border border-neutral-200 bg-white p-1 px-2 text-sm shadow-lg'
                            >
                              {[
                                {
                                  label: 'Keluarkan peserta',
                                  icon: Logout,
                                  iconColor: '#dc2626',
                                  className: 'text-red-600 focus:bg-red-50 focus:text-red-700',
                                  onClick: () =>
                                    setModalConfirm({
                                      open: true,
                                      title: 'Keluarkan Peserta',
                                      description:
                                        'Tindakan ini akan mengeluarkan peserta dari rapat. Apa Anda ingin lanjut?',
                                      id: 'dismiss-participant',
                                      identity: identity,
                                    }),
                                },
                                {
                                  label: 'Blokir peserta',
                                  icon: BlockGameIcon,
                                  iconColor: '#A3A3A3',
                                  className: 'text-neutral-700 focus:bg-neutral-100',
                                  onClick: () => console.log(identity),
                                },
                              ].map((item, index) => (
                                <DropdownMenuItem
                                  key={index}
                                  onClick={item.onClick}
                                  className={cn(
                                    'text-md my-1 flex cursor-pointer items-center gap-2 rounded-lg p-3 transition-colors',
                                    item.className
                                  )}
                                >
                                  <HugeIcon icon={item.icon} size={20} color={item.iconColor} />
                                  <span>{item.label}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </menu>
                    </TabsListItem>
                  )
                })}
              </TabsList>
            </TabsListGroup>
          ))}
        </div>
        {shouldMuteAll && isModerator && (
          <div className='mt-auto bg-white pt-4'>
            {/* mt-auto memastikan ia terdorong ke bawah, pt-4 memberi jarak */}
            <Button
              onClick={() =>
                setModalConfirm({
                  id: 'mute-all',
                  open: true,
                  title: 'Bisukan Semua Peserta',
                  description: 'Apakah anda yakin ingin membisukan semua peserta?',
                })
              }
              className={cn(
                'text-error flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border-transparent bg-red-200 p-3 text-sm shadow-none hover:bg-red-200/80!'
              )}
            >
              <HugeIcon icon={MicOff} size={16} />
              <span>Bisukan Semua Peserta</span>
            </Button>
          </div>
        )}{' '}
      </TabsListGroups>

      <ModalDelete
        root={{
          open: modalConfirm.open,
          onOpenChange: (open) => setModalConfirm((prev) => ({ ...prev, open })),
          modal: false,
        }}
        title={{
          children: modalOptions[modalConfirm.id].title,
        }}
        submit={{
          children: modalOptions[modalConfirm.id].confirm,
          onClick: modalOptions[modalConfirm.id].onConfirm,
        }}
        cancel={{
          children: 'Batal',
          onClick: () => setModalConfirm((prev) => ({ ...prev, open: false })),
        }}
        content={{
          onPointerDownOutside: (e) => e.preventDefault(),
          onInteractOutside: (e) => e.preventDefault(),
          onCloseAutoFocus: (e) => e.preventDefault(),
          className: 'max-w-[1170px]',
        }}
        close={{
          onClick: () => setModalConfirm((prev) => ({ ...prev, open: false })),
        }}
      >
        <p>{modalConfirm.description}</p>
      </ModalDelete>
    </div>
  )
}
