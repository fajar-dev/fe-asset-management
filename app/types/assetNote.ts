import type { ApiListResponse, ApiDetailResponse, Pagination } from './api'

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

export type AssetNoteResponse = ApiListResponse<AssetNote>
export type AssetNoteDetailResponse = ApiDetailResponse<AssetNote>

export type { Pagination }
