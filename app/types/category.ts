export interface Category {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
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
