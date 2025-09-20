export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const apiClient = $fetch.create({
    baseURL: config.public.apiUrl,
    credentials: 'include'
  })

  nuxtApp.provide('api', apiClient)
})
