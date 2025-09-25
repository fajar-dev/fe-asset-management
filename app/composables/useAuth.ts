import type { Ref, ComputedRef } from 'vue'
import type { User } from '~/types/auth'
import type { ApiError } from '~/types/api'
import { authService } from '~/services/AuthServices'
import type { FetchError } from 'ofetch'

interface AuthState {
  accessToken: Ref<string | null>
  refreshToken: Ref<string | null>
  user: Ref<User | null>
  isAuthenticated: ComputedRef<boolean>
  login: (email: string, password: string) => Promise<boolean>
  google: (code: string) => Promise<boolean>
  logout: () => void
  refreshAccessToken: () => Promise<boolean>
  getMe: () => Promise<boolean>
}

export const useAuth = (): AuthState => {
  const router = useRouter()
  const toast = useToast()

  const accessToken = useState<string | null>('auth.accessToken', () =>
    import.meta.client ? localStorage.getItem('accessToken') : null
  )
  const refreshToken = useState<string | null>('auth.refreshToken', () =>
    import.meta.client ? localStorage.getItem('refreshToken') : null
  )
  const user = useState<User | null>('auth.user', () => {
    if (import.meta.client) {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    }
    return null
  })

  const isAuthenticated = computed(() => !!accessToken.value)

  function setTokens(access: string, refresh: string, userData?: User) {
    accessToken.value = access
    refreshToken.value = refresh
    if (userData) user.value = userData

    if (import.meta.client) {
      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
      if (userData) localStorage.setItem('user', JSON.stringify(userData))
    }
  }

  function clearTokens() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    if (import.meta.client) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const res = await authService.login(email, password)
      setTokens(res.data.accessToken, res.data.refreshToken)
      await getMe()
      toast.add({ title: 'Success', description: 'Logged in successfully' })
      return true
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      toast.add({
        title: 'Login failed',
        description: fetchError.data?.message || 'Something went wrong',
        color: 'error'
      })
      return false
    }
  }

  async function google(code: string): Promise<boolean> {
    try {
      const res = await authService.google(code)
      setTokens(res.data.accessToken, res.data.refreshToken)
      await getMe()
      toast.add({ title: 'Success', description: 'Logged in successfully' })
      return true
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      toast.add({
        title: 'Login failed',
        description: fetchError.data?.message || 'Something went wrong',
        color: 'error'
      })
      return false
    }
  }

  function logout(): void {
    clearTokens()
    router.push('/login')
  }

  async function refreshAccessToken(): Promise<boolean> {
    if (!refreshToken.value) return false
    try {
      const res = await authService.refreshToken(refreshToken.value)
      setTokens(res.data.accessToken, res.data.refreshToken)
      await getMe()
      return true
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      toast.add({
        title: 'Session expired',
        description: fetchError.data?.message || 'Please login again',
        color: 'error'
      })
      clearTokens()
      return false
    }
  }

  async function getMe(): Promise<boolean> {
    if (!accessToken.value) return false
    try {
      const res = await authService.getMe(accessToken.value)
      user.value = res.data
      if (import.meta.client) {
        localStorage.setItem('user', JSON.stringify(res.data))
      }
      return true
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      toast.add({
        title: 'Failed to fetch user',
        description: fetchError.data?.message || 'Something went wrong',
        color: 'error'
      })
      clearTokens()
      return false
    }
  }

  if (import.meta.client && accessToken.value) {
    const refreshInterval = setInterval(async () => {
      if (!isAuthenticated.value) {
        clearInterval(refreshInterval)
        return
      }
      await refreshAccessToken()
    }, 60 * 60 * 1000)

    watch(isAuthenticated, (val) => {
      if (!val) clearInterval(refreshInterval)
    })
  }

  if (import.meta.client && accessToken.value) {
    getMe()
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    login,
    google,
    logout,
    refreshAccessToken,
    getMe
  }
}
