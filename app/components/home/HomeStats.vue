<script setup lang="ts">
import { useStatistic } from '~/composables/useStatistic'

const { count, loading, getCount } = useStatistic()

await getCount()

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

const stats = computed(() => {
  if (!count.value) return []

  return [
    {
      title: 'Assets',
      icon: 'i-lucide-box',
      value: formatNumber(count.value.assets),
      to: '/asset'
    },
    {
      title: 'Categories',
      icon: 'i-lucide-layers',
      value: formatNumber(count.value.categories),
      to: '/setting/category'
    },
    {
      title: 'Sub Categories',
      icon: 'i-lucide-list',
      value: formatNumber(count.value.subCategories),
      to: '/setting/sub-category'
    },
    {
      title: 'Locations',
      icon: 'i-lucide-map-pin',
      value: formatNumber(count.value.locations),
      to: '/setting/location'
    }
  ]
})
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <template v-if="loading">
      <UPageCard
        v-for="i in 4"
        :key="i"
        variant="subtle"
        class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
      >
        <div class="flex flex-col gap-3">
          <USkeleton class="h-6 w-20" />
          <USkeleton class="h-8 w-16" />
        </div>
      </UPageCard>
    </template>

    <template v-else>
      <UPageCard
        v-for="(stat, index) in stats"
        :key="index"
        :icon="stat.icon"
        :title="stat.title"
        variant="subtle"
        as="NuxtLink"
        :to="stat.to"
        class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1 hover:bg-muted/50 cursor-pointer transition-colors"
        :ui="{
          container: 'gap-y-1.5',
          wrapper: 'items-start',
          leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
          title: 'font-normal text-muted text-xs uppercase'
        }"
      >
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>
      </UPageCard>
    </template>
  </UPageGrid>
</template>
