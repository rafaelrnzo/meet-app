'use client'

import type { FC, MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { CopyIcon } from '@phosphor-icons/react'
import { cn, qstring } from '@/lib/utils'
import { useParamsState } from '@/hooks'
import { TabsRoomIcon } from '@/feat/Tabs'
import { copyHandler } from '@/feat/helpers'
import { SearchParamsKey } from '@/feat/enum'
import { RoomTabsTools, RoomTabs } from '@/feat/const'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HugeIcon, Menu } from '@/components/HugeIcon'
import { ButtonTab } from '@/components/Button'

const TOOLTIP_TIMEOUT = 1_000

export const RoomContent: FC = () => {
  const [mobileOpen, setMobileOpen] = useState(true)
  const { router, pathname, params, currentParams, tabsCode, isPanelActive } = useParamsState<{
    name: string
  }>()
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout>>(void 0)
  const [openTooltip, setOpenTooltip] = useState<'mobile' | 'desktop' | null>(null)

  const handleShowTooltip = (trigger: typeof openTooltip) => {
    clearTimeout(tooltipTimeoutRef.current)
    setOpenTooltip(trigger)
    tooltipTimeoutRef.current = setTimeout(() => setOpenTooltip(null), TOOLTIP_TIMEOUT)
  }

  const copyText = useRef((code: string, trigger: typeof openTooltip) => {
    return (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      copyHandler(code)
      handleShowTooltip(trigger)
    }
  })

  useEffect(() => {
    function showLeaveAlert(e: Event) {
      if (window.location.origin.startsWith('https')) {
        e.preventDefault()
      }
    }

    window.addEventListener('beforeunload', showLeaveAlert)

    return () => {
      window.removeEventListener('beforeunload', showLeaveAlert)
    }
  }, [])

  return (
    <div className='flex items-center justify-between gap-3 xl:-mt-31 xl:px-5 xl:py-6'>
      <div className={cn('grow text-sm', mobileOpen ? 'hidden xl:block' : 'block')}>
        <Tooltip open={openTooltip === 'mobile'}>
          <TooltipTrigger asChild>
            <button
              type='submit'
              className='text-primary bg-background border-primary hover:not-disabled:bg-primary/20 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border px-3 font-semibold disabled:opacity-40 xl:hidden'
              onClick={copyText.current(params.name, 'mobile')}
            >
              <CopyIcon size={20} />
              Salin kode
            </button>
          </TooltipTrigger>
          <TooltipContent side='top'>Kode disalin</TooltipContent>
        </Tooltip>

        <div className='hidden flex-col gap-2 xl:flex'>
          <p>Kode ruangan</p>
          <div className='flex gap-2'>
            <div className='flex h-9 w-50 cursor-text items-center rounded-md border px-3 shadow'>
              {params.name}
            </div>
            <Tooltip open={openTooltip === 'desktop'}>
              <TooltipTrigger asChild>
                <ButtonTab
                  className='size-9'
                  title='Salin kode ruangan'
                  onClick={copyText.current(params.name, 'desktop')}
                >
                  <CopyIcon size={20} />
                </ButtonTab>
              </TooltipTrigger>
              <TooltipContent side='top'>Kode disalin</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      <ButtonTab
        className='xl:hidden'
        onClick={(e) => {
          e.preventDefault()
          setMobileOpen((prev) => !prev)
        }}
      >
        <HugeIcon icon={Menu} size={22} />
      </ButtonTab>
      <div
        className={cn(
          'flex grow gap-3 justify-self-stretch xl:flex xl:grow-0',
          !mobileOpen && 'hidden'
        )}
      >
        {RoomTabsTools.map(({ id, icon, tabIds }) => (
          <ButtonTab
            key={id}
            isActive={tabIds.includes(tabsCode) && isPanelActive}
            className='w-full xl:w-10'
            onClick={() => {
              const selectedTab = RoomTabs.find((tabs) => tabIds.includes(tabs.id))?.id ?? null
              const togglePanel = isPanelActive ? (tabIds.includes(tabsCode) ? null : 1) : 1

              router.replace(
                qstring(
                  pathname,
                  {
                    ...currentParams,
                    [SearchParamsKey.PanelCode]: togglePanel,
                    [SearchParamsKey.TabsCode]: tabsCode
                      ? tabIds.includes(tabsCode)
                        ? tabsCode
                        : selectedTab
                      : selectedTab,
                  },
                  { skipNulls: true }
                )
              )
            }}
          >
            <TabsRoomIcon name={icon} />
          </ButtonTab>
        ))}
      </div>
    </div>
  )
}
