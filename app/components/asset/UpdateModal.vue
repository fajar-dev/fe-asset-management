<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useCategory } from '~/composables/useCategory'
import { useSubCategory } from '~/composables/useSubCategory'
import { useAsset } from '~/composables/useAsset'

const schema = z.object({
  code: z.string().min(1, 'Asset code is required'),
  name: z.string().min(1, 'Asset name is required'),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().min(1, 'Sub category is required'),
  status: z.enum(['active', 'in repair', 'disposed']).default('active'),
  properties: z.array(
    z.object({
      id: z.string(),
      value: z.union([z.string(), z.number()]).refine((val) => {
        return val !== undefined && val !== null && val !== ''
      }, 'Property value is required')
    })
  ).optional()
})

type Schema = z.output<typeof schema>

const props = defineProps<{
  assetId: string
}>()

const model = defineModel<boolean>()
const emit = defineEmits<{ (e: 'updated'): void }>()
const open = computed({
  get: () => model.value || false,
  set: (val) => { model.value = val }
})
const saving = ref(false)
const loading = ref(false)
const isInitialLoad = ref(false)
const state = reactive<Partial<Schema>>({
  code: '',
  name: '',
  description: '',
  brand: '',
  model: '',
  categoryId: '',
  subCategoryId: '',
  status: 'active',
  properties: []
})

const { categories, subCategories, getAllCategories, getSubCategoriesByCategory } = useCategory()
const { getSubCategoryById } = useSubCategory()
const { getAssetById, updateAsset } = useAsset()

const categoryItems = ref<{ id: string, name: string }[]>([])
const subCategoryItems = ref<{ id: string, name: string }[]>([])
const availableProperties = ref<any[]>([])
const propertyErrors = ref<Record<string, string>>({})

watch(() => state.categoryId, async (catId) => {
  if (isInitialLoad.value) return

  if (catId) {
    await getSubCategoriesByCategory(catId)
    subCategoryItems.value = subCategories.value.map(s => ({ id: s.id, name: s.name }))
    state.subCategoryId = ''
    state.properties = []
    availableProperties.value = []
    propertyErrors.value = {}
  } else {
    subCategoryItems.value = []
    state.subCategoryId = ''
    state.properties = []
    availableProperties.value = []
    propertyErrors.value = {}
  }
})

watch(() => state.subCategoryId, async (subCatId) => {
  if (isInitialLoad.value) return

  propertyErrors.value = {}

  if (subCatId) {
    const subCategoryDetail = await getSubCategoryById(subCatId)
    if (subCategoryDetail && subCategoryDetail.data.assetProperties) {
      availableProperties.value = subCategoryDetail.data.assetProperties

      const existingProperties = state.properties || []
      state.properties = subCategoryDetail.data.assetProperties.map((p) => {
        const existing = existingProperties.find(ep => ep.id === p.id)
        return {
          id: p.id,
          value: existing?.value || ''
        }
      })
    } else {
      availableProperties.value = []
      state.properties = []
    }
  } else {
    availableProperties.value = []
    state.properties = []
  }
})

async function loadAssetData() {
  try {
    loading.value = true
    isInitialLoad.value = true

    const response = await getAssetById(props.assetId)

    if (response?.data) {
      const asset = response.data

      state.code = asset.code
      state.name = asset.name
      state.description = asset.description || ''
      state.brand = asset.brand || ''
      state.model = asset.model || ''
      state.status = asset.status
      state.categoryId = asset.subCategory.category.id

      // Load subcategories berdasarkan category
      await getSubCategoriesByCategory(asset.subCategory.category.id)
      subCategoryItems.value = subCategories.value.map(s => ({ id: s.id, name: s.name }))

      // Set subcategory setelah subcategories dimuat
      state.subCategoryId = asset.subCategory.id

      if (asset.properties && asset.properties.length > 0) {
        state.properties = asset.properties.map(p => ({
          id: p.property.id,
          value: p.value
        }))

        availableProperties.value = asset.properties.map(p => ({
          id: p.property.id,
          name: p.property.name,
          dataType: p.property.dataType
        }))
      }
    }
  } catch (err) {
    console.error('Error loading asset:', err)
  } finally {
    loading.value = false
    await nextTick()
    isInitialLoad.value = false
  }
}

function getPropertyInfo(propertyId: string) {
  return availableProperties.value.find(p => p.id === propertyId)
}

function getPropertyName(propertyId: string) {
  const property = getPropertyInfo(propertyId)
  return property?.name || propertyId
}

function getPropertyDataType(propertyId: string) {
  const property = getPropertyInfo(propertyId)
  return property?.dataType || 'string'
}

function validateProperty(propertyId: string, value: any): string | null {
  const property = getPropertyInfo(propertyId)
  if (!property) return null

  if (!value || value === '') {
    return `${property.name} is required`
  }

  if (property.dataType === 'number') {
    const numValue = Number(value)
    if (isNaN(numValue)) {
      return `${property.name} must be a valid number`
    }
  }

  return null
}

function handlePropertyChange(index: number, value: string) {
  if (!state.properties || !state.properties[index]) return

  const propertyId = state.properties[index].id
  const property = getPropertyInfo(propertyId)

  if (property?.dataType === 'number') {
    const numValue = Number(value)
    state.properties[index].value = isNaN(numValue) ? value : numValue
  } else {
    state.properties[index].value = value
  }

  const errorMessage = validateProperty(propertyId, value)
  if (errorMessage) {
    propertyErrors.value[propertyId] = errorMessage
  } else {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete propertyErrors.value[propertyId]
  }
}

