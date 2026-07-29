import type { TabProps } from '@/feat/types'
import { TabsWatchYoutube } from '@/feat/Tabs/WatchYoutube'
import { TabsSettingsRooms } from '@/feat/Tabs/SettingsRooms'
import { TabsSettingsRecordings } from '@/feat/Tabs/SettingsRecordings'
import { TabsSettingsParticipants } from '@/feat/Tabs/SettingsParticipants'
import {
  TabsPolling,
  TabsMeeting,
  TabsParticipant,
  TabsPersonalize,
  TabsSettings,
} from '@/feat/Tabs'
import { CameraResolution, GroupCode, GroupsCode, TabsCode } from '@/feat/enum'

export const ChunkSize = 60_000

export const ColorPalette: { tldraw: string; hex: string }[] = [
  { tldraw: 'black', hex: '#1D1D1D' },
  { tldraw: 'grey', hex: '#9FA8B2' },
  { tldraw: 'light-violet', hex: '#E085F4' },
  { tldraw: 'violet', hex: '#AE3EC9' },
  { tldraw: 'blue', hex: '#4465E9' },
  { tldraw: 'light-blue', hex: '#4BA1F1' },
  { tldraw: 'yellow', hex: '#F1AC4B' },
  { tldraw: 'orange', hex: '#E16919' },
  { tldraw: 'green', hex: '#099268' },
  { tldraw: 'light-green', hex: '#4CB05E' },
  { tldraw: 'light-red', hex: '#F87777' },
  { tldraw: 'red', hex: '#E03131' },
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
    content: () => TabsWatchYoutube,
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
  {
    id: TabsCode.TabsSettingsRecordings,
    parentId: 5,
    content: () => TabsSettingsRecordings,
    hide: false,
    description: 'Daftar rekaman rapat',
  },
  {
    id: TabsCode.TabsSettingsRooms,
    parentId: 5,
    content: () => TabsSettingsRooms,
    hide: false,
    description: 'Daftar ruang rapat yang tersedia',
  },
  {
    id: TabsCode.TabsSettingsParticipants,
    parentId: 5,
    content: () => TabsSettingsParticipants,
    hide: false,
    description: 'Daftar peserta',
  },
] satisfies TabProps[]

export const RoomTabsTools = (role: string) => [
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
    tabIds: [5, 51, 52, 53],
    hide: role === 'user',
  },
]

export const TabsContents = (role: string, hasPermissionInMeeting: (name: string) => boolean) => [
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
        hide: role === 'user',
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
    hide: role === 'user',
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
    hide: role === 'user',
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
    hide: role === 'user',
    lists: [
      {
        id: GroupCode.Recording,
        icon: 'hugeicons/live-streaming-03' as const,
        title: 'Mulai rekam rapat',
        description: 'Rekam rapat sekarang',
        hide: !hasPermissionInMeeting('recording:create'),
      },
      {
        id: GroupCode.PickRandom,
        icon: 'phosphor/dice-six' as const,
        title: 'Pilih peserta acak',
        description: 'Pilih peserta secara acak',
        hide: role === 'user',
      },
    ],
  },
]

export const CameraResolutionOptions = [
  { label: 'UHD (4K)', value: CameraResolution.UHD },
  { label: 'QHD (2K)', value: CameraResolution.QHD },
  { label: 'Full HD (1080p)', value: CameraResolution.FULLHD },
  { label: 'High Definition (720p)', value: CameraResolution.HIGH },
  { label: 'Standard (540p)', value: CameraResolution.STANDART },
  { label: 'Data Saver (360p)', value: CameraResolution.LOW },
]

export type TabsRoomToolsIconKey = ReturnType<typeof RoomTabsTools>[number]['icon']

export type TabsContentIconKey = ReturnType<typeof TabsContents>[number]['lists'][number]['icon']

export type TabsContentList = ReturnType<typeof TabsContents>[number]['lists'][number]

export type TabsContentIconId = ReturnType<typeof TabsContents>[number]['lists'][number]['id']
