import type { FetchError } from 'ofetch'

export function extractErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const fetchError = err as FetchError<{ message?: string }>
  return fetchError?.data?.message ?? fallback
}
