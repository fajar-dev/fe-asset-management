export interface AssetNote {
  id: string
  assetUuid: string
  occuredAt: string // ISO date string, e.g. "2025-06-09"
  note: string
  createdAt?: string
  updatedAt?: string
}

// Payload for create
export interface CreateAssetNotePayload {
  occuredAt: string
  note: string
}

// Payload for update (optional fields)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateAssetNotePayload extends Partial<CreateAssetNotePayload> {}

// Pagination
export interface Pagination {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

// Response for multiple maintenances
export interface AssetNoteResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetNote[]
  meta?: {
    pagination: Pagination
  }
}

// Response for single maintenance
export interface AssetNoteDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetNote
}
