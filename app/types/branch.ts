export interface Branch {
  branchId: string
  name: string
}
export interface BranchResponse {
  success: boolean
  statusCode: number
  message: string
  data: Branch[]
}
