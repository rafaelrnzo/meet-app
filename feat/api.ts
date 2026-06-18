'use server'

import { ScreenCode } from '@/feat/enum'

const DEFAULT_YOUTUBE_URL = 'https://youtu.be/e1QIqXmZ2os?si=Gd9591aZIBoeI3Mi'

const DEFAULT_FILE_URL = 'https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf'

export async function getRemoteUrl(
  screenId: Extract<ScreenCode, ScreenCode.WatchYoutube | ScreenCode.Presentation>
) {
  await new Promise((res) => setTimeout(res, 1000))

  const identifier = {
    [ScreenCode.WatchYoutube]: DEFAULT_YOUTUBE_URL,
    [ScreenCode.Presentation]: DEFAULT_FILE_URL,
  }

  try {
    return { data: { url: identifier[screenId] } }
  } catch (error) {
    return { data: null, error }
  }
}
