import { djs } from '@/lib/utils'
import * as yup from 'yup'

const PARTICIPANT_FULL_MESSAGE =
  'Peserta kelompok melebihi maksimal peserta, silakan atur ulang input maksimal peserta'

function isParticipantFull(fieldName: 'groupId' | 'assignedTo') {
  return function (this: yup.TestContext, value?: string[] | string) {
    const assignedTo: string[] = this.resolve(yup.ref('assignedTo'))
    const maxParticipants: number | null = this.resolve(yup.ref('maxParticipants'))
    const totalGroupMember: number = this.resolve(yup.ref('totalGroupMember'))
    const totalParticipant = assignedTo.length + totalGroupMember
    const hasValue = typeof value === 'string' ? !!value : !!value?.length
    const isError = hasValue && assignedTo.length + totalGroupMember > (maxParticipants ?? 0)

    if (isError) {
      return this.createError({
        message:
          fieldName === 'assignedTo'
            ? `${totalParticipant} peserta telah dipilih, silakan atur ulang input maksimal peserta`
            : PARTICIPANT_FULL_MESSAGE,
      })
    }

    return true
  }
}

const roomSchema = (props?: { isLive?: boolean; activeParticipant?: number }) =>
  yup.object().shape({
    name: yup
      .string()
      .max(50, 'Nama Ruangan maksimal 50 karakter')
      .required('Nama Ruangan wajib diisi')
      .default(''),
    description: yup.string().max(250, 'Deskripsi maksimal 250 karakter').default(''),
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
      .test('isValid', 'Jam Mulai harus lebih dari atau sama dengan saat ini', function (value) {
        return !value || props?.isLive || djs(value).isAfter() || djs(value).isSame()
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
      .min(
        props?.activeParticipant || 1,
        `Maksimal Anggota minimal ${props?.activeParticipant || 1}`
      ),
    assignedTo: yup
      .array()
      .of(yup.string().defined())
      .default([])
      .test('isFull', PARTICIPANT_FULL_MESSAGE, isParticipantFull('assignedTo')),
    isMuteOnStart: yup.boolean().default(false),
  })

export { roomSchema }
