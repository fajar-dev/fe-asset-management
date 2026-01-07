<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate } from '@internationalized/date'
import { useAssetMaintenance } from '~/composables/useAssetMaintenance'

const props = defineProps<{ assetId: string }>()
const emit = defineEmits<{ (e: 'created'): void }>()

// Schema validasi
const schema = z.object({
  maintenanceAt: z.string().min(1, 'Date is required'),
  note: z.string().min(1, 'Note is required')
})

type Schema = z.output<typeof schema>

const open = ref(false)
const saving = ref(false)

const state = reactive<Partial<Schema>>({
  maintenanceAt: '',
  note: ''
})

const maintenanceDateModel = ref<any>(null)

function formatDateDisplay(date: any): string {
  if (!date) return 'Select a date'
  
  const day = String(date.day).padStart(2, '0')
  const month = String(date.month).padStart(2, '0')
  const year = date.year
  
  return `${day}/${month}/${year}`
}

function calendarDateToString(date: any): string {
  const year = date.year
  const month = String(date.month).padStart(2, '0')
  const day = String(date.day).padStart(2, '0')
  return `${year}-${month}-${day}`
}

watch(maintenanceDateModel, (newDate) => {
  if (newDate) {
    state.maintenanceAt = calendarDateToString(newDate)
  } else {
    state.maintenanceAt = ''
  }
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
    <UButton label="Add Maintenance" icon="i-lucide-plus" />

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
              :label="maintenanceDateModel ? formatDateDisplay(maintenanceDateModel) : 'Select a date'"
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
