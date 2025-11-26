// ~/services/assetMaintenance.ts
import type {
  AssetNote,
  AssetNoteResponse,
  AssetNoteDetailResponse,
  CreateAssetNotePayload,
  UpdateAssetNotePayload
} from '~/types/assetNote'

export class AssetNoteService {
  private basePath = '/v1/asset'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  /**
   * Get maintenances
   * - Support pagination (page, limit)
   * - Support search
   * - If all = true, ignore pagination
   */
  async getNotes(
    assetUuid: string,
    params: {
      all?: boolean
      search?: string
      page?: number
      limit?: number
    } = {}
  ): Promise<AssetNoteResponse> {
    return await this.api<AssetNoteResponse>(
      `${this.basePath}/${assetUuid}/note`,
      {
        method: 'GET',
        params,
        headers: this.getAuthHeader()
      }
    )
  }

  // Get single maintenance by ID
  async getNoteById(
    assetUuid: string,
    noteId: string
  ): Promise<AssetNoteDetailResponse> {
    return await this.api<AssetNoteDetailResponse>(
      `${this.basePath}/${assetUuid}/note/${noteId}`,
      {
        method: 'GET',
        headers: this.getAuthHeader()
      }
    )
  }

  // Create new maintenance
  async createNote(
    assetUuid: string,
    payload: CreateAssetNotePayload
  ): Promise<AssetNote> {
    return await this.api<AssetNote>(
      `${this.basePath}/${assetUuid}/note`,
      {
        method: 'POST',
        body: payload,
        headers: this.getAuthHeader()
      }
    )
  }

  // Update maintenance
  async updateNote(
    assetUuid: string,
    noteId: string,
    payload: UpdateAssetNotePayload
  ): Promise<void> {
    await this.api(
      `${this.basePath}/${assetUuid}/note/${noteId}`,
      {
        method: 'PUT',
        body: payload,
        headers: this.getAuthHeader()
      }
    )
  }

  // Delete maintenance
  async deleteNote(
    assetUuid: string,
    noteId: string
  ): Promise<void> {
    await this.api(
      `${this.basePath}/${assetUuid}/note/${noteId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeader()
      }
    )
  }
}

export const assetNoteService = new AssetNoteService()
