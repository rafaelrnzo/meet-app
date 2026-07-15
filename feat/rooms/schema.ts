import * as yup from 'yup'
import { djs } from '@/lib/utils'

const PARTICIPANT_FULL_MESSAGE =
  'Peserta kelompok melebihi maksimal peserta, silakan atur ulang input maksimal peserta'

function isParticipantFull(fieldName: 'groupId' | 'assignedTo') {
  return function (this: yup.TestContext, value?: string[] | string) {
    const assignedTo = this.resolve<string[]>(yup.ref('assignedTo')).length
    const maxParticipants = this.resolve<number | null>(yup.ref('maxParticipants')) ?? 0
    const totalGroupMember = this.resolve<number>(yup.ref('totalGroupMember'))
    const hasValue = typeof value === 'string' ? !!value : !!value?.length
    const isError =
      hasValue && maxParticipants > 0 && assignedTo + totalGroupMember > maxParticipants

    if (isError) {
      return this.createError({
        message:
          fieldName === 'assignedTo'
            ? 'Jumlah peserta yang diceklis sudah melebih maksimal peserta, silakan atur ulang input maksimal peserta'
            : PARTICIPANT_FULL_MESSAGE,
      })
    }

    return true
  }
}

const roomSchema = (props?: { activeParticipant?: number; isEdit?: boolean }) =>
  yup.object().shape({
    name: yup
      .string()
      .trim()
      .max(50, 'Nama Ruangan maksimal 50 karakter')
      .required('Nama Ruangan wajib diisi')
      .default(''),
    description: yup.string().max(250, 'Deskripsi maksimal 250 karakter').trim().default(''),
    startDate: yup
      .date()
      .nullable()
      .transform((value: Date, originalValue: string) => (originalValue ? value : null))
      .test('isRequired', 'Waktu Mulai wajib diisi', function (value) {
        const end: Date = this.resolve(yup.ref('endDate'))
        return !!value && !!end
      })
      .test('isValid', 'Jam Mulai harus kurang dari Jam Berakhir', function (value) {
        const end: Date = this.resolve(yup.ref('endDate'))
        return !end || !value || djs(value).isBefore(end)
      })
      .default(null),
    endDate: yup
      .date()
      .nullable()
      .transform((value: Date, originalValue: string) => (originalValue ? value : null))
      .default(null),
    password: yup.string().default('').max(250, 'Kata Sandi Ruangan maksimal 250 karakter'),
    groupId: yup
      .string()
      .default('')
      .test('isFull', PARTICIPANT_FULL_MESSAGE, isParticipantFull('groupId')),
    totalGroupMember: yup.number().default(0),
    maxParticipants: yup
      .number()
      .default(null)
      .nullable()
      .test('isRequired', 'Maksimal Anggota wajib diisi', (value) => !!value)
      .when([], (_, schema) => {
        return props?.activeParticipant
          ? schema.min(
              props.activeParticipant,
              `✕ Jumlah peserta rapat saat ini ${props?.activeParticipant} orang`
            )
          : schema.min(1, 'Maksimal Anggota minimal 1')
      }),
    assignedTo: yup
      .array()
      .of(yup.string().defined())
      .default([])
      .test('isFull', PARTICIPANT_FULL_MESSAGE, isParticipantFull('assignedTo')),
    isMuteOnStart: yup.boolean().default(false),
    enableStartRoom: yup.boolean().default(true),
  })

export { roomSchema }
