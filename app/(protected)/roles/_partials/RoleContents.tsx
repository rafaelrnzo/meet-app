'use client'

import RoleCheckbox from '@/app/(protected)/roles/_partials/RoleCheckbox'
import type { Permission } from '@/lib/api/admin-api'
import type { AnyFormApi, useForm } from '@tanstack/react-form'

export interface RoleContentsProps {
  groupedPermissions: {
    room: Permission[]
    groups: Permission[]
    users: Permission[]
    roles: Permission[]
    recordings: Permission[]
    meet_screen: Permission[]
    other: Permission[]
  }
  formApi: AnyFormApi
}

function ControlDashboardContents({ groupedPermissions, formApi }: RoleContentsProps) {
  const form = formApi as unknown as ReturnType<typeof useForm>
  const roomAccess = groupedPermissions.other.find((obj) => obj.key === 'module:rooms:access')
  const recordingAccess = groupedPermissions.other?.find(
    (obj) => obj.key === 'module:recordings:access'
  )

  const groupCheckbox = [
    {
      label: 'Manajemen ruangan',
      permissions: [
        ...groupedPermissions.room.filter(({ label }) => label === 'Manajemen Ruangan'),
        ...(roomAccess ? [roomAccess] : []),
      ],
    },
    {
      label: 'Manajemen kelompok',
      permissions: groupedPermissions.groups,
    },
    {
      label: 'Manajemen peserta',
      permissions: groupedPermissions.users,
    },
    {
      label: 'Manajemen rekaman',
      permissions: [
        ...groupedPermissions.recordings.filter(({ label }) => label === 'Manajemen Rekaman'),
        ...(recordingAccess ? [recordingAccess] : []),
      ],
    },
  ]

  return (
    <>
      <form.Field name='permissions'>
        {(field) => {
          return <RoleCheckbox {...{ data: groupCheckbox, field }} />
        }}
      </form.Field>
    </>
  )
}

function ControlMeetContents({ groupedPermissions, formApi }: RoleContentsProps) {
  const form = formApi as unknown as ReturnType<typeof useForm>

  const groupCheckbox = [
    {
      label: 'Manajemen layar rapat',
      permissions: [
        ...groupedPermissions.meet_screen,
        ...groupedPermissions.recordings.filter(({ label }) => label === 'Manajemen Layar Rapat'),
      ],
    },
    {
      label: 'Manajemen peserta rapat',
      permissions: groupedPermissions.room.filter(
        ({ label }) => label === 'Manajemen Peserta Rapat'
      ),
    },
    {
      label: 'Manajemen akses rapat',
      permissions: groupedPermissions.room.filter(({ label }) => label === 'Manajemen Akses Rapat'),
    },
  ]

  return (
    <>
      <form.Field name='permissions'>
        {(field) => {
          return <RoleCheckbox {...{ data: groupCheckbox, field }} />
        }}
      </form.Field>
    </>
  )
}

export { ControlDashboardContents, ControlMeetContents }
