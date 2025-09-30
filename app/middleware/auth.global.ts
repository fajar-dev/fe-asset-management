export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()

  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(to.path)

  if (!isAuthenticated.value && !isPublicRoute) {
    return navigateTo('/login')
  }

  if (isAuthenticated.value && to.path === '/login') {
    return navigateTo('/')
  }
})
