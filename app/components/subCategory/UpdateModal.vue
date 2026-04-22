<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSubCategory } from '~/composables/useSubCategory'
import { useCategory } from '~/composables/useCategory'
import { updateSubCategorySchema as schema, type UpdateSubCategorySchema as Schema } from '~/schemas/subCategorySchema'

const { t } = useI18n()

const props = defineProps<{
  id: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated'): void
}>()

const saving = ref(false)
const state = reactive<Partial<Schema>>({
  name: '',
  categoryId: '',
  labels: []
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
      state.labels = detail.data.labels ?? []
    }
  }
})

function resetForm() {
  state.name = ''
  state.categoryId = ''
  state.labels = []
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await updateSubCategory(props.id, {
    name: event.data.name,
    categoryId: event.data.categoryId,
    labels: event.data.labels
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
    :title="t('modal.subCategory.editTitle')"
    :description="t('modal.subCategory.editSubtitle')"
    @update:open="emit('update:modelValue', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="t('common.name')" name="name" required>
          <UInput
            v-model="state.name"
            class="w-full"
            :placeholder="t('modal.subCategory.namePlaceholder')"
          />
        </UFormField>

        <UFormField label="Category" name="categoryId" required>
          <UInputMenu
            v-model="state.categoryId"
            class="w-full"
            value-key="id"
            label-key="name"
            :items="items"
            :placeholder="t('modal.subCategory.selectCategory')"
          />
        </UFormField>

        <UFormField :label="t('modal.subCategory.labels')" name="labels">
          <UInputTags v-model="state.labels" class="w-full" :placeholder="t('modal.subCategory.labelsPlaceholder')" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            :label="t('modal.subCategory.cancel')"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="emit('update:modelValue', false)"
          />
          <UButton
            :label="t('modal.subCategory.update')"
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
