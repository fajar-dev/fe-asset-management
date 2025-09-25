// types/auth.ts

// ==== Response Types ====
export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

export interface MeResponse {
  id: string
  name: string
  email: string
  avatar?: string
  isActive?: boolean
  lastLoginAt?: string
  lastLoginIp?: string
  phoneNumber?: string
  role: 'admin' | 'user'
}

// ==== User Model ====
export type User = MeResponse
