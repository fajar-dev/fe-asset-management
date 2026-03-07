<script setup lang="ts">
import * as z from 'zod'
import { CalendarDate } from '@internationalized/date'
import { useAssetHolder } from '~/composables/useAssetHolder'
import { useEmployee } from '~/composables/useEmployee'

const props = defineProps<{
  assetId: string
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'created'): void }>()

// Validation schema
const schema = z.object({
  assignedAt: z.string().min(1, 'Assigned date is required'),
  employeeId: z.string().min(1, 'Employee is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  attachments: z.array(z.custom<File>((val) => val instanceof File, 'Must be a File')).optional()
})
type Schema = z.output<typeof schema>

const open = ref(false)
const saving = ref(false)

const state = reactive({
  assignedAt: '' as string,
  employeeId: '' as string,
  purpose: '' as string,
  attachments: [] as File[]
})

const assignedDateModel = ref<any>(null)

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

watch(assignedDateModel, (newDate) => {
  if (newDate) {
    state.assignedAt = calendarDateToString(newDate)
  } else {
    state.assignedAt = ''
  }
})

const { assignHolder } = useAssetHolder()
const { employees, fetchEmployees } = useEmployee()

const items = shallowRef<any[]>([])
const selectedEmployee = shallowRef<any>(null)

const canAddMoreImages = computed(() => !state.attachments || state.attachments.length < 3)

function resetForm() {
  state.assignedAt = ''
  assignedDateModel.value = null
  state.employeeId = ''
  state.purpose = ''
  state.attachments = []
  selectedEmployee.value = null
}

async function onSubmit(event: { data: Schema }) {
  saving.value = true
  await assignHolder(props.assetId, {
    purpose: event.data.purpose,
    assignedAt: event.data.assignedAt,
    employeeId: event.data.employeeId,
    attachments: event.data.attachments
  })
  resetForm()
  open.value = false
  emit('created')
  saving.value = false
}

async function openModal() {
  open.value = true
  await fetchEmployees()
  items.value = employees.value.map(e => ({
    label: `${e.employeeId} - ${e.fullName}`,
    value: e.employeeId,
    avatar: e.photoProfile ? { src: e.photoProfile, alt: e.fullName } : undefined
  }))
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Assign Asset Holder"
    description="Assign a new employee to this asset"
  >
    <UButton
      label="Assign Holder"
      icon="i-lucide-plus"
      :disabled="props.disabled"
      @click="openModal"
    />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Assigned Date" name="assignedAt" required>
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton
              icon="i-lucide-calendar"
              :label="assignedDateModel ? formatDateDisplay(assignedDateModel) : 'Select a date'"
              variant="subtle"
              color="neutral"
              class="w-full justify-start"
            />
            <template #content>
              <UCalendar v-model="assignedDateModel" class="p-2" />
            </template>
          </UPopover>
        </UFormField>

        <UFormField label="Employee" name="employeeId" required>
          <UInputMenu
            v-model="selectedEmployee"
            class="w-full"
            :items="items"
            placeholder="Select employee"
            @update:model-value="val => state.employeeId = val?.value ?? ''"
          />
        </UFormField>

        <UFormField label="Purpose" name="purpose">
          <UTextarea
            v-model="state.purpose"
            placeholder="Enter purpose"
            class="w-full"
            :rows="3"
          />
        </UFormField>

        <UFormField name="attachments" label="Attachments (Max 3)">
          <UFileUpload
            v-model="state.attachments"
            layout="grid"
            multiple
            :interactive="false"
            class="w-full min-h-25"
          >
            <template #actions="{ open }">
              <UButton
                label="Select attachments"
                icon="i-lucide-upload"
                color="neutral"
                variant="outline"
                :disabled="!canAddMoreImages"
                @click="open()"
              />
            </template>
            <template #files-top="{ open, files }">
              <div v-if="files?.length" class="mb-2 flex items-center justify-between">
                <p class="font-bold">
                  Attachments ({{ files.length }})
                </p>
                <UButton
                  icon="i-lucide-plus"
                  label="Add more"
                  color="neutral"
                  variant="outline"
                  :disabled="!canAddMoreImages"
                  @click="open()"
                />
              </div>
            </template>
          </UFileUpload>
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
