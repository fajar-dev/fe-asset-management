import { BaseService } from '~/services/base'
import type { EmployeeResponse } from '~/types/employee'

export class EmployeeService extends BaseService {
  private basePath = '/v1/employee'

  async getAllEmployees(search = ''): Promise<EmployeeResponse> {
    return await this.api<EmployeeResponse>(this.basePath, {
      method: 'GET',
      params: { search },
      headers: this.getAuthHeader()
    })
  }
}

export const employeeService = new EmployeeService()
