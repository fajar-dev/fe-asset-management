export interface ApiError {
  message: string
}

export interface Pagination {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export interface ApiListResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T[]
  meta?: {
    pagination: Pagination
  }
}

export interface ApiDetailResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T
}
