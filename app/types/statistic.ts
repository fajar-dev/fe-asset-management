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
  totalPrice: number
}

export type CountResponse = ApiResponse<CountData>

// ---- Asset By Category ----
export interface AssetByCategoryData {
  id: string
  name: string
  value: number
}

export type AssetByCategoryResponse = ApiResponse<AssetByCategoryData[]>

// ---- Asset By SubCategory ----
export interface AssetBySubCategoryData {
  id: string
  name: string
  value: number
}

export type AssetBySubCategoryResponse = ApiResponse<AssetBySubCategoryData[]>

// ---- Asset By Location ----
export interface AssetByLocationData {
  id: string
  name: string
  value: number
  branch: string
}

export type AssetByLocationResponse = ApiResponse<AssetByLocationData[]>

// ---- Price By Category ----
export interface CategoryPriceData {
  id: string
  name: string
  value: number
}

export type CategoryPriceResponse = ApiResponse<CategoryPriceData[]>

// ---- Price By Location ----
export interface LocationPriceData {
  id: string
  name: string
  branch: string
  value: number
}

export type LocationPriceResponse = ApiResponse<LocationPriceData[]>

// ---- Asset Aging ----
export interface AssetAgingData {
  name: string
  value: number
}

export type AssetAgingResponse = ApiResponse<AssetAgingData[]>

// ---- Data Quality ----
export interface DataQualityData {
  name: string
  value: number
}

export type DataQualityResponse = ApiResponse<DataQualityData[]>
