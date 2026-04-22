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
const { t, locale, setLocale } = useI18n()

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
      label: t('menu.appearance'),
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: t('menu.light'),
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect(e: Event) {
            e.preventDefault()
            colorMode.preference = 'light'
          }
        },
        {
          label: t('menu.dark'),
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onSelect(e: Event) {
            e.preventDefault()
            colorMode.preference = 'dark'
          }
        },
        {
          label: t('menu.system'),
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
      label: t('menu.language'),
      icon: 'i-lucide-languages',
      children: [
        {
          label: '🇺🇸 English',
          type: 'checkbox',
          checked: locale.value === 'en',
          onSelect(e: Event) {
            e.preventDefault()
            setLocale('en')
          }
        },
        {
          label: '🇮🇩 Bahasa Indonesia',
          type: 'checkbox',
          checked: locale.value === 'id',
          onSelect(e: Event) {
            e.preventDefault()
            setLocale('id')
          }
        }
      ]
    },
    {
      label: t('menu.myFeedback'),
      icon: 'i-lucide-message-square',
      to: '/my-feedback'
    },
    {
      label: t('menu.logout'),
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
