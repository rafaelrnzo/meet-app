'use client'
import type { AnyFieldApi } from '@tanstack/react-form'
import type { Permission } from '@/lib/api/admin-api'
import type { GroupedPermission } from '@/app/(protected)/roles/_partials/RoleContents'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Label } from '@/components/ui/label'
import { Field, FieldGroup } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { RoleClientAccor } from '@/app/(protected)/roles/_partials/RoleMobile'

export type AccorValue =
  | 'Manajemen ruangan'
  | 'Manajemen kelompok'
  | 'Manajemen peserta'
  | 'Manajemen rekaman'
  | 'Manajemen layar rapat'
  | 'Manajemen peserta rapat'
  | 'Manajemen akses rapat'
interface RoleCheckboxProps {
  allPermissions: GroupedPermission
  groupCheckbox: {
    label: string
    permissions: Permission[]
  }[]
  field: AnyFieldApi
}

export default function RoleCheckbox({ allPermissions, groupCheckbox, field }: RoleCheckboxProps) {
  const isMobile = useIsMobile()
  const [activeAccor, setActiveAccor] = useState<AccorValue>('Manajemen ruangan')
  const restrictPermissionsRoom = ['room:manage', 'room:share']
  const restrictPermissionsRecording = ['recording:delete', 'recording:manage']
  const keyRoomAccess = 'module:rooms:access'
  const keyRecordingAccess = 'module:recordings:access'
  const keyRecordingRead = 'recording:read'
  const getIdRecordingAccess = allPermissions?.other.find(
    (obj) => obj.key === keyRecordingAccess
  )?.ID
  const getIdRecordingRead = allPermissions?.recordings.find(
    (obj) => obj.key === keyRecordingRead
  )?.ID
  // sync recording permissions between module:recordings:access and recording:read
  const idRecordingAccess = [getIdRecordingAccess, getIdRecordingRead]

  return (
    <div
      className={cn(
        groupCheckbox.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1',
        isMobile ? 'gap-0' : 'gap-4',
        'mt-2 grid grid-cols-1'
      )}
    >
      <RoleClientAccor {...{ isMobile, activeAccor }}>
        {groupCheckbox.map((grouping, idx) => {
          const findKey = grouping.permissions.findIndex(
            ({ ID, key }) => key === keyRoomAccess || idRecordingAccess.includes(ID)
          )
          if (findKey !== -1) {
            const [targetObject] = grouping.permissions.splice(findKey, 1)
            grouping.permissions.unshift(targetObject)
          }
          const selected = (field.state.value as number[]) ?? []

          const CheckboxContents = () => {
            return (
              <FieldGroup>
                <div
                  className={cn(
                    isMobile && 'mt-4',
                    'grid grid-cols-1 items-start gap-2 md:grid-cols-2'
                  )}
                >
                  {grouping.permissions.length === 0 ? (
                    <span>Tidak ada izin</span>
                  ) : (
                    grouping.permissions.map((perm) => {
                      const hasRoomAccess = grouping.permissions.some(
                        (obj) => obj.key === keyRoomAccess && selected.includes(obj.ID)
                      )
                      const hasRecordingAccess = grouping.permissions.some(
                        (obj) => idRecordingAccess.includes(obj.ID) && selected.includes(obj.ID)
                      )

                      return (
                        <Field orientation='horizontal' key={perm.ID}>
                          <Checkbox
                            id={String(perm.ID)}
                            checked={selected.includes(perm.ID)}
                            onCheckedChange={(checked: boolean) => {
                              field.handleChange((prev: number[]) => {
                                if (checked) {
                                  // sending 2 permission immediately and get sync recording permissions
                                  if (idRecordingAccess.includes(perm.ID)) {
                                    return Array.from(new Set([...prev, ...idRecordingAccess]))
                                  }
                                  return Array.from(new Set([...prev, perm.ID]))
                                }
                                // restrict permission for Manajemen ruangan
                                if (perm.key === keyRoomAccess) {
                                  const restrictedIds = grouping.permissions
                                    .filter(({ key }) => restrictPermissionsRoom.includes(key))
                                    .map(({ ID }) => ID)
                                  return prev.filter(
                                    (id) => id !== perm.ID && !restrictedIds.includes(id)
                                  )
                                }
                                // restrict permission for Manajemen rekaman
                                if (idRecordingAccess.includes(perm.ID)) {
                                  const restrictedIds = [
                                    ...allPermissions.other,
                                    ...allPermissions.recordings,
                                  ]
                                    .filter(({ key }) => restrictPermissionsRecording.includes(key))
                                    .map(({ ID }) => ID)
                                  return prev.filter(
                                    (id) =>
                                      !idRecordingAccess.includes(id) && !restrictedIds.includes(id)
                                  )
                                }
                                return prev?.filter((permsId) => permsId !== perm.ID)
                              })
                            }}
                            className='cursor-pointer'
                            disabled={
                              (!hasRoomAccess && restrictPermissionsRoom.includes(perm.key)) ||
                              (!hasRecordingAccess &&
                                restrictPermissionsRecording.includes(perm.key))
                            }
                          />
                          <Label
                            htmlFor={String(perm.ID)}
                            className={cn(
                              selected.includes(perm.ID) ? 'text-red-800' : 'text-slate-950',
                              'cursor-pointer text-base font-normal'
                            )}
                          >
                            {perm.description}
                          </Label>
                        </Field>
                      )
                    })
                  )}
                </div>
              </FieldGroup>
            )
          }
          return (
            <div key={idx}>
              {isMobile ? (
                <AccordionItem
                  value={grouping.label}
                  className='my-2'
                  onClick={() => setActiveAccor(grouping.label as AccorValue)}
                >
                  <AccordionTrigger className='rounded-lg border border-neutral-200 p-3'>
                    <div className='flex w-full justify-between'>
                      <span>{grouping.label}</span>
                      <span>{grouping.permissions.length} izin</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CheckboxContents />
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <div>
                  <div className='mb-2 flex justify-between'>
                    <p className='text-sm text-slate-950'>{grouping.label}</p>
                    <p className='text-xs text-neutral-400'>{grouping.permissions.length} izin</p>
                  </div>
                  <Card
                    key={idx}
                    className={cn(
                      (idx === 1 || idx === 0) && grouping.permissions.length > 1
                        ? 'h-26.5'
                        : 'min-h-fit',
                      'max-h-26.5 min-h-fit'
                    )}
                  >
                    <CardContent className='p-5'>
                      <CheckboxContents />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )
        })}
      </RoleClientAccor>
    </div>
  )
}
