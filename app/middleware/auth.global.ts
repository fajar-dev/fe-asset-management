export default defineNuxtRouteMiddleware((to) => {
  const cookie = useCookie('accessToken')
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(to.path)

  if (!cookie.value && !isPublicRoute) {
    return navigateTo('/login')
  }

  if (cookie.value && to.path === '/login') {
    return navigateTo('/')
  }
})
