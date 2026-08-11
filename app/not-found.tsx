import { default as ErrorPage } from '@/compounds/error-page'

export default function CustomNotFound() {
  return <ErrorPage status={404} />
}
