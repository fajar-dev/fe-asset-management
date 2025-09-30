<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useCategory } from '~/composables/useCategory'

const props = defineProps<{
  id: string | null
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'updated'): void
  (e: 'update:open', value: boolean): void
}>()

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  hasMaintenance: z.boolean().default(false),
  hasHolder: z.boolean().default(false)
})
type Schema = z.output<typeof schema>

const formData = reactive<Schema>({
  name: '',
  hasMaintenance: false,
  hasHolder: false
})

const saving = ref(false)
const loading = ref(false)

const { getCategoryById, updateCategory } = useCategory()

async function loadCategoryData() {
  if (!props.id) return

  loading.value = true
  try {
    const response = await getCategoryById(props.id)
    if (response?.data) {
      Object.assign(formData, {
        name: response.data.name,
        hasMaintenance: response.data.hasMaintenance,
        hasHolder: response.data.hasHolder
      })
    }
  } catch (error) {
    console.error('Failed to load category:', error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.id) {
      await loadCategoryData()
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

/** Reset form */
function resetForm() {
  Object.assign(formData, {
    name: '',
    hasMaintenance: false,
    hasHolder: false
  })
}

/** Submit */
async function onSubmit(_event: FormSubmitEvent<Schema>) {
  if (!props.id) return

  saving.value = true
  try {
    await updateCategory(props.id, { ...formData })
    emit('updated')
    emit('update:open', false)
    resetForm()
  } catch (error) {
    console.error('Failed to update category:', error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Edit Category"
    description="Update category details"
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
