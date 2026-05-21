import * as yup from 'yup'
export const createGroupsSchema = yup.object().shape({
  name: yup
    .string()
    .required('Nama kelompok wajib diisi')
    .max(50, 'Nama kelompok maksimal 50 karakter')
    .default(''),
  description: yup
    .string()
    .optional()
    .max(250, 'Deskripsi kelompok maksimal 250 karakter')
    .default(''),
})

export const editGroupSchema = yup.object().shape({
  user_ids: yup.array().of(yup.number()).default([]),
})
