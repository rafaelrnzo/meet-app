import type { Params } from 'next/dist/server/request/params'
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation'
import { num, omit, qstring } from '@/lib/utils'
import { SearchParamsKey, PanelCode, TabsCode } from '@/feat/enum'

export function useParamsState<P extends Params = Params>() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams<P>()
  const searchParams = useSearchParams()
  const currentParams = Object.fromEntries(searchParams)

  // ─── Raw codes ────────────────────────────────────────────────
  const panelCode = num(searchParams.get(SearchParamsKey.PanelCode))
  const tabsCode = num(searchParams.get(SearchParamsKey.TabsCode))

  // ─── PanelState ───────────────────────────────────────────────
  const isPanelOpen = panelCode === PanelCode.Open
  const isPanelSideOpen = panelCode === PanelCode.SideOpen
  const isPanelActive = panelCode > 0

  const closePanel = () => router.replace(qstring(pathname, omit({ ...currentParams }, [SearchParamsKey.PanelCode]))) // prettier-ignore
  const openPanel = (target: PanelCode) => router.replace(qstring(pathname, { ...currentParams, [SearchParamsKey.PanelCode]: target })) // prettier-ignore
  const togglePanel = (target: PanelCode) => (isPanelActive ? closePanel() : openPanel(target))
  const openPanelOpen = () => openPanel(PanelCode.Open)
  const openPanelSideOpen = () => openPanel(PanelCode.SideOpen)

  // ─── TabsCode ─────────────────────────────────────────────────
  const isTabsMeeting = tabsCode === TabsCode.TabsMeeting
  const isTabsMeetingNotes = tabsCode === TabsCode.TabsMeetingNotes
  const isTabsMeetingPolling = tabsCode === TabsCode.TabsMeetingPolling
  const isTabsMeetingWatchYoutube = tabsCode === TabsCode.TabsMeetingWatchYoutube
  const isTabsParticipant = tabsCode === TabsCode.TabsParticipant
  const isTabsChats = tabsCode === TabsCode.TabsChats
  const isTabsPersonalize = tabsCode === TabsCode.TabsPersonalize
  const isTabsSettings = tabsCode === TabsCode.TabsSettings
  const isTabsActive = tabsCode > 0

  const openTab = (target: TabsCode) => router.replace(qstring(pathname, { ...currentParams, [SearchParamsKey.TabsCode]: target })) // prettier-ignore
  const closeTab = () => router.replace(qstring(pathname, omit({ ...currentParams }, [SearchParamsKey.TabsCode]))) // prettier-ignore
  const toggleTab = (target: TabsCode) => (isTabsActive ? closeTab() : openTab(target))
  const openTabsMeeting = () => openTab(TabsCode.TabsMeeting)
  const openTabsNotes = () => openTab(TabsCode.TabsMeetingNotes)
  const openTabsPolling = () => openTab(TabsCode.TabsMeetingPolling)
  const openTabsWatchYoutube = () => openTab(TabsCode.TabsMeetingWatchYoutube)
  const openTabsParticipant = () => openTab(TabsCode.TabsParticipant)
  const openTabsChats = () => openTab(TabsCode.TabsChats)
  const openTabsPersonalize = () => openTab(TabsCode.TabsPersonalize)
  const openTabsSettings = () => openTab(TabsCode.TabsSettings)

  return {
    // router primitives
    router,
    pathname,
    params,
    searchParams,
    currentParams,

    // raw codes
    panelCode,
    tabsCode,

    // PanelCode checks
    isPanelOpen,
    isPanelSideOpen,
    isPanelActive,

    // PanelCode toggles
    togglePanel,
    closePanel,
    openPanel,
    openPanelOpen,
    openPanelSideOpen,

    // TabsCode checks
    isTabsMeeting,
    isTabsMeetingNotes,
    isTabsMeetingPolling,
    isTabsMeetingWatchYoutube,
    isTabsParticipant,
    isTabsChats,
    isTabsPersonalize,
    isTabsSettings,
    isTabsActive,

    // TabsCode toggles
    toggleTab,
    closeTab,
    openTab,
    openTabsMeeting,
    openTabsNotes,
    openTabsPolling,
    openTabsWatchYoutube,
    openTabsParticipant,
    openTabsChats,
    openTabsPersonalize,
    openTabsSettings,
  }
}
