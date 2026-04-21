import type { Employee } from './employee'
import type { Pagination } from './api'

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

export interface AssetHolderResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetHolder[]
  meta?: {
    pagination: Pagination
  }
}

export interface AssetHolderDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetHolder
}

export type { Pagination }
