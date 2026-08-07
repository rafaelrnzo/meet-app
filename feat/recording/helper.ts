import { copyHandler } from '@/lib/utils'

async function mailtoHandler({ subject = '', body }: { subject?: string; body: string }) {
  const encodedSubject = encodeURIComponent(subject)
  const encodedBody = encodeURIComponent(body)
  const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`

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
