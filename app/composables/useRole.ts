import { computed } from 'vue'
import { useAuth } from './useAuth'

export const useRole = () => {
  const { user } = useAuth()

  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser = computed(() => user.value?.role === 'user')

  return { isAdmin, isUser }
}
