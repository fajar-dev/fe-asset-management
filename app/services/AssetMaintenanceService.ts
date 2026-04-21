import { BaseService } from '~/services/base'
import type {
  AssetMaintenance,
  AssetMaintenanceResponse,
  AssetMaintenanceDetailResponse,
  CreateAssetMaintenancePayload,
  UpdateAssetMaintenancePayload
} from '~/types/assetMaintenance'

export class AssetMaintenanceService extends BaseService {
  private basePath = '/v1/asset'

  async getMaintenances(
    assetUuid: string,
    params: { all?: boolean, search?: string, page?: number, limit?: number } = {}
  ): Promise<AssetMaintenanceResponse> {
    return await this.api<AssetMaintenanceResponse>(`${this.basePath}/${assetUuid}/maintenance`, {
      method: 'GET',
      params,
      headers: this.getAuthHeader()
    })
  }

  async getMaintenanceById(assetUuid: string, maintenanceId: string): Promise<AssetMaintenanceDetailResponse> {
    return await this.api<AssetMaintenanceDetailResponse>(`${this.basePath}/${assetUuid}/maintenance/${maintenanceId}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async createMaintenance(assetUuid: string, payload: CreateAssetMaintenancePayload): Promise<AssetMaintenance> {
    return await this.api<AssetMaintenance>(`${this.basePath}/${assetUuid}/maintenance`, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async updateMaintenance(assetUuid: string, maintenanceId: string, payload: UpdateAssetMaintenancePayload): Promise<void> {
    await this.api(`${this.basePath}/${assetUuid}/maintenance/${maintenanceId}`, {
      method: 'PUT',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async deleteMaintenance(assetUuid: string, maintenanceId: string): Promise<void> {
    await this.api(`${this.basePath}/${assetUuid}/maintenance/${maintenanceId}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
  }
}

export const assetMaintenanceService = new AssetMaintenanceService()
