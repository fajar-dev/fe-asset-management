<template>
  <UDashboardToolbar class="flex items-center justify-between">
    <UNavigationMenu
      v-if="!loading && navigationItems.length > 0"
      :items="navigationItems"
      highlight
      orientation="horizontal"
      class="-mx-1 flex-1"
    />
    <div v-else-if="loading" class="flex gap-2 ml-auto">
      <USkeleton class="h-8 w-24 rounded" />
      <USkeleton class="h-8 w-24 rounded" />
      <USkeleton class="h-8 w-24 rounded" />
    </div>
  </UDashboardToolbar>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

interface Props {
  assetId?: string
  assetDetail?: any
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  assetId: '',
  assetDetail: null,
  loading: false
})

const navigationItems = computed<NavigationMenuItem[][]>(() => {
  if (!props.assetDetail || !props.assetId) {
    return [[{ label: 'Back', icon: 'i-lucide-move-left', to: '/asset' }], []]
  }

  const category = props.assetDetail.subCategory.category

  const items: NavigationMenuItem[] = [
    {
      label: 'Detail',
      icon: 'i-lucide-notebook-tabs',
      to: `/asset/${props.assetId}/detail`,
      exact: true
    }
  ]

  if (category.hasLocation) {
    items.push({
      label: 'Location',
      icon: 'i-lucide-map-pin',
      to: `/asset/${props.assetId}/location`
    })
  }

  if (category.hasHolder) {
    items.push({
      label: 'Holder',
      icon: 'i-lucide-users',
      to: `/asset/${props.assetId}/holder`
    })
  }

  if (category.hasMaintenance) {
    items.push({
      label: 'Maintenance',
      icon: 'i-lucide-calendar-cog',
      to: `/asset/${props.assetId}/maintenance`
    })
  }

  return [[
    {
      label: 'Back',
      icon: 'i-lucide-move-left',
      to: '/asset'
    }
  ], items]
})
</script>
