// ~/types/property.ts

export interface Property {
  id: string
  name: string
  dataType: 'string' | 'number'
}

// Payload for creating a new property
export interface CreatePropertyPayload {
  name: string
  dataType: 'string' | 'number'
}

// Payload for updating an existing property (optional fields)
export interface UpdatePropertyPayload extends Partial<CreatePropertyPayload> {
  id?: string
}

// Pagination (reusable)
export interface Pagination {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

// Response for multiple properties (paginated or all)
export interface PropertyResponse {
  success: boolean
  statusCode: number
  message: string
  data: Property[]
  meta?: {
    pagination?: Pagination
  }
}

// Response for single property detail
export interface PropertyDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: Property
}
