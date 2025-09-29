<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useAuth } from '~/composables/useAuth'

defineProps<{
  collapsed?: boolean
}>()

const { logout, user: authUser } = useAuth()
const colorMode = useColorMode()
const router = useRouter()
const toast = useToast()

const currentUser = computed(() => {
  if (!authUser.value) {
    return {
      name: 'Guest',
      email: 'guest@example.com',
      avatar: {
        src: 'https://github.com/benjamincanac.png',
        alt: 'Guest'
      }
    }
  }
  return {
    name: authUser.value.name,
    email: authUser.value.email,
    avatar: {
      src: authUser.value.avatar || 'https://github.com/benjamincanac.png',
      alt: authUser.value.name
    }
  }
})

async function handleLogout() {
  try {
    logout()
    toast.add({
      title: 'Success',
      description: 'Logged out successfully'
    })
    await router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to logout',
      color: 'error'
    })
  }
}
const items = computed<DropdownMenuItem[][]>(() => ([
  [
    {
      type: 'label',
      label: currentUser.value.name,
      avatar: currentUser.value.avatar
    }
  ],
  [
    {
      label: 'Appearance',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'Light',
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect(e: Event) {
            e.preventDefault()
            colorMode.preference = 'light'
          }
        },
        {
          label: 'Dark',
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onSelect(e: Event) {
            e.preventDefault()
            colorMode.preference = 'dark'
          }
        },
        {
          label: 'System',
          icon: 'i-lucide-monitor',
          type: 'checkbox',
          checked: colorMode.value === 'system',
          onSelect(e: Event) {
            e.preventDefault()
            colorMode.preference = 'system'
          }
        }
      ]
    },
    {
      label: 'Log out',
      icon: 'i-lucide-log-out',
      onSelect: handleLogout
    }
  ]
]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :label="collapsed ? undefined : currentUser.name"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      :avatar="currentUser.avatar"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />
  </UDropdownMenu>
</template>
