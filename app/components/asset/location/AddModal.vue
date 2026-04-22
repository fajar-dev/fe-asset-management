<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { ref, reactive, watch } from 'vue'
import { useLocation } from '~/composables/useLocation'
import { useAssetLocation } from '~/composables/useAssetLocation'
import { assetLocationSelectSchema as schema, type AssetLocationSelectSchema as Schema } from '~/schemas/importSchema'

const { t } = useI18n()
const props = defineProps<{ assetId: string }>()
const emit = defineEmits<{ (e: 'created'): void }>()

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
  <UButton :label="t('modal.asset.location.title')" icon="i-lucide-move" :ui="{ label: 'hidden sm:inline-block' }" @click="openModal" />

  <UModal v-model:open="open" :title="t('modal.asset.location.title')" :description="t('modal.asset.location.subtitle')">
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="t('modal.asset.location.newLocation')" name="locationId" required>
          <UInputMenu
            v-model="value"
            class="w-full"
            value-key="id"
            label-key="name"
            :items="items"
            :placeholder="t('modal.asset.location.selectLocation')"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            :label="t('modal.asset.location.cancel')"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            :label="t('modal.asset.location.relocate')"
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
