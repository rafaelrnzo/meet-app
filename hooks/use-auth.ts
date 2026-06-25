import { notFound, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { logoutSession } from '@/feat/Auth/api'
import { toast } from '@/components/ui/sonner'

type UseAuthOptions = {
  requireAdmin?: boolean
  requirePermission?: string
}

export function useAuth(options?: UseAuthOptions) {
  const { requireAdmin, requirePermission } = options || {}
  const { data, status } = useSession()
  const router = useRouter()

  const role = data?.roles
  const isAdmin = role?.name === 'admin'
  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'

  const hasPermission = (name: string) => {
    return role?.permissions?.some(({ key }) => key === name) ?? false
  }
  const logoutHandler = async () => {
    const { error } = await logoutSession()

    if (error) {
      return toast.error('Gagal keluar dari sistem')
    }

    router.refresh()
  }

  const isUnauthorized =
    isAuthenticated &&
    ((!!requireAdmin && !isAdmin) || (!!requirePermission && !hasPermission(requirePermission)))

  if (isUnauthorized) {
    notFound()
  }

  return {
    isAdmin,
    isAuthenticated,
    loading: isLoading,
    role,
    token: data?.access_token,
    user: data?.profile,
    hasPermission,
    logout: logoutHandler,
    publicUrl: data?.publicUrl,
  }
}
