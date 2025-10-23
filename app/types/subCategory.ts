// ~/types/subCategory.ts

export interface AssetProperty {
  id: string
  name: string
  dataType: 'string' | 'number'
}

export interface Category {
  id: string
  name: string
  hasLocation: boolean
  hasMaintenance: boolean
  hasHolder: boolean
}

export interface SubCategory {
  id: string
  name: string
  level: number
  category: Category | null
  parent: SubCategory | null
  children: SubCategory[]
  assetProperties: AssetProperty[]
}

export interface CreateSubCategoryPayload {
  name: string
  categoryId: string
  parentId?: string
}

export interface UpdateSubCategoryPayload {
  name: string
  categoryId: string
  parentId?: string
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

export interface SubCategoryHierarchyResponse {
  success: boolean
  statusCode: number
  message: string
  data: SubCategory[]
}

export interface SubCategoryPathResponse {
  success: boolean
  statusCode: number
  message: string
  data: SubCategory[]
}
