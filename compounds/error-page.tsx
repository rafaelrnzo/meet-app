'use client'

import StatePage from '@/components/ui/state-page'

const ERROR_CONFIG = {
  401: {
    title: 'Akses Ditolak',
    desc: 'Anda tidak memiliki izin untuk membuka halaman atau ruang meeting ini.',
    goBack: true,
  },
  404: {
    title: 'Halaman Tidak Ditemukan',
    desc: 'Halaman yang Anda cari tidak tersedia.',
    goBack: true,
    reload: true,
  },
  500: {
    title: 'Sistem sedang Mengalami Gangguan',
    desc: 'Sistem sedang mengalami kendala. Silakan coba beberapa saat lagi.',
    goBack: true,
    reload: true,
  },
  502: {
    title: 'Layanan Sementara Tidak Tersedia',
    desc: 'MEET sedang dalam pemeliharaan atau mengalami kepadatan akses. Silakan coba beberapa saat lagi.',
  },
}

export default function ErrorPage({ status }: { status: 401 | 404 | 500 | 502 }) {
  const error = ERROR_CONFIG[status] ?? ERROR_CONFIG[401]
  return <StatePage className='h-[calc(100vh-124px)]' {...error} />
}
