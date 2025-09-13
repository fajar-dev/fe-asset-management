<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSubCategory } from '~/composables/useSubCategory'
import { useCategory } from '~/composables/useCategory'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required')
})

type Schema = z.output<typeof schema>

const emit = defineEmits<{ (e: 'created'): void }>()
const open = ref(false)
const saving = ref(false)
const state = reactive<Partial<Schema>>({
  name: '',
  categoryId: ''
})

// composables
const { createSubCategory } = useSubCategory()
const { categories, getAllCategories } = useCategory()

// items untuk dropdown
const items = ref<{ id: string, name: string }[]>([])
const value = ref('')

// watch value dropdown untuk set ke state
watch(value, (v) => {
  state.categoryId = v
})

function resetForm() {
  state.name = ''
  state.categoryId = ''
  value.value = ''
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await createSubCategory({
    name: event.data.name,
    categoryId: event.data.categoryId
  })
  resetForm()
  open.value = false
  emit('created')
  saving.value = false
}

async function openModal() {
  open.value = true
  await getAllCategories()
  items.value = categories.value.map(c => ({ id: c.id, name: c.name }))
}
</script>

<template>
  <UButton label="New Sub Category" icon="i-lucide-plus" @click="openModal" />

  <UModal v-model:open="open" title="New Sub Category" description="Add a new sub category">
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput v-model="state.name" class="w-full" placeholder="Sub Category name" />
        </UFormField>

        <UFormField label="Category" name="categoryId">
          <UInputMenu
            v-model="value"
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
