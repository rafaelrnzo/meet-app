'use client'
import type { AnyFieldApi } from '@tanstack/react-form'
import type { Permission } from '@/lib/api/admin-api'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Field, FieldGroup } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'

interface RoleCheckboxProps {
  data: {
    label: string
    permissions: Permission[]
  }[]
  field: AnyFieldApi
}

export default function RoleCheckbox({ data, field }: RoleCheckboxProps) {
  const restrictPermissionsRoom = ['room:manage', 'room:share']
  const restrictPermissionsRecording = ['recording:read', 'recording:delete', 'recording:manage']
  const keyRoomAccess = 'module:rooms:access'
  const keyRecordingAccess = 'module:recordings:access'

  return (
    <div
      className={cn(data.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1', 'grid grid-cols-1 gap-4')}
    >
      {data.map((grouping, idx) => {
        const findKey = grouping.permissions.findIndex(
          ({ key }) => key === keyRoomAccess || key === keyRecordingAccess
        )
        if (findKey !== -1) {
          const [targetObject] = grouping.permissions.splice(findKey, 1)
          grouping.permissions.unshift(targetObject)
        }
        const selected = (field.state.value as number[]) ?? []
        return (
          <div key={idx}>
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
                <FieldGroup>
                  <div className='grid grid-cols-1 items-start gap-2 md:grid-cols-2'>
                    {grouping.permissions.length === 0 ? (
                      <span>Tidak ada izin</span>
                    ) : (
                      grouping.permissions.map((perm) => {
                        const hasRoomAccess = grouping.permissions.some(
                          (obj) => obj.key === keyRoomAccess && selected.includes(obj.ID)
                        )
                        const hasRecordingAccess = grouping.permissions.some(
                          (obj) => obj.key === keyRecordingAccess && selected.includes(obj.ID)
                        )
                        return (
                          <Field orientation='horizontal' key={perm.ID}>
                            <Checkbox
                              id={String(perm.ID)}
                              checked={selected.includes(perm.ID)}
                              onCheckedChange={(checked: boolean) => {
                                field.handleChange((prev: number[]) => {
                                  if (checked) {
                                    return Array.from(new Set([...prev, perm.ID]))
                                  }
                                  if (perm.key === keyRoomAccess) {
                                    const restrictedIds = grouping.permissions
                                      .filter(({ key }) => restrictPermissionsRoom.includes(key))
                                      .map(({ ID }) => ID)
                                    return prev.filter(
                                      (id) => id !== perm.ID && !restrictedIds.includes(id)
                                    )
                                  }
                                  if (perm.key === keyRecordingAccess) {
                                    const restrictedIds = grouping.permissions
                                      .filter(({ key }) =>
                                        restrictPermissionsRecording.includes(key)
                                      )
                                      .map(({ ID }) => ID)
                                    return prev.filter(
                                      (id) => id !== perm.ID && !restrictedIds.includes(id)
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
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
