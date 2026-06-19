import { signIn } from '@/lib/auth'

export const POST = async () => {
  try {
    const redirectUrl = (await signIn('keycloak', { redirect: false })) as string

    return Response.json({ callbackUrl: redirectUrl })
  } catch (error) {
    return Response.json({ callbackUrl: null, error }, { status: 500 })
  }
}
