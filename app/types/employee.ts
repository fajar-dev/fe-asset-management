import type { Branch } from './branch'
import type { ApiListResponse } from './api'

export interface Employee {
  employeeId: string
  fullName: string
  jobPosition: string
  email: string
  mobilePhone: string
  photoProfile: string
  branch: Branch
}
export type EmployeeResponse = ApiListResponse<Employee>
