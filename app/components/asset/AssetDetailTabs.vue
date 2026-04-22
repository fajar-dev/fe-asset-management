<template>
  <UDashboardToolbar class="flex items-center justify-between">
    <UNavigationMenu
      v-if="!loading && navigationItems.length > 0"
      :items="navigationItems"
      highlight
      orientation="horizontal"
      class="-mx-1 flex-1"
      :ui="{ label: 'hidden sm:inline' }"
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

const { t } = useI18n()
const router = useRouter()

// Read the last visited asset list URL (set by index.vue's loadAssets via useState)
const assetListUrl = useState('assetListUrl', () => '/asset')

function goBack() {
  router.push(assetListUrl.value)
}

const navigationItems = computed<NavigationMenuItem[][]>(() => {
  if (!props.assetDetail || !props.assetId) {
    return [[{ label: t('modal.asset.tabs.back'), icon: 'i-lucide-move-left', onClick: goBack }], []]
  }

  const category = props.assetDetail.subCategory.category

  const items: NavigationMenuItem[] = [
    {
      label: t('modal.asset.tabs.detail'),
      icon: 'i-lucide-notebook-tabs',
      to: `/asset/${props.assetId}/detail`,
      exact: true
    },
    {
      label: t('modal.asset.tabs.note'),
      icon: 'i-lucide-notebook-pen',
      to: `/asset/${props.assetId}/note`,
      exact: true
    }
  ]

  if (category.hasLocation) {
    items.push({
      label: t('modal.asset.tabs.location'),
      icon: 'i-lucide-map-pin',
      to: `/asset/${props.assetId}/location`
    })
  }

  if (category.hasHolder) {
    items.push({
      label: t('modal.asset.tabs.holder'),
      icon: 'i-lucide-users',
      to: `/asset/${props.assetId}/holder`
    })
  }

  if (category.hasMaintenance) {
    items.push({
      label: t('modal.asset.tabs.maintenance'),
      icon: 'i-lucide-calendar-cog',
      to: `/asset/${props.assetId}/maintenance`
    })
  }

  return [[
    {
      label: t('modal.asset.tabs.back'),
      icon: 'i-lucide-move-left',
      onClick: goBack
    }
  ], items]
})
</script>
