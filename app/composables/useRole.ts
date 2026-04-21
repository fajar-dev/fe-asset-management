import { computed } from 'vue'
import { useAuth } from './useAuth'

export function useRole() {
  const { user } = useAuth()

  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser = computed(() => user.value?.role === 'user')

  return { isAdmin, isUser }
}
