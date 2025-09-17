// ~/types/assetHolder.ts

export interface AssetHolder {
  id: string
  employeeId: string
  purpose: string
  assignedAt: string // ISO date string
  returnedAt?: string // ISO date string (nullable)
  assetUuid?: string
  createdAt?: string
  updatedAt?: string
}

// Payload for assign
export interface AssignAssetHolderPayload {
  assignedAt: string
  purpose: string
  employeeId: string
}

// Payload for return
export interface ReturnAssetHolderPayload {
  returnedAt: string
}

// Pagination
export interface Pagination {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

// Response for multiple holders
export interface AssetHolderResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetHolder[]
  meta?: {
    pagination: Pagination
  }
}

// Response for single holder
export interface AssetHolderDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetHolder
}
