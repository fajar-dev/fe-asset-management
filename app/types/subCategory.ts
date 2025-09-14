export interface AssetProperty {
  id: string
  name: string
  dataType: 'string' | 'number'
}

export interface SubCategory {
  data: any
  id: string
  name: string
  category: Category | null
  assetProperties?: AssetProperty[] | null
}

export interface CreateSubCategoryPayload {
  name: string
  categoryId: string
}

export interface UpdateSubCategoryPayload extends Partial<CreateSubCategoryPayload> {
  id?: string
}

export interface Pagination {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export interface SubCategoryResponse {
  success: boolean
  statusCode: number
  message: string
  data: SubCategory[]
  meta: {
    pagination: Pagination
  }
}

export interface SubCategoryDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: SubCategory
}

// Optional: jika Category dari tipe sebelumnya
export interface Category {
  id: string
  name: string
  hasLocation: boolean
  hasMaintenance: boolean
  hasHolder: boolean
}
