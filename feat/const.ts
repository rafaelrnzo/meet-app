import type { TabProps } from '@/feat/types'
import {
  TabsPolling,
  TabsMeeting,
  TabsParticipant,
  TabsPersonalize,
  TabsSettings,
} from '@/feat/Tabs'
import { GroupCode, GroupsCode, TabsCode } from '@/feat/enum'
import { WatchYoutube } from '@/feat/Activity/WatchYoutube'

export const ChunkSize = 60_000

// prettier-ignore
export const ColorPalette: { tldraw: string; hex: string }[] = [
  { tldraw: 'black',        hex: 'rgb(29, 29, 29)' },
  { tldraw: 'grey',         hex: 'rgb(159, 168, 178)' },
  { tldraw: 'light-violet', hex: 'rgb(224, 133, 244)' },
  { tldraw: 'violet',       hex: 'rgb(174, 62, 201)' },
  { tldraw: 'blue',         hex: 'rgb(68, 101, 233)' },
  { tldraw: 'light-blue',   hex: 'rgb(75, 161, 241)' },
  { tldraw: 'yellow',       hex: 'rgb(241, 172, 75)' },
  { tldraw: 'orange',       hex: 'rgb(225, 105, 25)' },
  { tldraw: 'green',        hex: 'rgb(9, 146, 104)' },
  { tldraw: 'light-green',  hex: 'rgb(76, 176, 94)' },
  { tldraw: 'light-red',    hex: 'rgb(248, 119, 119)' },
  { tldraw: 'red',          hex: 'rgb(224, 49, 49)' },
]

export const RoomTabs = [
  {
    id: TabsCode.TabsMeeting,
    content: () => TabsMeeting,
    hide: false,
  },
  {
    id: TabsCode.TabsMeetingNotes,
    parentId: 1,
    content: () => () => null,
    hide: false,
    description: 'Berbagi catatan',
  },
  {
    id: TabsCode.TabsMeetingPolling,
    parentId: 1,
    content: () => TabsPolling,
    hide: false,
    description: 'Pendapat',
  },
  {
    id: TabsCode.TabsMeetingWatchYoutube,
    parentId: 1,
    content: () => WatchYoutube,
    hide: false,
    description: 'Bagikan video youtube',
  },
  {
    id: TabsCode.TabsParticipant,
    content: () => TabsParticipant,
    hide: false,
  },
  {
    id: TabsCode.TabsChats,
    content: () => () => null,
    hide: false,
    description: 'Semua orang',
  },
  {
    id: TabsCode.TabsPersonalize,
    content: () => TabsPersonalize,
    hide: false,
  },
  {
    id: TabsCode.TabsSettings,
    content: () => TabsSettings,
    hide: false,
    description: 'Gunakan pengaturan ini untuk mengatur rapat Anda.',
  },
] satisfies TabProps[]

export const RoomTabsTools = [
  {
    id: 1,
    title: 'Perangkat rapat',
    icon: 'tools' as const,
    tabIds: [1, 11, 12, 13],
  },
  {
    id: 2,
    title: 'Daftar peserta',
    icon: 'multiple' as const,
    tabIds: [2],
  },
  {
    id: 3,
    title: 'Percakapan',
    icon: 'chat' as const,
    tabIds: [3],
  },
  {
    id: 4,
    title: 'Latar belakang virtual',
    icon: 'magic' as const,
    tabIds: [4],
  },
  {
    id: 5,
    title: 'Alat pengaturan',
    icon: 'settings' as const,
    tabIds: [5],
  },
]

export const TabsContents = [
  {
    id: GroupsCode.Collaboration,
    headline: 'Kolaborasi',
    hide: false,
    lists: [
      {
        id: GroupCode.Notes,
        icon: 'phosphor/notebook' as const,
        title: 'Berbagi catatan',
        description: 'Mencatat bersama - sama secara langsung',
        hide: false,
      },
      {
        id: GroupCode.Polling,
        icon: 'hugeicons/anaytics-01' as const,
        title: 'Jajak pendapat',
        description: 'Buat & kelola jajak pendapat',
        hide: false,
      },
      {
        id: GroupCode.Whiteboard,
        icon: 'phosphor/presentation' as const,
        title: 'Papan tulis',
        description: 'Kanvas menggambar kolaboratif',
        hide: false,
      },
    ],
  },
  {
    id: GroupsCode.Content,
    headline: 'Konten',
    hide: false,
    lists: [
      {
        id: GroupCode.Presentation,
        icon: 'phosphor/projector-screen-chart' as const,
        title: 'Presentasi',
        description: 'Lihat berkas presentasi yang diunggah',
        hide: false,
      },
    ],
  },
  {
    id: GroupsCode.Media,
    headline: 'Media',
    hide: false,
    lists: [
      {
        id: GroupCode.WatchYoutube,
        icon: 'phosphor/youtube-logo' as const,
        title: 'Berbagi video online ke pihak luar',
        description: 'Tonton video YouTube bersama',
        hide: false,
      },
    ],
  },
  {
    id: GroupsCode.Admin,
    headline: 'Admin',
    hide: false,
    lists: [
      {
        id: GroupCode.Recording,
        icon: 'hugeicons/live-streaming-03' as const,
        title: 'Mulai rekam rapat',
        description: 'Rekam rapat sekarang',
        hide: false,
      },
      {
        id: GroupCode.PickRandom,
        icon: 'phosphor/dice-six' as const,
        title: 'Pilih peserta acak',
        description: 'Pilih peserta secara acak',
        hide: false,
      },
    ],
  },
]

export type TabsRoomToolsIconKey = (typeof RoomTabsTools)[number]['icon']

export type TabsContentIconKey = (typeof TabsContents)[number]['lists'][number]['icon']

export type TabsContentList = (typeof TabsContents)[number]['lists'][number]

export type TabsContentIconId = (typeof TabsContents)[number]['lists'][number]['id']
