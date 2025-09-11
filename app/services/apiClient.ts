const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:4000/api'

export const apiClient = $fetch.create({
  baseURL: apiBase,
  credentials: 'include'
})
