import type { Employee } from './employee'
import type { ApiListResponse, ApiDetailResponse, Pagination } from './api'

export interface AssetHolder {
  id: string
  employee: Employee
  purpose: string
  assignedAt: string
  returnedAt?: string
  assetUuid?: string
  attachmentUrls?: string[]
  attachmentPaths?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface AssignAssetHolderPayload {
  assignedAt: string
  purpose: string
  employeeId: string
  attachments?: File[]
}

export interface ReturnAssetHolderPayload {
  returnedAt: string
  attachments?: File[]
}

export type AssetHolderResponse = ApiListResponse<AssetHolder>
export type AssetHolderDetailResponse = ApiDetailResponse<AssetHolder>

export type { Pagination }
