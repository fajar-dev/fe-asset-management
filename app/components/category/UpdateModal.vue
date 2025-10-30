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
        hasLocation: response.data.hasLocation,
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

function resetForm() {
  Object.assign(formData, {
    name: '',
    hasLocation: false,
    hasMaintenance: false,
    hasHolder: false
  })
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  if (!props.id) return

  saving.value = true
  await updateCategory(props.id, { ...formData })
  emit('updated')
  emit('update:open', false)
  resetForm()
  saving.value = false
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
        <!-- Name -->
        <UFormField label="Name" name="name" required>
          <UInput
            v-model="formData.name"
            class="w-full"
            placeholder="Category name"
          />
        </UFormField>

        <!-- Has Location -->
        <UFormField name="hasLocation">
          <div class="flex items-center gap-2">
            <USwitch v-model="formData.hasLocation" label="Has Location" />
            <UTooltip text="Enable if this category involves asset locations" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <!-- Has Maintenance -->
        <UFormField name="hasMaintenance">
          <div class="flex items-center gap-2">
            <USwitch v-model="formData.hasMaintenance" label="Has Maintenance" />
            <UTooltip text="Enable if this category requires maintenance tracking" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <!-- Has Holder -->
        <UFormField name="hasHolder">
          <div class="flex items-center gap-2">
            <USwitch v-model="formData.hasHolder" label="Has Holder" />
            <UTooltip text="Enable if this category is assigned to a person or holder" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <!-- Action Buttons -->
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
