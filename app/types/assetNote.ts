import type { Pagination } from './api'

export interface AssetNote {
  id: string
  assetUuid: string
  occuredAt: string
  note: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateAssetNotePayload {
  occuredAt: string
  note: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateAssetNotePayload extends Partial<CreateAssetNotePayload> {}

export interface AssetNoteResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetNote[]
  meta?: {
    pagination: Pagination
  }
}

export interface AssetNoteDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetNote
}

export type { Pagination }
