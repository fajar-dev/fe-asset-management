<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { ref, reactive, watch } from 'vue'
import { useLocation } from '~/composables/useLocation'
import { useAssetLocation } from '~/composables/useAssetLocation'

const props = defineProps<{ assetId: string }>()
const emit = defineEmits<{ (e: 'created'): void }>()

const schema = z.object({
  locationId: z.string().min(1, 'Location is required')
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  locationId: undefined
})
const value = ref<string | undefined>(undefined)
const items = ref<{ id: string, name: string }[]>([])

const open = ref(false)
const saving = ref(false)

const { locations: allLocations, getAllLocations } = useLocation()
const { createLocation } = useAssetLocation()

watch(value, (v) => {
  state.locationId = v
})

async function openModal() {
  open.value = true
  await getAllLocations()
  items.value = allLocations.value.map(l => ({ id: l.id, name: l.name + ' - ' + l.branch.name }))
}

function resetForm() {
  state.locationId = undefined
  value.value = undefined
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  event.preventDefault()
  if (!props.assetId || !state.locationId) return

  saving.value = true
  try {
    await createLocation(props.assetId, { locationId: state.locationId })
    resetForm()
    open.value = false
    emit('created')
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UButton label="Relocate Asset" icon="i-lucide-move" @click="openModal" />

  <UModal v-model:open="open" title="Relocate Asset" description="Assign a new location to this asset">
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="New Location" name="locationId">
          <UInputMenu
            v-model="value"
            class="w-full"
            value-key="id"
            label-key="name"
            :items="items"
            placeholder="Select new location"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            label="Relocate"
            color="primary"
            variant="solid"
            type="submit"
            :loading="saving"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
