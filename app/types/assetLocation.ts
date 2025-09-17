export interface Pagination {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export interface MetaPagination {
  pagination: Pagination
}

export interface CreateAssetLocationPayload {
  locationId: string
}

export interface AssetLocationDetail {
  id: string
  name: string
  branch: string
}

export interface AssetLocation {
  id: string
  location: AssetLocationDetail
}

export interface AssetLocationResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetLocation[]
  meta: MetaPagination
}
