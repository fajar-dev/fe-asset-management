<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAssetHolder } from '~/composables/useAssetHolder'
import { returnHolderSchema, type ReturnHolderSchema } from '~/schemas/holderSchema'
import { formatCalendarDate, calendarDateToISOString } from '~/utils/date'

const props = defineProps<{
  assetId: string
  holderId: string
}>()

const emit = defineEmits<{ (e: 'returned'): void }>()

const schema = returnHolderSchema
type Schema = ReturnHolderSchema

const { t } = useI18n()
const open = ref(false)
const saving = ref(false)

const state = reactive<Partial<Schema>>({
  returnedAt: '',
  attachments: []
})

const returnedDateModel = ref<any>(null)

watch(returnedDateModel, (newDate) => {
  state.returnedAt = newDate ? calendarDateToISOString(newDate) : ''
})

const { returnHolder } = useAssetHolder()

const canAddMoreImages = computed(() => !state.attachments || state.attachments.length < 3)

function resetForm() {
  state.returnedAt = ''
  state.attachments = []
  returnedDateModel.value = null
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await returnHolder(props.assetId, props.holderId, {
    returnedAt: event.data.returnedAt!,
    attachments: event.data.attachments
  })
  resetForm()
  open.value = false
  emit('returned')
  saving.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('modal.asset.holder.returnTitle')"
    :description="t('modal.asset.holder.returnSubtitle')"
  >
    <UButton
      :label="t('modal.asset.holder.returnTitle')"
      icon="i-lucide-rotate-ccw"
      size="xs"
      color="primary"
    />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="t('modal.asset.holder.returnedAt')" name="returnedAt" required>
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton
              icon="i-lucide-calendar"
              :label="formatCalendarDate(returnedDateModel)"
              variant="subtle"
              color="neutral"
              class="w-full justify-start"
            />
            <template #content>
              <UCalendar v-model="returnedDateModel" class="p-2" />
            </template>
          </UPopover>
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
