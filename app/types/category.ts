export interface Category {
  id: string
  name: string
  hasLocation: boolean
  hasMaintenance: boolean
  hasHolder: boolean
}

export interface Pagination {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export interface CategoryResponse {
  success: boolean
  statusCode: number
  message: string
  data: Category[]
  meta: {
    pagination: Pagination
  }
}

export interface CategoryDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: Category
}

export interface CreateCategoryPayload {
  name: string
  hasLocation: boolean
  hasMaintenance: boolean
  hasHolder: boolean
}

export interface UpdateCategoryPayload extends Partial<CreateCategoryPayload> {
  id?: string
}
