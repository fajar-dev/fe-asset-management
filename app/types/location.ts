export interface Location {
  id: string
  name: string
  branch: string
}

export interface Pagination {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export interface LocationResponse {
  success: boolean
  statusCode: number
  message: string
  data: Location[]
  meta: {
    pagination: Pagination
  }
}

export interface LocationDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: Location
}

export interface CreateLocationPayload {
  name: string
  branch: string
}

export interface UpdateLocationPayload extends Partial<CreateLocationPayload> {
  id?: string
}
