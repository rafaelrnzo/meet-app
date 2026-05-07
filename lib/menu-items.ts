import { Home, Video, Users, Settings, PlayCircle, Shield, Gift } from 'lucide-react'

export const sidebarItems = [
  { id: 'home', href: '/', icon: Home, label: 'Beranda', permission: null },
  { id: 'rooms', href: '/rooms', icon: Video, label: 'Ruangan', permission: 'room:read' },
  { id: 'groups', href: '/groups', icon: Gift, label: 'Kelompok', permission: 'group:manage' },
  { id: 'users', href: '/users', icon: Users, label: 'Peserta', permission: 'user:read' },
  {
    id: 'roles',
    href: '/roles',
    icon: Shield,
    label: 'Roles & Permissions',
    permission: 'role:read',
  },
  {
    id: 'recordings',
    href: '/recordings',
    icon: PlayCircle,
    label: 'Rekaman',
    permission: 'recording:read',
  },
  { id: 'settings', href: '/settings', icon: Settings, label: 'Settings', permission: null },
]
