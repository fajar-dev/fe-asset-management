import { defineNuxtPlugin } from '#app'
import vue3GoogleSignin from 'vue3-google-signin'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(vue3GoogleSignin, {
    clientId: useRuntimeConfig().public.googleClientId
  })
})
