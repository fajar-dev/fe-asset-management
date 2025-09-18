import { apiClient } from './apiClient'
import type { LoginResponse, RefreshTokenResponse, MeResponse } from '~/types/auth'

export class AuthService {
  private basePath = '/auth'

  async login(email: string, password: string) {
    return await apiClient<{ data: LoginResponse }>(`${this.basePath}/login`, {
      method: 'POST',
      body: { email, password }
    })
  }

  async google(code: string) {
    return await apiClient<{ data: LoginResponse }>(`${this.basePath}/google`, {
      method: 'POST',
      body: { code }
    })
  }

  async refreshToken(refreshToken: string) {
    return await apiClient<{ data: RefreshTokenResponse }>(`${this.basePath}/refresh-token`, {
      method: 'POST',
      body: { refreshToken }
    })
  }

  async getMe(accessToken: string) {
    return await apiClient<{ data: MeResponse }>(`${this.basePath}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  }
}

export const authService = new AuthService()
