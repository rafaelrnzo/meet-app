import type { Icon } from '@/components/ui/icon'

export const sidebarItems: {
  id: string
  href: string
  icon: React.ComponentProps<typeof Icon>['type']
  label: string
  permission: null | string
}[] = [
  { id: 'home', href: '/', icon: 'home', label: 'Beranda', permission: null },
  { id: 'rooms', href: '/rooms', icon: 'video', label: 'Ruangan', permission: 'room:read' },
  { id: 'groups', href: '/groups', icon: 'gift', label: 'Kelompok', permission: 'group:manage' },
  { id: 'users', href: '/users', icon: 'users', label: 'Peserta', permission: 'user:read' },
  {
    id: 'roles',
    href: '/roles',
    icon: 'shield-half',
    label: 'Roles & Permissions',
    permission: 'role:read',
  },
  {
    id: 'recordings',
    href: '/recordings',
    icon: 'play-circle',
    label: 'Rekaman',
    permission: 'recording:read',
  },
]
