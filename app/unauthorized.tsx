import ErrorPage from '@/compounds/error-page'

function UnauthorizedPage() {
  return <ErrorPage status={401} />
}

export default UnauthorizedPage
