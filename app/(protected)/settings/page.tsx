'use client'

export default function SettingsPage() {
  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      <div className='bg-card border-border rounded-lg border p-6 shadow-sm'>
        <h2 className='mb-1 text-base font-semibold'>General Settings</h2>
        <p className='text-muted-foreground mb-6 text-xs'>Manage your application preferences.</p>
        <div className='space-y-4'>
          <div className='bg-muted border-border flex items-center justify-between rounded border p-3'>
            <span className='text-sm font-medium'>Email Notifications</span>
            <div className='bg-muted relative h-5 w-9 cursor-not-allowed rounded-full'>
              <div className='bg-background absolute top-1 left-1 h-3 w-3 rounded-full shadow-sm' />
            </div>
          </div>
          <div className='bg-muted border-border flex items-center justify-between rounded border p-3'>
            <span className='text-sm font-medium'>Two-Factor Auth</span>
            <span className='text-muted-foreground text-xs'>Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}
