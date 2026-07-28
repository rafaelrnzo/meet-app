'use client'

import type { Permission } from '@/lib/api/admin-api'
import { useEffect, useState } from 'react'
import { RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { fetchRoles } from '@/lib/api/admin-api'
import { useEventSource } from '@/hooks/use-event-source'
import { useAuth } from '@/hooks/use-auth'
import { ParticipantAttribute } from '@/feat/enum'
import { RolesEventSSE } from '@/app/(protected)/roles/page'

export const useRoomsAuth = () => {
  const room = useRoomContext()
  const [role, setRole] = useState(
    room.localParticipant.attributes[ParticipantAttribute.RoleName.toLowerCase()] ?? ''
  )
  const [permissions, setPermissions] = useState<Permission[]>([])
  const { publicUrl, token } = useAuth()

  const fetchPermissionsInsideRoom = async (role: string) => {
    if (!role) {
      setPermissions([])
      return
    }

    try {
      const response = await fetchRoles()
      const currentRole = response.find((item) => item.name === role)
      setPermissions(currentRole?.permissions ?? [])
    } catch {
      setPermissions([])
    }
  }

  const hasPermissionInMeeting = (name: string) => {
    return permissions?.some(({ key }) => key === name) ?? false
  }

  useEffect(() => {
    if (!room) return

    const syncRole = () => {
      setRole(room.localParticipant.attributes[ParticipantAttribute.RoleName.toLowerCase()] ?? '')
    }

    syncRole()

    room.on(RoomEvent.Connected, syncRole)
    room.on(RoomEvent.ParticipantAttributesChanged, syncRole)

    return () => {
      room.off(RoomEvent.Connected, syncRole)
      room.off(RoomEvent.ParticipantAttributesChanged, syncRole)
    }
  }, [room])

  useEffect(() => {
    fetchPermissionsInsideRoom(role)
  }, [role])

  useEventSource<{ type: RolesEventSSE }>({
    eventUrl: `${publicUrl}/admin/roles/events?token=${token}`,
    onMessage: (event) => {
      if (event.type === RolesEventSSE.RolesUpdated) {
        fetchPermissionsInsideRoom(
          room.localParticipant.attributes[ParticipantAttribute.RoleName.toLowerCase()]
        )
      }
    },
  })

  return {
    role,
    permissions,
    hasPermissionInMeeting,
  }
}
