// ~/services/EmployeeService.ts
import type { EmployeeResponse } from '~/types/employee'

export class EmployeeService {
  private basePath = '/v1/employee'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  async getAllEmployees(search = ''): Promise<EmployeeResponse> {
    return await this.api<EmployeeResponse>(this.basePath, {
      method: 'GET',
      params: { search },
      headers: this.getAuthHeader()
    })
  }
}

export const employeeService = new EmployeeService()
