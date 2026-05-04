import { djs } from '@/lib/utils'
import * as yup from 'yup'

const roomSchema = yup.object().shape({
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
    .test('isRequired', 'Waktu Mulai wajib diisi', (value) => !!value)
    .test(
      'isValid',
      'Jam Mulai tidak boleh lebih dari atau sama dengan Jam Berakhir',
      function (value) {
        const end: Date = this.resolve(yup.ref('endDate'))
        return !end || !value || djs(value).isBefore(end)
      }
    )
    .test('isValid', 'Jam Mulai harus lebih dari saat ini', function (value) {
      return !value || djs(value).isAfter()
    })
    .default(null),
  endDate: yup
    .date()
    .nullable()
    .transform((value: Date, originalValue: string) => (originalValue ? value : null))
    .test('isRequired', 'Waktu Selesai wajib diisi', (value) => !!value)
    .default(null),
  password: yup.string().default('').max(250, 'Kata Sandi Ruangan maksimal 250 karakter'),
  groupId: yup.string().default(''),
  maxParticipants: yup
    .number()
    .default(null)
    .nullable()
    .min(1, 'Maksimal Anggota minimal 1')
    .test('isRequired', 'Maksimal Anggota wajib diisi', (value) => !!value),
  assignedTo: yup.array().of(yup.string().defined()).default([]),
  isMuteOnStart: yup.boolean().default(false),
})

export { roomSchema }
