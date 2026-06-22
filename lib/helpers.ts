interface FieldOption {
  value: string
  label: string
}

export function filterByQuery<T extends FieldOption>(query: string, array: T[]) {
  // 1. Trim whitespace and convert to lowercase for case-insensitivity
  const cleanQuery = query.trim().toLowerCase()

  // Return the original array if the query is empty
  if (!cleanQuery) return array

  return array.filter((item) => {
    const cleanLabel = item.label.toLowerCase()

    // 2. Check if the whole label starts with the query
    const startsAtBeginning = cleanLabel.startsWith(cleanQuery)

    // 3. Check if any word inside the label starts with the query
    // (by looking for a space followed exactly by the query)
    const startsAtWordBoundary = cleanLabel.includes(` ${cleanQuery}`)

    // 4. Has more than or equal with 3 word, then start looking for its char
    const includesQuery = cleanQuery.length >= 3 ? cleanLabel.includes(cleanQuery) : false

    return startsAtBeginning || startsAtWordBoundary || includesQuery
  })
}
