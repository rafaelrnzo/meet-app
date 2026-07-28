'use client'

import type { FC } from 'react'
import { XIcon } from '@phosphor-icons/react'
import { ConnectionInterceptor } from '@/feat/enum'

interface InterceptorRoomProps {
  interceptor: Exclude<ConnectionInterceptor, ConnectionInterceptor.WrongPassword>
  onClick?: () => void
}

export const InterceptorRoom: FC<InterceptorRoomProps> = ({
  interceptor = ConnectionInterceptor.Unknown,
  onClick,
}) => {
  const copy = {
    [ConnectionInterceptor.Unknown]: {
      title: 'Terjadi kesalahan',
      description: 'Silakan kembali beberapa saat lagi.',
      back: 'Kembali',
    },
    [ConnectionInterceptor.Pending]: {
      title: 'Menunggu pesetujuan admin',
      description: 'Mohon tunggu, admin akan segera mengizinkan Anda masuk.',
      back: 'Kembali',
    },
    [ConnectionInterceptor.Limit]: {
      title: 'Batas jumlah pengguna telah tercapai.',
      description: 'Silakan hubungi admin untuk bergabung ke rapat ini.',
      back: 'Kembali',
    },
    [ConnectionInterceptor.Blocked]: {
      title: 'Anda telah diblokir dari ruang rapat',
      description: 'Silakan hubungi admin untuk bergabung ke rapat ini.',
      back: 'Kembali',
    },
    [ConnectionInterceptor.Unauthorized]: {
      title: 'Anda tidak diizinkan masuk',
      description: 'Silakan hubungi admin untuk bergabung ke rapat ini.',
      back: 'Kembali',
    },
    [ConnectionInterceptor.Locked]: {
      title: 'Ruangan terkunci',
      description: 'Harap hubungi admin untuk konfirmasi ruang rapat',
      back: 'Kembali',
    },
  }

  const { title, description, back } =
    copy[interceptor in copy ? interceptor : ConnectionInterceptor.Unknown]

  return (
    <div className='relative flex h-full min-h-screen flex-col items-center justify-center'>
      <div className='w-[384px] max-w-full gap-2 px-3 text-center text-sm'>
        <span className='border-muted-foreground text-primary inline-block rounded-md border p-1.75'>
          <XIcon size={32} />
        </span>
        <p className='text-primary text-lg font-semibold'>{title}</p>
        <p className='text-muted-foreground'>{description}</p>
        <button
          type='button'
          className='border-muted-foreground mt-4 inline-flex h-8 w-full items-center justify-center rounded-md border font-semibold'
          onClick={onClick}
        >
          {back}
        </button>
      </div>
    </div>
  )
}
