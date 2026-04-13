import {
  Home,
  Video,
  Users,
  Settings,
  PlayCircle,
  Briefcase,
  Shield,
  LogOut,
  Moon,
  Sun,
  Menu,
} from 'lucide-react'

export const sidebarItems = [
  { id: 'home', href: '/', icon: Home, label: 'Home', permission: null },
  { id: 'rooms', href: '/rooms', icon: Video, label: 'Rooms', permission: 'room:read' },
  { id: 'groups', href: '/groups', icon: Briefcase, label: 'Groups', permission: 'group:manage' },
  { id: 'users', href: '/users', icon: Users, label: 'Users', permission: 'user:read' },
  { id: 'roles', href: '/roles', icon: Shield, label: 'Roles', permission: 'role:read' },
  {
    id: 'recordings',
    href: '/recordings',
    icon: PlayCircle,
    label: 'Recordings',
    permission: 'recording:read',
  },
  { id: 'settings', href: '/settings', icon: Settings, label: 'Settings', permission: null },
]
