<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useCategory } from '~/composables/useCategory'
import { useSubCategory } from '~/composables/useSubCategory'
import { useAsset } from '~/composables/useAsset'
import { useLocation } from '~/composables/useLocation'
import { useAssetLocation } from '~/composables/useAssetLocation'

const schema = z.object({
  code: z.string().min(1, 'Asset code is required'),
  name: z.string().min(1, 'Asset name is required'),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().min(1, 'Sub category is required'),
  locationId: z.string().optional(),
  status: z.enum(['active', 'in repair', 'disposed']).default('active'),
  image: z.any(),
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
  code: '',
  name: '',
  description: '',
  brand: '',
  model: '',
  categoryId: '',
  subCategoryId: '',
  locationId: '',
  status: 'active',
  image: null,
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

// Image upload related refs
const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)

watch(() => state.categoryId, async (catId) => {
  if (catId) {
    const categoryDetail = await getCategoryById(catId)
    showLocationField.value = categoryDetail?.data?.hasLocation || false

    if (showLocationField.value) {
      await getAllLocations()
      locationItems.value = locations.value.map(l => ({ id: l.id, name: l.name + ' - ' + l.branch.name }))
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
  state.code = ''
  state.name = ''
  state.description = ''
  state.brand = ''
  state.model = ''
  state.categoryId = ''
  state.subCategoryId = ''
  state.locationId = ''
  state.status = 'active'
  state.image = null
  state.properties = []
  availableProperties.value = []
  categoryItems.value = []
  subCategoryItems.value = []
  locationItems.value = []
  propertyErrors.value = {}
  showLocationField.value = false
  imagePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
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

// Image upload functions
function triggerFileUpload() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 5MB')
      return
    }

    state.image = file

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function removeImage() {
  state.image = null
  imagePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
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

    // Create FormData to include the image file
    const formData = new FormData()

    // Add all asset data fields
    formData.append('code', event.data.code)
    formData.append('subCategoryId', event.data.subCategoryId)
    formData.append('name', event.data.name)

    if (event.data.description) {
      formData.append('description', event.data.description)
    }
    if (event.data.brand) {
      formData.append('brand', event.data.brand)
    }
    if (event.data.model) {
      formData.append('model', event.data.model)
    }
    if (event.data.locationId) {
      formData.append('locationId', event.data.locationId)
    }

    formData.append('status', event.data.status || 'active')
    formData.append('properties', JSON.stringify(processedProperties))

    // Add image file if present
    if (state.image) {
      formData.append('image', state.image)
    }

    const asset = await createAsset(formData)

    if (event.data.locationId) {
      await createLocation(asset.data.id, { locationId: event.data.locationId })
    }

    resetForm()
    open.value = false
    emit('created')
  } catch (err) {
    console.error(err)
    alert('Failed to create asset. Please try again.')
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

  <UModal
    v-model:open="open"
    title="New Asset"
    description="Add a new asset"
    :ui="{ content: 'max-w-6xl' }"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="md:grid md:grid-cols-2 gap-6"
        @submit="onSubmit"
      >
        <!-- Kolom kiri -->
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

          <!-- Image Upload Section -->
          <UFormField label="Asset Image" name="image">
            <div class="space-y-3">
              <!-- Image Upload Button -->
              <div class="flex items-center gap-3">
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-upload"
                  :disabled="saving"
                  @click="triggerFileUpload"
                >
                  {{ imagePreview ? 'Change Image' : 'Upload Image' }}
                </UButton>

                <UButton
                  v-if="imagePreview"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  size="sm"
                  :disabled="saving"
                  @click="removeImage"
                >
                  Remove
                </UButton>
              </div>

              <!-- Hidden File Input -->
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                class="hidden"
                @change="handleFileChange"
              >

              <!-- Image Preview -->
              <div v-if="imagePreview" class="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div class="text-center">
                  <img
                    :src="imagePreview"
                    alt="Asset preview"
                    class="mx-auto max-h-48 rounded-lg shadow-md"
                  >
                  <p class="mt-2 text-sm text-gray-500">
                    {{ state.image?.name }}
                    <span class="text-xs text-gray-400">
                      ({{ Math.round((state.image?.size || 0) / 1024) }} KB)
                    </span>
                  </p>
                </div>
              </div>

              <!-- Upload Guidelines -->
              <div class="text-xs text-gray-500 mt-2">
                <p>• Supported formats: JPEG, PNG, WebP</p>
                <p>• Maximum file size: 5MB</p>
                <p>• Recommended size: 800x600 pixels or larger</p>
              </div>
            </div>
          </UFormField>
        </div>

        <!-- Kolom kanan -->
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
        </div>

        <!-- Tombol aksi full width -->
        <div class="col-span-2 flex justify-end gap-2 pt-4">
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
