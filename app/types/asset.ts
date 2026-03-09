export interface AssetPropertyPayload {
  id: string
  value: string | number
}

export interface AssetLabel {
  key: string
  value: string
}

export interface ImportAssetPayload {
  file: File | null
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
  labels?: AssetLabel[]
  image?: File | null
  isLendable: boolean
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
  labels?: AssetLabel[]
  image?: File | null
  isLendable: boolean
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
  user: string
  price?: number
  purchaseDate: string
  status: 'active' | 'in repair' | 'disposed'
  isLendable: boolean
  isRequest?: boolean
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
  properties?: Array<{
    id: string
    value: string | number
    property: {
      id: string
      name: string
      dataType: string
    }
  }>
  labels?: Array<{
    id: string
    key: string
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
