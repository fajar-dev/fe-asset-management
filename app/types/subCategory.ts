import type { ApiListResponse, ApiDetailResponse, Pagination } from './api'

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
  labels?: string[]
}

export interface CreateSubCategoryPayload {
  name: string
  categoryId: string
  parentId?: string
  labels?: string[]
}

export interface UpdateSubCategoryPayload {
  name: string
  categoryId: string
  parentId?: string
  labels?: string[]
}

export type SubCategoryResponse = ApiListResponse<SubCategory>
export type SubCategoryDetailResponse = ApiDetailResponse<SubCategory>
export type SubCategoryHierarchyResponse = ApiListResponse<SubCategory>
export type SubCategoryPathResponse = ApiListResponse<SubCategory>

export type { Pagination }
