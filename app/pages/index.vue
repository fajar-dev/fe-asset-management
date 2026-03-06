<script setup lang="ts">
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <HomeStats />

      <div class="grid gap-5 grid-cols-1 lg:grid-cols-3 mb-5">
        <HomeCategoryChart />
        <HomeCategoryPriceChart class="lg:col-span-2" />
      </div>

      <div class="grid gap-5 grid-cols-1 lg:grid-cols-3 mb-5">
        <HomeLocationChart />
        <HomeLocationPriceChart class="lg:col-span-2" />
      </div>

      <div class="grid gap-5 grid-cols-1 lg:grid-cols-3">
        <HomeSubCategoryChart />
        <HomeAgingChart />
        <HomeDataQualityChart />
      </div>
    </template>
  </UDashboardPanel>
</template>
