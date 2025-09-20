// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-vue3-google-signin',
    'nuxt-charts',
    '@vite-pwa/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      googleClientId: process.env.NUXT_GOOGLE_CLIENT_ID,
      apiUrl: process.env.NUXT_PUBLIC_API_BASE
    }
  },

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  compatibilityDate: '2024-07-11',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'SIM-ASSET - Nusanet',
      short_name: 'SIM-ASSET',
      description: 'PT. Media Antar Nusa',
      lang: 'en',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#00C16A',
      icons: [
        {
          src: '/icons/icon_64x64.png',
          sizes: '64x64',
          type: 'image/png'
        },
        {
          src: '/icons/icon_144x144.png',
          sizes: '144x144',
          type: 'image/png'
        },
        {
          src: '/icons/icon_192x192.png',
          sizes: '192x192',
          type: 'image/png'
        }
      ]
    }
  }
})
