<script setup lang="ts">
import * as z from 'zod'
import { useAuth } from '~/composables/useAuth'
import type { FormSubmitEvent } from '@nuxt/ui'

const { login: authLogin, isAuthenticated } = useAuth()
const loading = ref(false)
const router = useRouter()

definePageMeta({
  layout: 'auth',
  auth: false
})

useSeoMeta({
  title: 'Login',
  description: 'Login to your account to continue'
})

// Redirect jika sudah login
watchEffect(() => {
  if (import.meta.client && isAuthenticated.value) {
    navigateTo('/')
  }
})

const fields = [
  {
    name: 'email',
    type: 'text' as const,
    label: 'Email',
    placeholder: 'Enter your email',
    required: true
  },
  {
    name: 'password',
    type: 'password' as const,
    label: 'Password',
    placeholder: 'Enter your password',
    required: true
  },
  {
    name: 'remember',
    type: 'checkbox' as const,
    label: 'Remember me'
  }
]

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required').min(8, 'Must be at least 8 characters'),
  remember: z.boolean().optional()
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true

  try {
    const success = await authLogin(payload.data.email, payload.data.password)

    if (success) {
      const intendedRoute = router.currentRoute.value.query.redirect as string
      if (intendedRoute) {
        await router.push(intendedRoute)
      } else {
        await router.push('/')
      }
    }
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center">
    <div class="flex flex-col items-center">
      <img
        src="https://mdn.nusa.net.id/wp-content/uploads/sites/2/2024/08/Nusanet-Logo-with-Subtitle-e1724455147320.png"
        alt="Company Logo"
        class="h-10 object-contain mb-8"
      >
    </div>

    <div class="w-full max-w-sm space-y-4">
      <!-- Auth Form -->
      <UAuthForm
        :fields="fields"
        :schema="schema"
        :loading="loading"
        class="w-full"
        @submit="onSubmit"
      />

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="text-gray-500 bg-muted px-2"> OR </span>
        </div>
      </div>

      <!-- Google Login -->
      <UButton
        variant="outline"
        class="w-full justify-center"
        size="lg"
        color="neutral"
      >
        <template #leading>
          <Icon name="logos:google-icon" class="w-5 h-5" />
        </template>
        Google
      </UButton>
    </div>
  </div>
</template>
