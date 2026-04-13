if (typeof Promise.withResolvers === 'undefined') {
  const withResolvers = function () {
    let resolve, reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

  if (typeof window !== 'undefined') {
    ;(window as any).Promise.withResolvers = withResolvers
  }
  if (typeof global !== 'undefined') {
    ;(global as any).Promise.withResolvers = withResolvers
  }
  // @ts-expect-error polyfill
  Promise.withResolvers = withResolvers
}

export {}
