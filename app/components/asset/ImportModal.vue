<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAsset } from '~/composables/useAsset'

const schema = z.object({
  file: z.any().refine(file => file !== null && file !== undefined, {
    message: 'Asset image is required'
  })
})

type Schema = z.output<typeof schema>

const emit = defineEmits<{ (e: 'created'): void }>()
const open = defineModel<boolean>('open', { default: false })
const saving = ref(false)
const showResultModal = ref(false)
const importResult = ref<any | null>(null)

const state = reactive<Partial<Schema>>({
  file: null
})

const { importAsset } = useAsset()

function resetForm() {
  state.file = null
}

function downloadTemplate() {
  const link = document.createElement('a')
  link.href = '/templates/asset-import-template.xlsx'
  link.download = 'asset-import-template.xlsx'
  link.click()
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  if (!state.file) {
    return
  }

  open.value = false
  saving.value = true
  const formData = new FormData()
  formData.append('file', state.file)
  const result = await importAsset(formData)
  saving.value = false
  importResult.value = result
  showResultModal.value = true
  resetForm()
  emit('created')
}

function closeResultModal() {
  showResultModal.value = false
}

function handleCancel() {
  open.value = false
  resetForm()
}
</script>

<template>
  <div>
    <UButton
      label="Import"
      color="primary"
      variant="outline"
      icon="i-lucide-file-up"
      @click="open = true"
    />

    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="saving"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Importing assets...
          </p>
        </div>
      </div>
    </Transition>

    <UModal
      v-model:open="open"
      title="Import Assets"
      description="Import assets in bulk using an Excel file."
      :ui="{ content: 'max-w-sm' }"
    >
      <template #body>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField name="file">
            <UFileUpload
              v-model="state.file"
              label=""
              description="Drag and drop your files here or click to browse. (xlsx, xls)"
              class="w-full min-h-48"
              accept=".xlsx,.xls"
            />
          </UFormField>

          <div class="flex justify-between pt-4">
            <UButton
              label="Template"
              color="primary"
              variant="link"
              icon="i-lucide-file-text"
              @click="downloadTemplate"
            />
            <div class="flex gap-2">
              <UButton
                label="Cancel"
                color="neutral"
                variant="subtle"
                :disabled="saving"
                @click="handleCancel"
              />
              <UButton
                label="Save"
                color="primary"
                variant="solid"
                type="submit"
                :loading="saving"
              />
            </div>
          </div>
        </UForm>
      </template>
    </UModal>

    <UModal
      v-model:open="showResultModal"
      title="Import Result"
      :ui="{ content: 'max-w-2xl' }"
      :dismissible="false"
    >
      <template #body>
        <div v-if="importResult" class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Total
              </p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ importResult.total }}
              </p>
            </div>
            <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Success
              </p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ importResult.success }}
              </p>
            </div>
            <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Failed
              </p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ importResult.failed }}
              </p>
            </div>
          </div>
          <div v-if="importResult.failed > 0" class="space-y-2">
            <h3 class="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Failed Items:
            </h3>
            <div class="max-h-64 overflow-y-auto space-y-2">
              <div
                v-for="(item, index) in importResult.failedList"
                :key="index"
                class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ item.code }} - {{ item.name }}
                </p>
                <p class="text-xs text-red-600 dark:text-red-400 mt-1">
                  {{ item.error }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-4">
            <UButton
              label="Close"
              color="neutral"
              variant="subtle"
              @click="closeResultModal"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
