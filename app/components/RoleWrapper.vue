<template>
  <slot v-if="hasRole"></slot>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

interface Props {
  role: 'admin' | 'user'
}
const props = defineProps<Props>()
const { user } = useAuth()
const hasRole = computed(() => user.value?.role === props.role)
</script>
