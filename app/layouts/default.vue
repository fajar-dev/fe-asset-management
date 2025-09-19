<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()

const open = ref(false)

const links = [[{
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'master data',
  icon: 'i-lucide-database',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: 'Category',
    to: '/master-data/category',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Sub Category',
    to: '/master-data/sub-category',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Location',
    to: '/master-data/location',
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: 'Asset',
  icon: 'i-lucide-library-big',
  to: '/asset',
  onSelect: () => {
    open.value = false
  }
}
// ,{
//   label: 'Label',
//   icon: 'i-lucide-tags',
//   to: '/label',
//   onSelect: () => {
//     open.value = false
//   }
// }
],
[{
  label: 'Feedback',
  icon: 'i-lucide-message-square-warning',
  to: '#',
  target: '_blank'
}
]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code'
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
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
      <!-- Header Logo -->
      <template #header="{ collapsed }">
        <div class="flex items-center justify-center py-4">
          <img
            v-if="!collapsed"
            src="/logo-nusanet.png"
            alt="Nusanet Logo"
            class="max-w-[120px]"
          >
          <img
            v-else
            src="/logo-n.png"
            alt="Nusanet Icon"
            class=""
          >
        </div>
      </template>

      <!-- Content -->
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

      <!-- Footer -->
      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />
    <slot />
  </UDashboardGroup>
</template>
