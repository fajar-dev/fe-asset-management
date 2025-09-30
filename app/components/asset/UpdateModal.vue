<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useCategory } from '~/composables/useCategory'
import { useSubCategory } from '~/composables/useSubCategory'
import { useAsset } from '~/composables/useAsset'
import { useProperty } from '~/composables/useProperty'

const schema = z.object({
  code: z.string().min(1, 'Asset code is required'),
  name: z.string().min(1, 'Asset name is required'),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().min(1, 'Sub category is required'),
  status: z.enum(['active', 'in repair', 'disposed']).default('active'),
  image: z.any().optional(),
  properties: z.array(
    z.object({
      id: z.string(),
      value: z.union([z.string(), z.number()]).refine((val) => {
        return val !== undefined && val !== null && val !== ''
      }, 'Property value is required')
    })
  ).optional()
})

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hasMaintenance: z.boolean().default(false),
  hasHolder: z.boolean().default(false)
})

const subCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  properties: z.array(
    z.object({
      name: z.string().min(1, 'Property name is required'),
      dataType: z.enum(['string', 'number'], { message: 'Type is required' })
    })
  )
})

type Schema = z.output<typeof schema>
type CategorySchema = z.infer<typeof categorySchema>
type SubCategorySchema = z.infer<typeof subCategorySchema>

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
const state = reactive<{
  code: string
  name: string
  description: string
  brand: string
  model: string
  categoryId: string
  subCategoryId: string
  status: 'active' | 'in repair' | 'disposed'
  image: File | null
  properties: { id: string, value: string | number }[]
}>({
  code: '',
  name: '',
  description: '',
  brand: '',
  model: '',
  categoryId: '',
  subCategoryId: '',
  status: 'active',
  image: null,
  properties: []
})

const { createCategory, categories, subCategories, getAllCategories, getSubCategoriesByCategory } = useCategory()
const { createSubCategory, getSubCategoryById } = useSubCategory()
const { getAssetById, updateAsset } = useAsset()
const { createProperty } = useProperty()

const categoryItems = ref<{ id: string, name: string }[]>([])
const subCategoryItems = ref<{ id: string, name: string }[]>([])
const availableProperties = ref<any[]>([])
const propertyErrors = ref<Record<string, string>>({})

// Category modal
const openCategoryModal = ref(false)
const savingCategory = ref(false)
const newCategory = reactive<CategorySchema>({
  name: '',
  hasMaintenance: false,
  hasHolder: false
})

// Sub Category modal
const openSubCategoryModal = ref(false)
const savingSubCategory = ref(false)
const newSubCategory = reactive<SubCategorySchema>({
  name: '',
  categoryId: '',
  properties: []
})

const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)
const existingImageUrl = ref<string | null>(null)
const hasImageChanged = ref(false)

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

      if (asset.imageUrl) {
        existingImageUrl.value = asset.imageUrl
        imagePreview.value = asset.imageUrl
      }

      await getSubCategoriesByCategory(asset.subCategory.category.id)
      subCategoryItems.value = subCategories.value.map(s => ({ id: s.id, name: s.name }))

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

async function onAddCategory() {
  try {
    savingCategory.value = true
    const parsed = categorySchema.parse(newCategory)
    const res = await createCategory(parsed)
    await getAllCategories()
    categoryItems.value = categories.value.map(c => ({ id: c.id, name: c.name }))
    state.categoryId = res!.id
    Object.assign(newCategory, {
      name: '',
      hasMaintenance: false,
      hasHolder: false
    })
    openCategoryModal.value = false
  } catch (err) {
    console.error('Failed to create category', err)
    alert('Failed to create category')
  } finally {
    savingCategory.value = false
  }
}

async function onAddSubCategory() {
  try {
    savingSubCategory.value = true
    newSubCategory.categoryId = state.categoryId
    const parsed = subCategorySchema.parse(newSubCategory)
    const subCategory = await createSubCategory({
      name: parsed.name,
      categoryId: parsed.categoryId
    })

    if (parsed.properties.length > 0) {
      for (const property of parsed.properties) {
        await createProperty(subCategory.data.id, {
          name: property.name,
          dataType: property.dataType
        })
      }
    }

    await getSubCategoriesByCategory(state.categoryId)
    subCategoryItems.value = subCategories.value.map(s => ({ id: s.id, name: s.name }))
    state.subCategoryId = subCategory.data.id

    Object.assign(newSubCategory, {
      name: '',
      categoryId: '',
      properties: []
    })
    openSubCategoryModal.value = false
  } catch (err) {
    console.error('Failed to create sub category', err)
    alert('Failed to create sub category')
  } finally {
    savingSubCategory.value = false
  }
}

function showSubCategoryModal() {
  // Pre-fill the category ID from the selected category
  newSubCategory.categoryId = state.categoryId
  openSubCategoryModal.value = true
}

function addSubCategoryProperty() {
  newSubCategory.properties?.push({ name: '', dataType: 'string' })
}

function removeSubCategoryProperty(index: number) {
  newSubCategory.properties?.splice(index, 1)
}

function triggerFileUpload() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP)')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 5MB')
      return
    }

    state.image = file
    hasImageChanged.value = true

    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function resetImageToOriginal() {
  state.image = null
  hasImageChanged.value = false
  imagePreview.value = existingImageUrl.value
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

    if (hasImageChanged.value) {
      const formData = new FormData()

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

      formData.append('status', event.data.status || 'active')
      formData.append('properties', JSON.stringify(processedProperties))

      if (state.image) {
        formData.append('image', state.image)
      }
      await updateAsset(props.assetId, formData)
    } else {
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
    }

    open.value = false
    emit('updated')
  } catch (err) {
    console.error(err)
    alert('Failed to update asset. Please try again.')
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
    hasImageChanged.value = false
    existingImageUrl.value = null
    imagePreview.value = null
    state.image = null
    isInitialLoad.value = false
  }
})
</script>

