// ~/types/assetHolder.ts

import type { Employee } from './employee'

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

// Payload for assign
export interface AssignAssetHolderPayload {
  assignedAt: string
  purpose: string
  employeeId: string
  attachments?: File[]
}

// Payload for return
export interface ReturnAssetHolderPayload {
  returnedAt: string
  attachments?: File[]
}

// Pagination
export interface Pagination {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

// Response for multiple holders
export interface AssetHolderResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetHolder[]
  meta?: {
    pagination: Pagination
  }
}

// Response for single holder
export interface AssetHolderDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetHolder
}
