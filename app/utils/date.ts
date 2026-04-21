export function formatCalendarDate(date: { day: number, month: number, year: number } | null): string {
  if (!date) return 'Select a date'
  const day = String(date.day).padStart(2, '0')
  const month = String(date.month).padStart(2, '0')
  return `${day}/${month}/${date.year}`
}

export function calendarDateToISOString(date: { day: number, month: number, year: number }): string {
  const month = String(date.month).padStart(2, '0')
  const day = String(date.day).padStart(2, '0')
  return `${date.year}-${month}-${day}`
}

export function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${d.getFullYear()}`
}
