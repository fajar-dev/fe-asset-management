<template>
  <USkeleton v-if="loading" class="h-6 w-40 rounded" />
  <div v-else-if="assetDetail" class="flex flex-col">
    <span>{{ assetDetail.name }}</span>
    <span class="text-muted font-medium text-xs">{{ assetDetail.code }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  assetDetail?: any
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  assetDetail: null,
  loading: false
})
</script>
