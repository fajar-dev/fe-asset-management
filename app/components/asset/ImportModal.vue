<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useCategory } from '~/composables/useCategory'

const schema = z.object({
  file: z.any().refine(file => file !== null && file !== undefined, {
    message: 'Asset image is required'
  })
})

type Schema = z.output<typeof schema>

const emit = defineEmits<{ (e: 'created'): void }>()
const open = ref(false)
const saving = ref(false)

const state = reactive<Partial<Schema>>({
  file: File
})

const { createCategory } = useCategory()

function resetForm() {
//   file: ''
}

function downloadTemplate() {
  const link = document.createElement('a')
  link.href = '/templates/asset-import-template.xlsx' // sesuaikan path template-mu
  link.download = 'asset-import-template.xlsx'
  link.click()
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  resetForm()
  open.value = false
  emit('created')
  saving.value = false
}
</script>

<template>
  <UModal
    title="Import Assets"
    description="Import assets in bulk using an Excel file."
    :close="true"
    :ui="{ content: 'max-w-sm' }"
  >
    <UButton
      label="Import"
      color="primary"
      variant="outline"
      icon="i-lucide-file-up"
    />
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <!-- Name -->
        <UFormField name="file">
          <UFileUpload
            label=""
            description="Drag and drop your files here or click to browse. (xlsx, xls)"
            class="w-full min-h-48"
          />
        </UFormField>

        <!-- Action Buttons -->
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
        </div>
      </UForm>
    </template>
  </UModal>
</template>
