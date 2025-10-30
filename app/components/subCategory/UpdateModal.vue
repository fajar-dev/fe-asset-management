<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSubCategory } from '~/composables/useSubCategory'
import { useCategory } from '~/composables/useCategory'

const props = defineProps<{
  id: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated'): void
}>()

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required')
})

type Schema = z.output<typeof schema>

const saving = ref(false)
const state = reactive<Partial<Schema>>({
  name: '',
  categoryId: ''
})

const items = ref<{ id: string, name: string }[]>([])

const { getSubCategoryById, updateSubCategory } = useSubCategory()
const { categories, getAllCategories } = useCategory()

watchEffect(async () => {
  if (props.modelValue && props.id) {
    await getAllCategories()
    items.value = categories.value.map(c => ({
      id: c.id,
      name: c.name
    }))

    const detail = await getSubCategoryById(props.id)
    if (detail) {
      state.name = detail.data.name
      state.categoryId = detail.data.category?.id ?? ''
    }
  }
})

function resetForm() {
  state.name = ''
  state.categoryId = ''
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await updateSubCategory(props.id, {
    name: event.data.name,
    categoryId: event.data.categoryId
  })
  saving.value = false
  emit('updated')
  emit('update:modelValue', false)
  resetForm()
}
</script>

<template>
  <UModal
    :open="props.modelValue"
    title="Update Sub Category"
    description="Edit sub category details"
    @update:open="emit('update:modelValue', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput
            v-model="state.name"
            class="w-full"
            placeholder="Sub Category name"
          />
        </UFormField>

        <UFormField label="Category" name="categoryId">
          <UInputMenu
            v-model="state.categoryId"
            class="w-full"
            value-key="id"
            label-key="name"
            :items="items"
            placeholder="Select category"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="emit('update:modelValue', false)"
          />
          <UButton
            label="Update"
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
