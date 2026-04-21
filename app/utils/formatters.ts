export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value))
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}
