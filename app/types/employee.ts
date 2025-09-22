import type { Branch } from './branch'

export interface Employee {
  employeeId: string
  fullName: string
  jobPosition: string
  email: string
  mobilePhone: string
  photoProfile: string
  branch: Branch
}
export interface EmployeeResponse {
  success: boolean
  statusCode: number
  message: string
  data: Employee[]
}
