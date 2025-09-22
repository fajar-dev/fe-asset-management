export interface AssetPropertyPayload {
  id: string
  value: string | number
}

export interface CreateAssetPayload {
  subCategoryId: string
  code: string
  name: string
  description?: string
  brand?: string
  model?: string
  properties?: AssetPropertyPayload[] // opsional
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateAssetPayload extends CreateAssetPayload {}

export interface Asset {
  data: any
  id: string
  code: string
  name: string
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
      hasLocation: boolean
      hasMaintenance: boolean
      hasHolder: boolean
    }
  }
  properties?: {
    id: string
    value: string | number
    property: {
      id: string
      name: string
      dataType: string
    }
  }[]
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
