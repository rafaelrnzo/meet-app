export default function Loading() {
  return (
    <div className='bg-background text-foreground absolute inset-0 flex items-center justify-center'>
      <div className='border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent' />
    </div>
  )
}
