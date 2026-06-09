import { copyHandler } from '@/lib/utils'

async function mailtoHandler({
  receiver = [],
  subject = '',
  body,
}: {
  receiver?: string[]
  subject?: string
  body: string
}) {
  const commaSeparatedReceiver = receiver?.join(',') ?? ''
  const encodedSubject = encodeURIComponent(subject)
  const encodedBody = encodeURIComponent(body)

  const mailtoUrl = `mailto:${commaSeparatedReceiver}?subject=${encodedSubject}&body=${encodedBody}`

  try {
    const link = document.createElement('a')
    link.href = mailtoUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    await copyHandler(body)
    return { success: true }
  } catch {
    return { success: false }
  }
}

export { mailtoHandler }
