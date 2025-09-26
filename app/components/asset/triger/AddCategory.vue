<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { reactive, ref, watch } from 'vue'
import { useCategory } from '~/composables/useCategory'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'updated'): void
  (e: 'update:open', value: boolean): void
}>()

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  hasLocation: z.boolean().default(false),
  hasMaintenance: z.boolean().default(false),
  hasHolder: z.boolean().default(false)
})
type Schema = z.output<typeof schema>

const formData = reactive<Schema>({
  name: '',
  hasLocation: false,
  hasMaintenance: false,
  hasHolder: false
})

const saving = ref(false)

const { createCategory } = useCategory()

/** Reset form */
function resetForm() {
  Object.assign(formData, {
    name: '',
    hasLocation: false,
    hasMaintenance: false,
    hasHolder: false
  })
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) resetForm()
  }
)

/** Submit */
async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await createCategory({ ...formData })
    emit('updated')
    emit('update:open', false)
    resetForm()
  } catch (error) {
    console.error('Failed to create category:', error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Add Category"
    description="Create new category"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formData"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name" required>
          <UInput
            v-model="formData.name"
            class="w-full"
            placeholder="Category name"
          />
        </UFormField>

        <UFormField name="hasLocation">
          <USwitch v-model="formData.hasLocation" label="Has Location" />
        </UFormField>

        <UFormField name="hasMaintenance">
          <USwitch v-model="formData.hasMaintenance" label="Has Maintenance" />
        </UFormField>

        <UFormField name="hasHolder">
          <USwitch v-model="formData.hasHolder" label="Has Holder" />
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
