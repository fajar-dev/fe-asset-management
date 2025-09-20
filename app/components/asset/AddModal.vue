<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useCategory } from '~/composables/useCategory'
import { useSubCategory } from '~/composables/useSubCategory'
import { useAsset } from '~/composables/useAsset'
import { useLocation } from '~/composables/useLocation'
import { useAssetLocation } from '~/composables/useAssetLocation'

const schema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().min(1, 'Sub category is required'),
  locationId: z.string().optional(),
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

const emit = defineEmits<{ (e: 'created'): void }>()
const open = ref(false)
const saving = ref(false)
const state = reactive<Partial<Schema>>({
  name: '',
  description: '',
  brand: '',
  model: '',
  categoryId: '',
  subCategoryId: '',
  locationId: '',
  properties: []
})

const { categories, subCategories, getAllCategories, getSubCategoriesByCategory, getCategoryById } = useCategory()
const { getSubCategoryById } = useSubCategory()
const { createAsset } = useAsset()
const { locations, getAllLocations } = useLocation()
const { createLocation } = useAssetLocation()

const categoryItems = ref<{ id: string, name: string }[]>([])
const subCategoryItems = ref<{ id: string, name: string }[]>([])
const locationItems = ref<{ id: string, name: string }[]>([])
const availableProperties = ref<any[]>([])
const propertyErrors = ref<Record<string, string>>({})
const showLocationField = ref(false)

watch(() => state.categoryId, async (catId) => {
  if (catId) {
    // Get category details to check hasLocation
    const categoryDetail = await getCategoryById(catId)
    showLocationField.value = categoryDetail?.data?.hasLocation || false

    // Load locations if category has location
    if (showLocationField.value) {
      await getAllLocations()
      locationItems.value = locations.value.map(l => ({ id: l.id, name: l.name }))
    } else {
      locationItems.value = []
      state.locationId = ''
    }

    await getSubCategoriesByCategory(catId)
    subCategoryItems.value = subCategories.value.map(s => ({ id: s.id, name: s.name }))
    state.subCategoryId = ''
    state.properties = []
    availableProperties.value = []
    propertyErrors.value = {}
  } else {
    subCategoryItems.value = []
    locationItems.value = []
    state.subCategoryId = ''
    state.locationId = ''
    state.properties = []
    availableProperties.value = []
    propertyErrors.value = {}
    showLocationField.value = false
  }
})

watch(() => state.subCategoryId, async (subCatId) => {
  propertyErrors.value = {}

  if (subCatId) {
    const subCategoryDetail = await getSubCategoryById(subCatId)
    if (subCategoryDetail && subCategoryDetail.data.assetProperties) {
      availableProperties.value = subCategoryDetail.data.assetProperties
      state.properties = subCategoryDetail.data.assetProperties.map(p => ({
        id: p.id,
        value: ''
      }))
    } else {
      availableProperties.value = []
      state.properties = []
    }
  } else {
    availableProperties.value = []
    state.properties = []
  }
})

function resetForm() {
  state.name = ''
  state.description = ''
  state.brand = ''
  state.model = ''
  state.categoryId = ''
  state.subCategoryId = ''
  state.locationId = ''
  state.properties = []
  availableProperties.value = []
  categoryItems.value = []
  subCategoryItems.value = []
  locationItems.value = []
  propertyErrors.value = {}
  showLocationField.value = false
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

    if (hasErrors) {
      return
    }

    const processedProperties = event.data.properties?.map((prop) => {
      const property = availableProperties.value.find(p => p.id === prop.id)
      if (property?.dataType === 'number') {
        return {
          id: prop.id,
          value: Number(prop.value)
        }
      }
      return {
        id: prop.id,
        value: prop.value?.toString() || ''
      }
    }).filter(prop => prop.value !== '') || []

    const payload = {
      subCategoryId: event.data.subCategoryId,
      name: event.data.name,
      description: event.data.description,
      brand: event.data.brand,
      model: event.data.model,
      locationId: event.data.locationId || undefined,
      properties: processedProperties
    }

    const asset = await createAsset(payload)
    if (event.data.locationId) {
      await createLocation(asset?.data.id, { locationId: event.data.locationId })
    }
    resetForm()
    open.value = false
    emit('created')
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}

async function openModal() {
  open.value = true
  await getAllCategories()
  categoryItems.value = categories.value.map(c => ({ id: c.id, name: c.name }))
}
</script>

<template>
  <UButton label="New Asset" icon="i-lucide-plus" @click="openModal" />

  <UModal v-model:open="open" title="New Asset" description="Add a new asset">
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput v-model="state.name" class="w-full" placeholder="Asset name" />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" class="w-full" placeholder="Asset description (optional)" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Brand" name="brand">
            <UInput v-model="state.brand" class="w-full" placeholder="Brand (optional)" />
          </UFormField>

          <UFormField label="Model" name="model">
            <UInput v-model="state.model" class="w-full" placeholder="Model (optional)" />
          </UFormField>
        </div>

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

        <UFormField v-if="showLocationField" label="Location" name="locationId">
          <USelectMenu
            v-model="state.locationId"
            :items="locationItems"
            value-key="id"
            label-key="name"
            placeholder="Select location (optional)"
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
            :disabled="saving || hasValidationErrors"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
