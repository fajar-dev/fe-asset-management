export default defineNuxtRouteMiddleware((to) => {
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(to.path)

  // Jangan akses localStorage di server
  if (import.meta.server) return

  const token = localStorage.getItem('accessToken')

  if (!token && !isPublicRoute) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  if (token && to.path === '/login') {
    const redirect = (to.query.redirect as string) || '/'
    return navigateTo(redirect)
  }
})
