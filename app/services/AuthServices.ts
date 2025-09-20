import type { LoginResponse, RefreshTokenResponse, MeResponse } from '~/types/auth'

export class AuthService {
  private basePath = '/auth'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  async login(email: string, password: string) {
    return this.api<{ data: LoginResponse }>(`${this.basePath}/login`, {
      method: 'POST',
      body: { email, password }
    })
  }

  async google(code: string) {
    return this.api<{ data: LoginResponse }>(`${this.basePath}/google`, {
      method: 'POST',
      body: { code }
    })
  }

  async refreshToken(refreshToken: string) {
    return this.api<{ data: RefreshTokenResponse }>(`${this.basePath}/refresh-token`, {
      method: 'POST',
      body: { refreshToken }
    })
  }

  async getMe(accessToken: string) {
    return this.api<{ data: MeResponse }>(`${this.basePath}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  }
}

export const authService = new AuthService()
