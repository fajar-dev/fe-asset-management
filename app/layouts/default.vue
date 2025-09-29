<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { ref, reactive, computed } from 'vue'

const toast = useToast()

const open = ref(false)

const isFeedbackOpen = ref(false)

const feedbackState = reactive({
  type: 'keluhan',
  description: '',
  images: [] as File[]
})

const links = [[
  {
    label: 'Home',
    icon: 'i-lucide-house',
    to: '/',
    onSelect: () => (open.value = false)
  },
  {
    label: 'master data',
    icon: 'i-lucide-database',
    defaultOpen: true,
    type: 'trigger',
    children: [
      { label: 'Category', to: '/master-data/category', onSelect: () => (open.value = false) },
      { label: 'Sub Category', to: '/master-data/sub-category', onSelect: () => (open.value = false) },
      { label: 'Location', to: '/master-data/location', onSelect: () => (open.value = false) }
    ]
  },
  {
    label: 'Asset',
    icon: 'i-lucide-library-big',
    to: '/asset',
    onSelect: () => (open.value = false)
  }
], [
  {
    label: 'Feedback',
    icon: 'i-lucide-message-square-warning',
    onSelect: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const targetEl = document.documentElement

      const colorMode = useColorMode()
      const bgColor = colorMode.value === 'dark' ? 'black' : 'white'
      const { domToJpeg } = await import('modern-screenshot')
      const dataUrl = await domToJpeg(targetEl, {
        quality: 0.95,
        scale: 1,
        backgroundColor: bgColor,
        width: window.innerWidth,
        height: window.innerHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: `${window.innerWidth}px`,
          height: `${window.innerHeight}px`
        }
      })

      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const screenshotFile = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' })
      feedbackState.images = [screenshotFile]
      isFeedbackOpen.value = true
    }
  }
]] satisfies NavigationMenuItem[][]

const groups = computed(() => [
  { id: 'links', label: 'Go to', items: links.flat() },
  { id: 'code', label: 'Code' }
])

onMounted(() => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') return

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => { cookie.value = 'accepted' }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center justify-center py-4">
          <img
            v-if="!collapsed"
            src="/logo-nusanet.png"
            alt="Nusanet Logo"
            class="max-w-[120px]"
          >
          <img v-else src="/logo-n.png" alt="Nusanet Icon">
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />
    <slot />
  </UDashboardGroup>

  <FeedbackModal v-model:open="isFeedbackOpen" :form-state="feedbackState" />
</template>
