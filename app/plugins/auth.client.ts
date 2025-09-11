export default defineNuxtPlugin(() => {
  const { accessToken, refreshToken } = useAuth()

  // Force refresh state dari localStorage
  if (!accessToken.value) {
    const savedAccess = localStorage.getItem('accessToken')
    const savedRefresh = localStorage.getItem('refreshToken')

    if (savedAccess) {
      accessToken.value = savedAccess
    }
    if (savedRefresh) {
      refreshToken.value = savedRefresh
    }
  }
})
