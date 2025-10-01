export interface AssetPropertyPayload {
  id: string
  value: string | number
}

export interface customValues {
  name: string
  value: string
}

export interface CreateAssetPayload {
  subCategoryId: string
  code: string
  name: string
  description?: string
  status: 'active' | 'in repair' | 'disposed'
  brand?: string
  model?: string
  properties?: AssetPropertyPayload[]
  customValues?: customValues[]
  image?: File | null
}

export interface UpdateAssetPayload {
  subCategoryId: string
  code: string
  name: string
  description?: string
  status: 'active' | 'in repair' | 'disposed'
  brand?: string
  model?: string
  properties?: AssetPropertyPayload[]
  customValues?: customValues[]
  image?: File | null
}

export interface Asset {
  id: string
  code: string
  name: string
  imageUrl?: string
  imagePath?: string
  description?: string
  brand?: string
  model?: string
  status: 'active' | 'in repair' | 'disposed'
  subCategory: {
    id: string
    name: string
    category: {
      id: string
      name: string
      hasMaintenance: boolean
      hasHolder: boolean
    }
  }
  properties?: Array<{
    id: string
    value: string | number
    property: {
      id: string
      name: string
      dataType: string
    }
  }>
  customValues?: Array<{
    id: string
    name: string
    value: string | number
  }>
}

export interface Pagination {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export interface AssetResponse {
  success: boolean
  statusCode: number
  message: string
  data: Asset[]
  meta?: {
    pagination: Pagination
  }
}

export interface AssetDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: Asset
}
