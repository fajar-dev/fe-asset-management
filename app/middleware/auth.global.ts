export default defineNuxtRouteMiddleware((to) => {
  const publicRoutes = ['/login']
  if (publicRoutes.includes(to.path)) return

  if (import.meta.server) return

  const token = localStorage.getItem('accessToken')

  if (!token) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
