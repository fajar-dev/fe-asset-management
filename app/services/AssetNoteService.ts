import { BaseService } from '~/services/base'
import type {
  AssetNote,
  AssetNoteResponse,
  AssetNoteDetailResponse,
  CreateAssetNotePayload,
  UpdateAssetNotePayload
} from '~/types/assetNote'

export class AssetNoteService extends BaseService {
  private basePath = '/v1/asset'

  async getNotes(
    assetUuid: string,
    params: { all?: boolean, search?: string, page?: number, limit?: number } = {}
  ): Promise<AssetNoteResponse> {
    return await this.api<AssetNoteResponse>(`${this.basePath}/${assetUuid}/note`, {
      method: 'GET',
      params,
      headers: this.getAuthHeader()
    })
  }

  async getNoteById(assetUuid: string, noteId: string): Promise<AssetNoteDetailResponse> {
    return await this.api<AssetNoteDetailResponse>(`${this.basePath}/${assetUuid}/note/${noteId}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async createNote(assetUuid: string, payload: CreateAssetNotePayload): Promise<AssetNote> {
    return await this.api<AssetNote>(`${this.basePath}/${assetUuid}/note`, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async updateNote(assetUuid: string, noteId: string, payload: UpdateAssetNotePayload): Promise<void> {
    await this.api(`${this.basePath}/${assetUuid}/note/${noteId}`, {
      method: 'PUT',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async deleteNote(assetUuid: string, noteId: string): Promise<void> {
    await this.api(`${this.basePath}/${assetUuid}/note/${noteId}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
  }
}

export const assetNoteService = new AssetNoteService()
