<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAssetStatus } from '~/composables/useAssetStatus'
import { assetStatusSchema as schema, type AssetStatusSchema as Schema } from '~/schemas/statusSchema'

const props = defineProps<{
  assetId: string
  currentStatus?: string
}>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const { t } = useI18n()
const open = defineModel<boolean>()
const { updateAssetStatus, loading } = useAssetStatus()


const state = reactive({
  type: undefined as any,
  note: '',
  isTransferred: false,
  attachments: [] as File[]
})

const canAddMoreImages = computed(() => !state.attachments || state.attachments.length < 3)

watch(open, (isOpen) => {
  if (isOpen) {
    state.type = props.currentStatus || 'active'
    state.note = ''
    state.isTransferred = false
    state.attachments = []
  }
})

const statusOptions = computed(() => [
  { label: t('modal.asset.status.active'), value: 'active', icon: 'i-lucide-check-circle', color: 'text-green-500' },
  { label: t('modal.asset.status.inactive'), value: 'inactive', icon: 'i-lucide-x-circle', color: 'text-red-500' }
])

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await updateAssetStatus(props.assetId, event.data)
    open.value = false
    emit('updated')
  } catch (error) {
    // Error is handled in composable
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('modal.asset.status.title')"
    :description="t('modal.asset.status.subtitle')"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="t('common.status')" name="type" required>
          <USelectMenu
            v-model="state.type"
            :items="statusOptions"
            value-key="value"
            label-key="label"
            :placeholder="t('modal.asset.status.selectStatus')"
            class="w-full"
          >
            <template #item="{ item }">
              <div class="flex items-center gap-2">
                <UIcon :name="item.icon" :class="item.color" class="w-4 h-4" />
                <span>{{ item.label }}</span>
              </div>
            </template>
          </USelectMenu>
        </UFormField>

        <UFormField :label="t('common.note')" name="note">
          <UTextarea
            v-model="state.note"
            class="w-full"
            :placeholder="t('modal.asset.status.notePlaceholder')"
          />
        </UFormField>

        <UFormField name="isTransferred">
          <UCheckbox
            v-model="state.isTransferred"
            :label="t('modal.asset.status.isTransferred')"
          />
        </UFormField>

        <UFormField name="attachments" :label="t('modal.asset.status.attachments')">
          <UFileUpload
            v-model="state.attachments"
            layout="grid"
            multiple
            :interactive="false"
            class="w-full min-h-25"
          >
            <template #actions="{ open }">
              <UButton
                :label="t('modal.asset.status.selectAttachments')"
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
                  {{ t('modal.asset.status.attachments') }} ({{ files.length }})
                </p>
                <UButton
                  icon="i-lucide-plus"
                  :label="t('modal.asset.status.addMore')"
                  color="neutral"
                  variant="outline"
                  :disabled="!canAddMoreImages"
                  @click="open()"
                />
              </div>
            </template>
          </UFileUpload>
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            :label="t('modal.asset.status.cancel')"
            color="neutral"
            variant="subtle"
            :disabled="loading"
            @click="open = false"
          />
          <UButton
            :label="t('modal.asset.status.update')"
            color="primary"
            variant="solid"
            type="submit"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
