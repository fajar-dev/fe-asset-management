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
  brand?: string
  model?: string
  user: string
  price?: number
  purchaseDate?: string
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
  brand?: string
  model?: string
  user: string
  price?: number
  purchaseDate?: string
  properties?: AssetPropertyPayload[]
  labels?: AssetLabel[]
  image?: File | null
  isLendable: boolean
}

export interface AssetHolder {
  id: string
  assignedAt: string
  returnedAt?: string | null
  employee: {
    id: string
    fullName: string
    employeeId: string
    photoProfile?: string
  }
}

export interface AssetStatus {
  id: string
  type: string
  note?: string
  createdAt: string
  user: {
    name: string
    employeeId: string
  }
}

export interface AssetLocation {
  id: string
  locationId: string
  name: string
  branch: {
    id: string
    name: string
    code: string
  }
}

export interface Asset {
  id: string
  code: string
  name: string
  imageUrl?: string | null
  imagePath?: string | null
  description?: string | null
  brand?: string | null
  model?: string | null
  user: string
  price?: number | string | null
  purchaseDate: string | null
  age?: string | null
  isLendable: boolean
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
    value: string | number | null
    property: {
      id: string
      name: string
      dataType: string
    }
  }>
  labels?: Array<{
    key: string
    value: string
  }>
  activeHolder?: AssetHolder | null
  lastStatus?: AssetStatus | null
  lastLocation?: AssetLocation | null
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
