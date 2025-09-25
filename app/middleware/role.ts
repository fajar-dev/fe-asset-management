import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth()
  const requiredRole = to.meta.role as 'admin' | 'user' | undefined

  if (requiredRole) {
    if (!user.value || user.value.role !== requiredRole) {
      return navigateTo('/unauthorized')
    }
  }
})
