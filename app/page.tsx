import { redirect, RedirectType } from 'next/navigation'
import { auth } from '@/lib/auth'
import { fetcher } from '@/feat/Auth/helpers'

export default async function LoginPage() {
  const session = {
    current: await auth(),
    redirectUri: '/',
  }

  if (!session.current) {
    const { data } = await fetcher<{ callbackUrl: string }>(
      process.env.KEYCLOAK_REDIRECT_URI + '/api/verify',
      {
        method: 'POST',
      }
    )
    session.redirectUri = data.callbackUrl
  }

  console.log(session.redirectUri)

  return redirect(session.redirectUri, RedirectType.replace)
}
