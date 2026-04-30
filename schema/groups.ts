import * as yup from 'yup'
export const createGroupsSchema = yup.object().shape({
  name: yup
    .string()
    .required('Nama kelompok wajib diisi')
    .max(255, 'Nama kelompok maksimal 255 karakter')
    .default(''),
  description: yup
    .string()
    .optional()
    .max(255, 'Deskripsi kelompok maksimal 255 karakter')
    .default(''),
})

export const editGroupSchema = yup.object().shape({
  user_id: yup.number().required('Nama anggota wajib diisi').default(0),
})