const hasValidationErrors = computed(() => {
  if (Object.keys(propertyErrors.value).length > 0) {
    return true
  }

  if (availableProperties.value.length > 0) {
    for (const property of availableProperties.value) {
      const propertyValue = state.properties?.find(p => p.id === property.id)
      if (!propertyValue || !propertyValue.value || propertyValue.value === '') {
        return true
      }
    }
  }

  return false
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    saving.value = true
    propertyErrors.value = {}
    let hasErrors = false

    if (availableProperties.value.length > 0) {
      for (const property of availableProperties.value) {
        const propertyValue = state.properties?.find(p => p.id === property.id)
        const errorMessage = validateProperty(property.id, propertyValue?.value)

        if (errorMessage) {
          propertyErrors.value[property.id] = errorMessage
          hasErrors = true
        }
      }
    }

    if (hasErrors) return

    const processedProperties = event.data.properties?.map((prop) => {
      const property = availableProperties.value.find(p => p.id === prop.id)
      if (property?.dataType === 'number') {
        return { id: prop.id, value: Number(prop.value) }
      }
      return { id: prop.id, value: prop.value?.toString() || '' }
    }).filter(prop => prop.value !== '') || []

    const payload = {
      code: event.data.code,
      subCategoryId: event.data.subCategoryId,
      name: event.data.name,
      description: event.data.description,
      brand: event.data.brand,
      model: event.data.model,
      status: event.data.status || 'active',
      properties: processedProperties
    }

    await updateAsset(props.assetId, payload)
    open.value = false
    emit('updated')
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}

async function openModal() {
  await getAllCategories()
  categoryItems.value = categories.value.map(c => ({ id: c.id, name: c.name }))
  await loadAssetData()
}

watch(open, (isOpen) => {
  if (isOpen) {
    openModal()
  } else {
    isInitialLoad.value = false
  }
})
</script>

<template>
  <UModal
    v-model:open="open"
    title="Edit Asset"
    description="Update asset information"
    :ui="{ content: 'max-w-5xl' }"
  >
    <template #body>
      <div v-if="loading" class="flex justify-center items-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin w-6 h-6" />
      </div>

      <UForm
        v-else
        :schema="schema"
        :state="state"
        class="md:grid md:grid-cols-2 gap-6"
        @submit="onSubmit"
      >
        <div class="space-y-2">
          <UFormField label="Serial ID" name="code">
            <UInput v-model="state.code" class="w-full" placeholder="Serial ID" />
          </UFormField>

          <UFormField label="Name" name="name">
            <UInput v-model="state.name" class="w-full" placeholder="Asset name" />
          </UFormField>

          <UFormField label="Description" name="description">
            <UTextarea v-model="state.description" class="w-full" placeholder="Asset description (optional)" />
          </UFormField>

          <UFormField label="Brand" name="brand">
            <UInput v-model="state.brand" class="w-full" placeholder="Brand (optional)" />
          </UFormField>

          <UFormField label="Model" name="model">
            <UInput v-model="state.model" class="w-full" placeholder="Model (optional)" />
          </UFormField>

          <UFormField label="Status" name="status">
            <USelectMenu
              v-model="state.status"
              :items="[
                { id: 'active', name: 'Active' },
                { id: 'in repair', name: 'In Repair' },
                { id: 'disposed', name: 'Disposed' }
              ]"
              value-key="id"
              label-key="name"
              placeholder="Select status"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="space-y-4">
          <UFormField label="Category" name="categoryId">
            <USelectMenu
              v-model="state.categoryId"
              :items="categoryItems"
              value-key="id"
              label-key="name"
              placeholder="Select category"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Sub Category" name="subCategoryId">
            <USelectMenu
              v-model="state.subCategoryId"
              :items="subCategoryItems"
              value-key="id"
              label-key="name"
              placeholder="Select sub category"
              :disabled="!state.categoryId"
              class="w-full"
            />
          </UFormField>

          <div v-if="state.properties?.length" class="space-y-3">
            <div
              v-for="(prop, i) in state.properties"
              :key="prop.id"
              class="space-y-1"
            >
              <label class="block text-sm font-medium text-gray-700">
                {{ getPropertyName(prop.id) }}
                <span class="text-red-500">*</span>
                <span v-if="getPropertyDataType(prop.id) === 'number'" class="text-xs text-gray-500 ml-1">(Number)</span>
              </label>

              <UInput
                :model-value="prop.value?.toString() || ''"
                class="w-full"
                :placeholder="`Enter ${getPropertyName(prop.id).toLowerCase()}${getPropertyDataType(prop.id) === 'number' ? ' (number)' : ''}`"
                :type="getPropertyDataType(prop.id) === 'number' ? 'number' : 'text'"
                :class="{ 'border-red-500 focus:border-red-500': propertyErrors[prop.id] }"
                @update:model-value="(value) => handlePropertyChange(i, value)"
              />

              <p v-if="propertyErrors[prop.id]" class="text-red-500 text-xs mt-1">
                {{ propertyErrors[prop.id] }}
              </p>
            </div>
          </div>
        </div>

        <div class="col-span-2 flex justify-end gap-2 pt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            label="Update"
            color="primary"
            variant="solid"
            type="submit"
            :loading="saving"
            :disabled="saving || hasValidationErrors"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
