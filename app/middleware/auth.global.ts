export default defineNuxtRouteMiddleware((to) => {
  const cookie = useCookie('accessToken', { path: '/' })
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(to.path)

  if (!cookie.value && !isPublicRoute) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (cookie.value && to.path === '/login') {
    const redirect = (to.query.redirect as string) || '/'
    return navigateTo(redirect)
  }
})
