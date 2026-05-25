'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatFileSize } from '@/lib/utils'
import { ArrowUpToLine, FileText, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export type FileOption = {
  url?: string
  name?: string
  id?: string
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
  files: FileOption[]
}

export default function DropFile({
  onUploadFile,
  onRemoveFile,
  maxFilesSizeInMB = 5,
  multiple = false,
  files: existingFile,
}: DropFileProps) {
  const MAX_FILE = maxFilesSizeInMB * 1_000_000

  const [files, setFiles] = useState<FileOption[]>([])
  const [isLimitExceed, setLimitExceed] = useState(false)
  const [exist, setExist] = useState(existingFile)
  const [isOnlyPdf, setOnlyPdf] = useState(false)
  const displayedFiles = files.length > 0 ? files : exist
  const failedFile = isLimitExceed || isOnlyPdf

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles?.length) return

    const fileArray = multiple ? Array.from(selectedFiles) : [selectedFiles[0]]
    const notPdfFiles = fileArray.filter((file) => file.type !== 'application/pdf')
    const limitExceedFiles = fileArray.filter((file) => file.size > MAX_FILE)

    if (limitExceedFiles.length > 0) {
      setFiles([])
      setLimitExceed(true)
      return
    }

    if (notPdfFiles.length > 0) {
      setFiles([])
      setOnlyPdf(true)
      return
    }

    onUploadFile?.(fileArray)
    setFiles(fileArray)
    setLimitExceed(false)
    setOnlyPdf(false)
  }

  const handleRemoveFiles = (idx: number) => {
    if (files.length > 0) {
      setFiles((prev) => prev.filter((_, i) => i !== idx))
      return
    }
    setExist((prev) => prev.filter((_, i) => i !== idx))
    onRemoveFile?.()
  }

  useEffect(() => {
    setExist(existingFile)
  }, [existingFile])

  return (
    <div>
      <div
        className={cn(
          failedFile ? 'h-[182px] max-h-[182px] bg-red-200' : 'h-[238px] max-h-[238px] bg-red-50',
          'relative mb-1.5 rounded-md'
        )}
      >
        <div className='p-6 text-center'>
          <div className='mb-4 flex justify-center text-center'>
            <div
              className={cn(
                failedFile ? 'border-error' : 'border-slate-400',
                'p- w-fit rounded-md border p-2'
              )}
            >
              <ArrowUpToLine
                className={cn(failedFile ? 'text-error' : 'text-slate-950', 'size-4')}
              />
            </div>
          </div>
          <div className='mb-4'>
            {isLimitExceed ? (
              <div className='mb-4'>
                <p className='text-error font-medium'>
                  Ukuran berkas lebih dari {maxFilesSizeInMB}MB
                </p>
              </div>
            ) : isOnlyPdf ? (
              <div className='mb-4'>
                <p className='text-error font-medium'>Berkas harus dalam format PDF</p>
              </div>
            ) : (
              <>
                <p>
                  Klik untuk memilih berkas, atau seret <br /> berkas ke sini
                </p>
                <p className='text-slate-500'>
                  Berkas PDF (pdf), ukuran maksimal {maxFilesSizeInMB}MB per <br />
                  berkas
                </p>
              </>
            )}
          </div>
          <Button variant='secondary-outline'>
            {failedFile || !displayedFiles.length || (failedFile && displayedFiles.length > 0)
              ? 'Unggah Berkas'
              : 'Ganti Berkas'}
          </Button>
        </div>
        <Input
          type='file'
          multiple={multiple}
          accept='application/pdf'
          className={cn(
            failedFile ? 'h-[182px] max-h-[182px]' : 'h-[238px] max-h-[238px]',
            'absolute top-0 right-0 bottom-0 left-0 w-full cursor-pointer border-dashed p-0 text-transparent file:hidden'
          )}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {!failedFile &&
        displayedFiles.length > 0 &&
        displayedFiles.map(({ name, size, url }, idx) => {
          return (
            <a
              key={idx}
              href={url}
              target='_blank'
              rel='noopener noreferrer'
              className='flex h-[88px] w-full cursor-pointer items-center justify-between rounded-md border border-dashed border-slate-400 bg-red-50 p-6'
            >
              <div className='flex items-center justify-between gap-3'>
                <div className='w-fit rounded-md border border-slate-400 p-2 text-center'>
                  <FileText className='size-4' />
                </div>
                <div>
                  <p className='text-sm font-medium'>{name}</p>
                  <p className='text-sm text-slate-500'>{formatFileSize(size || 0)}</p>
                </div>
              </div>
              <div
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemoveFiles(idx)
                }}
              >
                <Button
                  variant='ghost'
                  className='text-error hover:text-error p-0 hover:bg-transparent'
                >
                  <X className='size-5' />
                </Button>
              </div>
            </a>
          )
        })}
    </div>
  )
}
