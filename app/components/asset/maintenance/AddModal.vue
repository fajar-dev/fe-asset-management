<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAssetMaintenance } from '~/composables/useAssetMaintenance'
import { maintenanceSchema, type MaintenanceSchema } from '~/schemas/maintenanceSchema'
import { formatCalendarDate, calendarDateToISOString } from '~/utils/date'

const props = defineProps<{ assetId: string }>()
const emit = defineEmits<{ (e: 'created'): void }>()

const schema = maintenanceSchema
type Schema = MaintenanceSchema

const open = ref(false)
const saving = ref(false)

const state = reactive<Partial<Schema>>({
  maintenanceAt: '',
  note: ''
})

const maintenanceDateModel = ref<any>(null)

watch(maintenanceDateModel, (newDate) => {
  state.maintenanceAt = newDate ? calendarDateToISOString(newDate) : ''
})

const { createMaintenance } = useAssetMaintenance()

function resetForm() {
  state.maintenanceAt = ''
  maintenanceDateModel.value = null
  state.note = ''
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await createMaintenance(props.assetId, {
    maintenanceAt: event.data.maintenanceAt,
    note: event.data.note || ''
  })
  resetForm()
  open.value = false
  emit('created')
  saving.value = false
}
</script>

<template>
  <UModal v-model:open="open" title="New Maintenance" description="Add a new maintenance record">
    <UButton label="Add Maintenance" icon="i-lucide-plus" :ui="{ label: 'hidden sm:inline-block' }" @click="open = true" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Date" name="maintenanceAt" required>
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton
              icon="i-lucide-calendar"
              :label="formatCalendarDate(maintenanceDateModel)"
              variant="subtle"
              color="neutral"
              class="w-full justify-start"
            />
            <template #content>
              <UCalendar v-model="maintenanceDateModel" class="p-2" />
            </template>
          </UPopover>
        </UFormField>

        <UFormField label="Note" name="note" required>
          <UTextarea
            v-model="state.note"
            placeholder="Note"
            class="w-full"
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
            label="Save"
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
