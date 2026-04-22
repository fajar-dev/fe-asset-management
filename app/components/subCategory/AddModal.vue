<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSubCategory } from '~/composables/useSubCategory'
import { useCategory } from '~/composables/useCategory'
import { useProperty } from '~/composables/useProperty'
import { createSubCategorySchema as schema, type CreateSubCategorySchema as Schema } from '~/schemas/subCategorySchema'

const { t } = useI18n()

const emit = defineEmits<{ (e: 'created'): void }>()
const open = ref(false)
const saving = ref(false)
const state = reactive<Partial<Schema>>({
  name: '',
  categoryId: undefined,
  labels: [],
  properties: []
})

const { createSubCategory } = useSubCategory()
const { categories, getAllCategories } = useCategory()
const { createProperty } = useProperty()

const items = ref<{ id: string, name: string }[]>([])
const value = ref<string | undefined>(undefined)

watch(value, (v) => {
  state.categoryId = v
})

function resetForm() {
  state.name = ''
  state.categoryId = undefined
  value.value = undefined
  state.labels = []
  state.properties = []
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    saving.value = true
    const subCategory = await createSubCategory({
      name: event.data.name,
      categoryId: event.data.categoryId,
      labels: event.data.labels
    })
    if (event.data.properties.length > 0) {
      for (const property of event.data.properties) {
        await createProperty(subCategory.id, {
          name: property.name,
          dataType: property.dataType
        })
      }
    }
    resetForm()
    open.value = false
    emit('created')
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}

async function openModal() {
  open.value = true
  await getAllCategories()
  items.value = categories.value.map(c => ({ id: c.id, name: c.name }))
}

function addProperty() {
  state.properties?.push({ name: '', dataType: 'string' })
}

function removeProperty(index: number) {
  state.properties?.splice(index, 1)
}
</script>

<template>
  <UButton :label="t('modal.subCategory.addTitle')" icon="i-lucide-plus" @click="openModal" />

  <UModal v-model:open="open" :title="t('modal.subCategory.addTitle')" :description="t('modal.subCategory.addSubtitle')">
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <!-- Name -->
        <UFormField :label="t('common.name')" name="name" required>
          <UInput v-model="state.name" class="w-full" :placeholder="t('modal.subCategory.namePlaceholder')" />
        </UFormField>

        <!-- Category -->
        <UFormField label="Category" name="categoryId" required>
          <UInputMenu
            v-model="value"
            class="w-full"
            value-key="id"
            label-key="name"
            :items="items"
            :placeholder="t('modal.subCategory.selectCategory')"
          />
        </UFormField>

        <!-- Labels -->
        <UFormField :label="t('modal.subCategory.labels')" name="labels">
          <UInputTags v-model="state.labels" class="w-full" :placeholder="t('modal.subCategory.labelsPlaceholder')" />
        </UFormField>

        <!-- Properties -->
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-1">
              <label class="text-sm font-medium">{{ t('modal.subCategory.properties') }}</label>
              <UTooltip
                :text="t('modal.subCategory.propertiesHint')"
                :delay-duration="0"
              >
                <UIcon
                  name="i-lucide-info"
                  class="w-4 h-4 text-gray-500 cursor-pointer"
                />
              </UTooltip>
            </div>

            <UButton
              :label="t('modal.subCategory.addProperty')"
              icon="i-lucide-plus"
              size="xs"
              @click="addProperty"
            />
          </div>

          <div
            v-for="(prop, i) in state.properties"
            :key="i"
            class="flex gap-3 py-1 items-start"
          >
            <UFormField :name="`properties.${i}.name`" class="flex-1">
              <UInput v-model="prop.name" :placeholder="t('modal.subCategory.propertyNamePlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :name="`properties.${i}.dataType`" class="w-30">
              <USelectMenu
                v-model="prop.dataType"
                :items="[
                  { label: t('modal.subCategory.string'), value: 'string' },
                  { label: t('modal.subCategory.number'), value: 'number' }
                ]"
                value-key="value"
                label-key="label"
                :placeholder="t('modal.subCategory.selectType')"
                class="w-full"
              />
            </UFormField>

            <UButton
              icon="i-lucide-x"
              color="error"
              variant="subtle"
              class="mt-1"
              size="xs"
              @click="removeProperty(i)"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <UButton
            :label="t('modal.subCategory.cancel')"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            :label="t('modal.subCategory.save')"
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
