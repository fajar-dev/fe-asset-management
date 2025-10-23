export interface ApiResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T
}

// ---- Count ----
export interface CountData {
  assets: number
  categories: number
  subCategories: number
  locations: number
}

export type CountResponse = ApiResponse<CountData>

// ---- Asset By Category ----
export interface AssetByCategoryData {
  name: string
  value: number
}

export type AssetByCategoryResponse = ApiResponse<AssetByCategoryData[]>

// ---- Asset By SubCategory ----
export interface AssetBySubCategoryData {
  name: string
  value: number
}

export type AssetBySubCategoryResponse = ApiResponse<AssetBySubCategoryData[]>

// ---- Asset By Location ----
export interface AssetByLocationData {
  name: string
  value: number
}

export type AssetByLocationResponse = ApiResponse<AssetByLocationData[]>
