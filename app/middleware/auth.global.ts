export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { isAuthenticated } = useAuth()

  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(to.path)

  if (!isAuthenticated.value && !isPublicRoute) {
    return window.location.replace('/login')
  }

  if (isAuthenticated.value && to.path === '/login') {
    return window.location.replace('/')
  }
})
