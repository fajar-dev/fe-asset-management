<script setup lang="ts">
import { useAssetHolder } from '~/composables/useAssetHolder'
import { useEmployee } from '~/composables/useEmployee'
import { assignHolderSchema, type AssignHolderSchema } from '~/schemas/holderSchema'
import { formatCalendarDate, calendarDateToISOString } from '~/utils/date'

const props = defineProps<{
  assetId: string
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'created'): void }>()

const schema = assignHolderSchema
type Schema = AssignHolderSchema

const { t } = useI18n()
const open = ref(false)
const saving = ref(false)

const state = reactive({
  assignedAt: '' as string,
  employeeId: '' as string,
  purpose: '' as string,
  attachments: [] as File[]
})

const assignedDateModel = ref<any>(null)

watch(assignedDateModel, (newDate) => {
  state.assignedAt = newDate ? calendarDateToISOString(newDate) : ''
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
    :title="t('modal.asset.holder.assignTitle')"
    :description="t('modal.asset.holder.assignSubtitle')"
  >
    <UButton
      :label="t('modal.asset.holder.assignTitle')"
      icon="i-lucide-plus"
      :disabled="props.disabled"
      :ui="{ label: 'hidden sm:inline-block' }"
      @click="openModal"
    />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="t('modal.asset.holder.assignedDate')" name="assignedAt" required>
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton
              icon="i-lucide-calendar"
              :label="formatCalendarDate(assignedDateModel)"
              variant="subtle"
              color="neutral"
              class="w-full justify-start"
            />
            <template #content>
              <UCalendar v-model="assignedDateModel" class="p-2" />
            </template>
          </UPopover>
        </UFormField>

        <UFormField :label="t('modal.asset.holder.employee')" name="employeeId" required>
          <UInputMenu
            v-model="selectedEmployee"
            class="w-full"
            :items="items"
            :placeholder="t('modal.asset.holder.selectEmployee')"
            @update:model-value="val => state.employeeId = val?.value ?? ''"
          />
        </UFormField>

        <UFormField :label="t('modal.asset.holder.purpose')" name="purpose">
          <UTextarea
            v-model="state.purpose"
            :placeholder="t('modal.asset.holder.purposePlaceholder')"
            class="w-full"
            :rows="3"
          />
        </UFormField>

        <UFormField name="attachments" :label="t('modal.asset.holder.attachments')">
          <UFileUpload
            v-model="state.attachments"
            layout="grid"
            multiple
            :interactive="false"
            class="w-full min-h-25"
          >
            <template #actions="{ open }">
              <UButton
                :label="t('modal.asset.holder.selectAttachments')"
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
                  {{ t('modal.asset.holder.attachments') }} ({{ files.length }})
                </p>
                <UButton
                  icon="i-lucide-plus"
                  :label="t('modal.asset.holder.addMore')"
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
            :label="t('modal.asset.holder.cancel')"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            :label="t('modal.asset.holder.save')"
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
