'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatFileSize } from '@/lib/utils'
import { ArrowUpToLine, FileText, X } from 'lucide-react'
import { useState } from 'react'

export type FileOption = {
  url: string
  name: string
  id: string
  type?: string
  size?: number
}

interface DropFileProps {
  required?: boolean
  hide?: boolean
  maxFilesSizeInMB?: number
  onUploadFile?: (e: File[]) => void
  onRemoveFile?: () => void
  multiple?: boolean
}

export default function DropFile({
  onUploadFile,
  onRemoveFile,
  maxFilesSizeInMB = 0,
  multiple = false,
}: DropFileProps) {
  const [files, setFiles] = useState<File[]>([])
  const isLimitExceed = files[0]?.size > maxFilesSizeInMB * 1_000_000
  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles?.length) return
    let fileArray = Array.from(selectedFiles)
    if (!multiple) fileArray = [fileArray[0]]
    if (isLimitExceed) setFiles([])
    setFiles(fileArray)

    if (!isLimitExceed && onUploadFile) {
      onUploadFile(fileArray)
    }
  }
  console.log('FILES DALAM DROPFILE', files)
  console.log('maxFilesSizeInMB', isLimitExceed)
  return (
    <div>
      <div
        className={cn(
          isLimitExceed
            ? 'h-[182px] max-h-[182px] bg-red-200'
            : 'h-[238px] max-h-[238px] bg-red-50',
          'relative mb-1.5 rounded-md'
        )}
      >
        <div className='p-6 text-center'>
          <div className='mb-4 flex justify-center text-center'>
            <div
              className={cn(
                isLimitExceed ? 'border-error' : 'border-slate-400',
                'p- w-fit rounded-md border p-2'
              )}
            >
              <ArrowUpToLine
                className={cn(isLimitExceed ? 'text-error' : 'text-slate-950', 'size-4')}
              />
            </div>
          </div>
          {isLimitExceed ? (
            <div className='mb-4'>
              <p className='text-error font-medium'>
                Ukuran berkas lebih dari {maxFilesSizeInMB}MB
              </p>
            </div>
          ) : (
            <div className='mb-4'>
              <p>
                Klik untuk memilih berkas, atau seret <br /> berkas ke sini
              </p>
              <p className='text-slate-500'>
                Berkas PDF (pdf), ukuran maksimal {maxFilesSizeInMB}MB per <br />
                berkas
              </p>
            </div>
          )}
          <Button variant='secondary-outline'>
            {isLimitExceed ? 'Unggah Berkas' : 'Ganti Berkas'}
          </Button>
        </div>
        <Input
          type='file'
          multiple={multiple}
          accept='.pdf, application/pdf'
          className={cn(
            isLimitExceed ? 'h-[182px] max-h-[182px]' : 'h-[238px] max-h-[238px]',
            'absolute top-0 right-0 bottom-0 left-0 w-full cursor-pointer border-dashed p-0 text-transparent file:hidden'
          )}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {!isLimitExceed &&
        files.length > 0 &&
        files.map(({ name, size }, idx) => {
          return (
            <div
              key={idx}
              className='flex h-[88px] w-full cursor-pointer items-center justify-between rounded-md border border-dashed border-slate-400 bg-red-50 p-6'
            >
              <div className='flex items-center gap-2'>
                <div className='w-fit rounded-md border border-slate-400 p-2 text-center'>
                  <FileText className='size-4' />
                </div>
                <div>
                  <p className='text-sm font-medium'>{name}</p>
                  <p className='text-sm text-slate-500'>{formatFileSize(size || 0)}</p>
                </div>
              </div>
              <Button
                variant='ghost'
                className='text-error hover:text-error p-0 hover:bg-transparent'
                onClick={onRemoveFile}
              >
                <X className='size-5' />
              </Button>
            </div>
          )
        })}
    </div>
  )
}
