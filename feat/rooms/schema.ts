import { djs } from '@/lib/utils'
import * as yup from 'yup'

const roomSchema = (props?: { isLive?: boolean; currentParticipant?: number }) =>
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
    groupId: yup.string().default(''),
    maxParticipants: yup
      .number()
      .default(null)
      .nullable()
      .min(
        props?.currentParticipant || 1,
        `Maksimal Anggota minimal ${props?.currentParticipant || 1}`
      )
      .test('isRequired', 'Maksimal Anggota wajib diisi', (value) => !!value),
    assignedTo: yup.array().of(yup.string().defined()).default([]),
    isMuteOnStart: yup.boolean().default(false),
  })

export { roomSchema }
