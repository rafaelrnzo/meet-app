'use client'

import type { FC } from 'react'
import type { HostMessage } from '@/feat/Tabs'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { HandIcon } from '@phosphor-icons/react'
import {
  BlockGameIcon,
  DoNotTouch01Icon,
  EllipsisVertical,
  Logout,
  Mic,
  MicOff,
  Unlocked,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { useTabsParticipant } from '@/hooks/use-tabs-participant'
import { useHandRaises } from '@/hooks'
import {
  TabsListItemContent,
  TabsListGroup,
  TabsListItem,
  TabsListItemText,
  TabsListItemTitle,
  TabsListGroups,
} from '@/feat/Tabs/List'
import { Role } from '@/feat/enum'
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

export const ListParticipantPending: FC<{
  participantPending: HostMessage['participants']
  onHandleParticipant?: (participantId: string) => void
}> = ({ participantPending, onHandleParticipant }) => {
  const { name: roomName } = useParams<{ name: string }>()
  const [loadingId, setLoadingId] = useState<string[]>([])
  const { modalConfirm, setModalConfirm } = useTabsParticipant()

  async function handleParticipant(action: 'accept' | 'reject', participantId: string) {
    try {
      setLoadingId((prev) => [...prev, participantId])
      await acceptOrDeniedParticipant({
        action,
        roomName,
        identity: participantId,
      })
      onHandleParticipant?.(participantId)
    } catch (e) {
      console.log('Failed to accept/reject:', e)
    } finally {
      setLoadingId((prev) => prev.filter((id) => id !== participantId))
    }
  }

  async function handleParticipantAll(action: 'accept' | 'reject') {
    try {
      setLoadingId((prev) => [...prev, 'all'])
      participantPending.forEach(async ({ participantId }) => {
        await acceptOrDeniedParticipant({
          action,
          roomName,
          identity: participantId,
        })
      })
    } catch (e) {
      console.log('Failed to accept/reject:', e)
    } finally {
      setLoadingId((prev) => prev.filter((id) => id !== 'all'))
    }
  }

  return (
    !!participantPending.length && (
      <div className='mx-auto w-full max-w-2xl bg-white p-2'>
        <ul className='mb-6 space-y-5 overflow-y-auto'>
          {participantPending.map(({ participantId, participantName }) => (
            <li key={participantId} className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full border border-neutral-400 bg-red-50'>
                  <span className='font-semibold text-red-800 uppercase'>
                    {participantName.slice(0, 2)}
                  </span>
                </div>
                <span className='text-sm font-medium text-red-800'>{participantName}</span>
              </div>

              <div className='flex items-center space-x-2'>
                <Button
                  className='text-error rounded-lg border border-red-200 px-2 py-1 text-sm font-medium shadow-none transition-colors hover:bg-red-50 disabled:opacity-70'
                  disabled={loadingId.includes(participantId)}
                  onClick={() => handleParticipant('reject', participantId)}
                >
                  Tolak
                </Button>
                <Button
                  className='text-success rounded-lg border border-green-200 px-2 py-1 text-sm font-medium shadow-none transition-colors hover:bg-green-50 disabled:opacity-70'
                  disabled={loadingId.includes(participantId)}
                  onClick={() => handleParticipant('accept', participantId)}
                >
                  Terima
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className='grid grid-cols-2 gap-2 pt-3'>
          <Button
            className='text-error flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border-transparent bg-red-200 p-3 text-sm font-semibold shadow-none hover:bg-red-200/80!'
            onClick={() => setModalConfirm((prev) => ({ ...prev, open: true }))}
          >
            Tolak Semua
          </Button>
          <Button
            className='text-success flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border-transparent bg-green-200 p-3 text-sm font-semibold shadow-none hover:bg-green-200/80!'
            onClick={() => handleParticipantAll('accept')}
          >
            Terima Semua
          </Button>
        </div>

        <ModalDelete
          root={{
            open: modalConfirm.open,
            onOpenChange: (open) => setModalConfirm((prev) => ({ ...prev, open })),
            modal: false,
          }}
          title={{
            children: 'Tolak semua peserta?',
          }}
          submit={{
            children: 'Ya, Tolak Semua',
            onClick: () => handleParticipantAll('reject'),
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
          <p>
            Tindakan ini akan menolak semua peserta yang menunggu persetujuan untuk bergabung ke
            ruang rapat. Tindakan ini tidak dapat dibatalkan
          </p>
        </ModalDelete>
      </div>
    )
  )
}

export function ListParticipant() {
  const {
    participantGroups,
    shouldMuteAll,
    isModerator,
    modalConfirm,
    bannedParticipantLength,
    handleBroadcastMuteAll,
    handleModerateParticipant,
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
      confirm: 'Ya, Bisukan Semua',
      description: 'Tindakan ini akan membisukan semua peserta rapat. Apa Anda ingin lanjut?',
      onConfirm: handleBroadcastMuteAll,
    },
    ['dismiss-participant']: {
      title: 'Keluarkan Peserta',
      confirm: 'Ya, Keluarkan Peserta',
      description: 'Tindakan ini akan mengeluarkan peserta dari rapat. Apa Anda ingin lanjut?',
      onConfirm: () => handleDismissParticipant(modalConfirm.identity ?? ''),
    },
    ['banned-participant']: {
      title: 'Blokir Peserta',
      confirm: 'Ya, Blokir Peserta',
      description: 'Tindakan ini akan memblokir peserta dari rapat. Apa Anda ingin lanjut?',
      onConfirm: () => handleModerateParticipant(modalConfirm.identity ?? '', 'ban'),
    },
  }

  return (
    <div className='flex w-full flex-col bg-white'>
      <TabsListGroups className='flex h-full flex-col'>
        <p
          className='text-error sticky top-0 py-2 text-right text-sm'
          style={{ display: bannedParticipantLength > 0 ? 'block' : 'none' }}
        >
          {bannedParticipantLength} peserta diblokir
        </p>
        <div className='flex-1 overflow-x-hidden overflow-y-auto'>
          {participantGroups.map(({ id, lists }) => (
            <TabsListGroup key={id} className='flex flex-col'>
              {lists.map(
                ({
                  id: identity,
                  name,
                  roleName,
                  isMuted,
                  isLocal,
                  isModerator,
                  isRaised,
                  isBanned,
                }) => {
                  const currentUser = lists.find((p) => p.isLocal)
                  const amIModerator = currentUser?.isModerator ?? false
                  const showDropdown = amIModerator && !isLocal && !isBanned
                  const canClickHand = isRaised && (isLocal || amIModerator) && !isBanned
                  const canClickMic = !isMuted && (isLocal || amIModerator) && !isBanned

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
                        <TabsListItemTitle
                          className={cn('max-w-38 truncate', isBanned && 'text-red-900')}
                        >
                          {name}
                        </TabsListItemTitle>

                        {isBanned ? (
                          <span className='text-error text-xs'>Diblokir</span>
                        ) : (
                          isModerator &&
                          roleName !== Role.User && (
                            <TabsListItemText
                              className='max-w-50 truncate text-xs text-neutral-500 capitalize'
                              title='Moderator'
                            >
                              {roleName}
                            </TabsListItemText>
                          )
                        )}
                      </TabsListItemContent>

                      <menu className='flex items-center gap-2'>
                        {isBanned ? (
                          amIModerator && (
                            <Button
                              onClick={() => handleModerateParticipant(identity, 'unban')}
                              className='flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-neutral-700 transition-colors hover:bg-neutral-100'
                            >
                              <HugeIcon icon={Unlocked} size={18} className='text-neutral-600' />
                              <span>Buka blokir</span>
                            </Button>
                          )
                        ) : (
                          <>
                            <Button
                              onClick={
                                isLocal ? lowerHandLocal : lowerHand.bind(null, { identity, name })
                              }
                              disabled={!canClickHand}
                              className={cn(
                                'rounded-full border-none p-2 shadow-none transition-colors',
                                {
                                  'cursor-pointer hover:bg-neutral-100': canClickHand,
                                  'cursor-default hover:bg-transparent': !canClickHand,
                                  'opacity-70': !isLocal && !isRaised,
                                }
                              )}
                            >
                              {isRaised ? (
                                <HandIcon weight='fill' size={20} color='#991b1b' />
                              ) : (
                                <HugeIcon icon={DoNotTouch01Icon} size={20} color='#A3A3A3' />
                              )}
                            </Button>

                            <Button
                              onClick={async () =>
                                handleParticipantMute({
                                  isLocal: isLocal,
                                  identity,
                                })
                              }
                              disabled={!canClickMic}
                              className={cn(
                                'rounded-full border-none p-2 shadow-none transition-colors',
                                {
                                  'cursor-pointer hover:bg-neutral-100': canClickMic,
                                  'cursor-default hover:bg-transparent': !canClickMic,
                                  'opacity-70': !amIModerator && !isLocal,
                                }
                              )}
                            >
                              {isMuted ? (
                                <HugeIcon icon={MicOff} size={20} color='#A3A3A3' />
                              ) : (
                                <HugeIcon icon={Mic} size={20} color='#991B1B' />
                              )}
                            </Button>

                            {showDropdown && (
                              <DropdownMenu>
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
                                          className:
                                            'text-red-600 focus:bg-red-50 focus:text-red-700',
                                          onClick: () =>
                                            setModalConfirm({
                                              open: true,
                                              id: 'dismiss-participant',
                                              identity: identity,
                                            }),
                                        },
                                        {
                                          label: 'Blokir peserta',
                                          icon: BlockGameIcon,
                                          iconColor: '#A3A3A3',
                                          className: 'text-neutral-700 focus:bg-neutral-100',
                                          onClick: () =>
                                            setModalConfirm({
                                              open: true,
                                              id: 'banned-participant',
                                              identity: identity,
                                            }),
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
                                          <HugeIcon
                                            icon={item.icon}
                                            size={20}
                                            color={item.iconColor}
                                          />
                                          <span>{item.label}</span>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </DropdownMenu>
                            )}
                          </>
                        )}
                      </menu>
                    </TabsListItem>
                  )
                }
              )}
            </TabsListGroup>
          ))}
        </div>
        {shouldMuteAll && isModerator && (
          <div className='mt-auto bg-white pt-4'>
            <Button
              onClick={() =>
                setModalConfirm({
                  id: 'mute-all',
                  open: true,
                  title: 'Bisukan Semua Peserta',
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
        <p>{modalOptions[modalConfirm.id].description}</p>
      </ModalDelete>
    </div>
  )
}
