export interface AssetMaintenance {
  id: string
  assetUuid: string
  maintenanceAt: string // ISO date string, e.g. "2025-06-09"
  note: string
  createdAt?: string
  updatedAt?: string
}

// Payload for create
export interface CreateAssetMaintenancePayload {
  maintenanceAt: string
  note: string
}

// Payload for update (optional fields)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateAssetMaintenancePayload extends Partial<CreateAssetMaintenancePayload> {}

// Pagination
export interface Pagination {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

// Response for multiple maintenances
export interface AssetMaintenanceResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetMaintenance[]
  meta?: {
    pagination: Pagination
  }
}

// Response for single maintenance
export interface AssetMaintenanceDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetMaintenance
}