<template>
  <UModal
    v-model:open="open"
    title="Edit Asset"
    description="Update asset information"
    :ui="{ content: 'max-w-6xl' }"
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

          <UFormField label="Asset Image" name="image">
            <div class="space-y-3">
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
                  v-if="imagePreview && hasImageChanged"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-undo-2"
                  size="sm"
                  :disabled="saving"
                  @click="resetImageToOriginal"
                >
                  Reset
                </UButton>
              </div>

              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                class="hidden"
                @change="handleFileChange"
              >

              <div v-if="imagePreview" class="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div class="text-center">
                  <img
                    :src="imagePreview"
                    alt="Asset preview"
                    class="mx-auto max-h-48 rounded-lg shadow-md"
                  >
                  <div class="mt-2">
                    <p v-if="hasImageChanged && state.image" class="text-sm text-gray-500">
                      {{ state.image?.name }}
                      <span class="text-xs text-gray-400">
                        ({{ Math.round((state.image?.size || 0) / 1024) }} KB)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div class="text-xs text-gray-500 mt-2">
                <p>• Supported formats: JPEG, PNG, WebP</p>
                <p>• Maximum file size: 5MB</p>
              </div>
            </div>
          </UFormField>
        </div>

        <div class="space-y-4">
          <UFormField label="Category" name="categoryId">
            <div class="flex gap-2">
              <USelectMenu
                v-model="state.categoryId"
                :items="categoryItems"
                value-key="id"
                label-key="name"
                placeholder="Select category"
                class="flex-1"
              />
              <UButton
                icon="i-lucide-plus"
                size="sm"
                variant="soft"
                @click="openCategoryModal = true"
              />
            </div>
          </UFormField>

          <UFormField label="Sub Category" name="subCategoryId">
            <div class="flex gap-2">
              <USelectMenu
                v-model="state.subCategoryId"
                :items="subCategoryItems"
                value-key="id"
                label-key="name"
                placeholder="Select sub category"
                :disabled="!state.categoryId"
                class="flex-1"
              />
              <UButton
                icon="i-lucide-plus"
                size="sm"
                variant="soft"
                :disabled="!state.categoryId"
                @click="showSubCategoryModal()"
              />
            </div>
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

  <!-- Add Category Modal -->
  <UModal v-model:open="openCategoryModal" title="Add Category" description="Create a new category">
    <template #body>
      <UForm
        :schema="categorySchema"
        :state="newCategory"
        class="space-y-4"
        @submit="onAddCategory"
      >
        <UFormField label="Name" name="name" required>
          <UInput v-model="newCategory.name" class="w-full" placeholder="Category name" />
        </UFormField>

        <UFormField name="hasMaintenance">
          <USwitch v-model="newCategory.hasMaintenance" label="Has Maintenance" />
        </UFormField>

        <UFormField name="hasHolder">
          <USwitch v-model="newCategory.hasHolder" label="Has Holder" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="savingCategory"
            @click="openCategoryModal = false"
          />
          <UButton
            label="Save"
            color="primary"
            variant="solid"
            type="submit"
            :loading="savingCategory"
          />
        </div>
      </UForm>
    </template>
  </UModal>

  <!-- Add Sub Category Modal -->
  <UModal v-model:open="openSubCategoryModal" title="Add Sub Category" description="Create a new sub category">
    <template #body>
      <UForm
        :schema="subCategorySchema"
        :state="newSubCategory"
        class="space-y-4"
        @submit="onAddSubCategory"
      >
        <UFormField label="Category" name="categoryId">
          <USelectMenu
            v-model="newSubCategory.categoryId"
            :items="categoryItems"
            value-key="id"
            label-key="name"
            placeholder="Select category"
            class="w-full"
            disabled
          />
        </UFormField>

        <UFormField label="Name" name="name" required>
          <UInput v-model="newSubCategory.name" class="w-full" placeholder="Sub Category name" />
        </UFormField>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="text-sm font-medium">Properties</label>
            <UButton
              label="Add Property"
              icon="i-lucide-plus"
              size="xs"
              @click="addSubCategoryProperty"
            />
          </div>

          <div v-for="(prop, i) in newSubCategory.properties" :key="i" class="flex gap-3 py-1 items-start">
            <UFormField :name="`properties.${i}.name`" class="flex-1">
              <UInput v-model="prop.name" placeholder="Property name" class="w-full" />
            </UFormField>

            <UFormField :name="`properties.${i}.dataType`" class="w-30">
              <USelectMenu
                v-model="prop.dataType"
                :items="[
                  { label: 'String', value: 'string' },
                  { label: 'Number', value: 'number' }
                ]"
                value-key="value"
                label-key="label"
                placeholder="Select type"
                class="w-full"
              />
            </UFormField>

            <UButton
              icon="i-lucide-x"
              color="error"
              variant="subtle"
              class="mt-1"
              size="xs"
              @click="removeSubCategoryProperty(i)"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="savingSubCategory"
            @click="openSubCategoryModal = false"
          />
          <UButton
            label="Save"
            color="primary"
            variant="solid"
            type="submit"
            :loading="savingSubCategory"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
