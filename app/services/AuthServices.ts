import type { LoginResponse, RefreshTokenResponse, MeResponse } from '~/types/auth'

export class AuthService {
  private basePath = '/auth'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  async login(username: string, password: string) {
    return this.api<{ data: LoginResponse }>(`${this.basePath}/is5`, {
      method: 'POST',
      body: { username, password }
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
