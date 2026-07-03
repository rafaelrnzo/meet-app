import type { Icon } from '@/components/ui/icon'

interface SidebarItemsProps {
  isAdmin: boolean
  hasPermission: (key: string) => boolean
}

interface SidebarItemsDTO {
  id: string
  href: string
  icon: React.ComponentProps<typeof Icon>['type']
  label: string
  hasPermission: boolean
}

export const sidebarItems = ({ isAdmin, hasPermission }: SidebarItemsProps): SidebarItemsDTO[] => [
  { id: 'home', href: '/', icon: 'home', label: 'Beranda', hasPermission: true },
  {
    id: 'rooms',
    href: '/rooms',
    icon: 'video',
    label: 'Ruangan',
    hasPermission: hasPermission('module:rooms:access'),
  },
  {
    id: 'groups',
    href: '/groups',
    icon: 'gift',
    label: 'Kelompok',
    hasPermission: hasPermission('group:read'),
  },
  {
    id: 'users',
    href: '/users',
    icon: 'users',
    label: 'Peserta',
    hasPermission: hasPermission('user:read'),
  },
  {
    id: 'roles',
    href: '/roles',
    icon: 'shield-half',
    label: 'Roles & Permissions',
    hasPermission: isAdmin,
  },
  {
    id: 'recordings',
    href: '/recordings',
    icon: 'play-circle',
    label: 'Rekaman',
    hasPermission: hasPermission('module:recordings:access'),
  },
]
