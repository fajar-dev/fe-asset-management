<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate } from '@internationalized/date'
import { useAssetMaintenance } from '~/composables/useAssetMaintenance'

const props = defineProps<{
  assetId: string
  maintenanceId: string | null
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'updated'): void
  (e: 'update:open', value: boolean): void
}>()

// Validasi schema
const schema = z.object({
  maintenanceAt: z.string().min(1, 'Date is required'),
  note: z.string().min(1, 'Note is required')
})
type Schema = z.output<typeof schema>

const formData = reactive<Schema>({
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
    formData.maintenanceAt = calendarDateToString(newDate)
  } else {
    formData.maintenanceAt = ''
  }
})

const saving = ref(false)
const loading = ref(false)

const { getMaintenanceById, updateMaintenance } = useAssetMaintenance()

/** Load existing maintenance data */
async function loadMaintenanceData() {
  if (!props.assetId || !props.maintenanceId) return

  loading.value = true
  try {
    const response = await getMaintenanceById(props.assetId, props.maintenanceId)
    if (response?.data) {
      const dateStr = response.data.maintenanceAt?.split('T')[0] || ''
      Object.assign(formData, {
        maintenanceAt: dateStr,
        note: response.data.note || ''
      })
      
      if (dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number)
        if (year && month && day) {
          maintenanceDateModel.value = new CalendarDate(year, month, day)
        }
      }
    }
  } catch (error) {
    console.error('Failed to load maintenance:', error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.maintenanceId) {
      await loadMaintenanceData()
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

/** Reset form */
function resetForm() {
  Object.assign(formData, {
    maintenanceAt: '',
    note: ''
  })
  maintenanceDateModel.value = null
}

/** Submit */
async function onSubmit(_event: FormSubmitEvent<Schema>) {
  if (!props.assetId || !props.maintenanceId) return

  saving.value = true
  try {
    await updateMaintenance(props.assetId, props.maintenanceId, { ...formData })
    emit('updated')
    emit('update:open', false)
    resetForm()
  } catch (error) {
    console.error('Failed to update maintenance:', error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Edit Maintenance"
    description="Update maintenance details"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formData"
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
            v-model="formData.note"
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
            @click="emit('update:open', false)"
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
