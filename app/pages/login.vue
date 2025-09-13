<script setup lang="ts">
import * as z from 'zod'
import { useAuth } from '~/composables/useAuth'
import type { FormSubmitEvent } from '@nuxt/ui'

const { login, isAuthenticated } = useAuth()
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
    const success = await login(payload.data.email, payload.data.password)

    if (success) {
      await router.push('/')

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
  <UAuthForm
    :fields="fields"
    :schema="schema"
    :loading="loading"
    title="Welcome back"
    icon="i-lucide-lock"
    @submit="onSubmit"
  >
    <template #description>
      Don't have an account?
    </template>
  </UAuthForm>
</template>
