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

export function formatStatusLabel(status: string): string {
  return status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

const STATUS_COLOR_MAP: Record<string, 'success' | 'error' | 'warning' | 'primary' | 'neutral'> = {
  active: 'success',
  disposed: 'error',
  sold: 'warning',
  granted: 'primary'
}

export function getStatusColor(status: string): 'success' | 'error' | 'warning' | 'primary' | 'neutral' {
  return STATUS_COLOR_MAP[status] ?? 'neutral'
}
