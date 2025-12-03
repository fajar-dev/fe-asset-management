<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useCategory } from '~/composables/useCategory'
import { useSubCategory } from '~/composables/useSubCategory'
import { useAsset } from '~/composables/useAsset'
import { useProperty } from '~/composables/useProperty'
import { useLocation } from '~/composables/useLocation'
import { useAssetLocation } from '~/composables/useAssetLocation'
import { useBranch } from '~/composables/useBranch'

const schema = z.object({
  code: z.string().min(1, 'Asset code is required'),
  name: z.string().min(1, 'Asset name is required'),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  user: z.string().min(1, 'User is required'),
  price: z.union([z.string(), z.number()]).refine(val => val !== undefined && val !== '', {
    message: 'Price is required'
  }),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().min(1, 'Sub category is required'),
  locationId: z.string().optional(),
  status: z.enum(['active', 'in repair', 'disposed']).default('active'),
  image: z.any().refine(file => file !== null && file !== undefined, {
    message: 'Asset image is required'
  }),
  properties: z.array(
    z.object({
      id: z.string(),
      value: z.union([z.string(), z.number()]).optional()
    })
  ).optional(),
  customValues: z.array(
    z.object({
      name: z.string().min(1, 'Custom field name is required'),
      value: z.string().min(1, 'Custom field value is required')
    })
  ).optional()
})
type Schema = z.output<typeof schema>

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hasMaintenance: z.boolean().default(false),
  hasHolder: z.boolean().default(false),
  hasLocation: z.boolean().default(false)
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

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  branchId: z.string().min(1, 'Branch is required')
})

type CategorySchema = z.infer<typeof categorySchema>

const emit = defineEmits<{ (e: 'created'): void }>()

const open = ref(false)
const saving = ref(false)
const state = reactive<{
  code: string
  name: string
  description: string
  brand: string
  model: string
  user: string
  price: number | undefined
  purchaseDate: string
  categoryId: string
  subCategoryId: string
  locationId: string
  status: 'active' | 'in repair' | 'disposed'
  image: File | null
  properties: { id: string, value: string | number }[]
  customValues: { name: string, value: string }[]
}>({
  code: '',
  name: '',
  description: '',
  brand: '',
  model: '',
  user: '',
  price: undefined,
  purchaseDate: '',
  categoryId: '',
  subCategoryId: '',
  status: 'active',
  locationId: '',
  image: null,
  properties: [],
  customValues: []
})

const { createCategory, deleteCategory, categories, subCategories, getAllCategories, getSubCategoriesByCategory, getCategoryById } = useCategory()
const { createSubCategory, deleteSubCategory, getSubCategoryById } = useSubCategory()
const { createAsset } = useAsset()
const { createProperty } = useProperty()
const { locations, getAllLocations, createLocation, deleteLocation } = useLocation()
const { createLocation: createAssetLocationLink } = useAssetLocation()
const { branches, fetchBranches } = useBranch()

const categoryItems = ref<{ id: string, name: string }[]>([])
const subCategoryItems = ref<{ id: string, name: string }[]>([])
const locationItems = ref<{ id: string, name: string }[]>([])
const branchItems = ref<{ id: string, name: string }[]>([])
const availableProperties = ref<any[]>([])
const propertyErrors = ref<Record<string, string>>({})
const showLocationField = ref(false)

const openCategoryModal = ref(false)
const savingCategory = ref(false)
const newCategory = reactive<CategorySchema>({
  name: '',
  hasMaintenance: false,
  hasHolder: false,
  hasLocation: false
})

const openSubCategoryModal = ref(false)
const savingSubCategory = ref(false)
const newSubCategory = reactive<{
  name: string
  categoryId: string
  properties: { name: string, dataType: 'string' | 'number' }[]
}>({
  name: '',
  categoryId: '',
  properties: []
})

const openLocationModal = ref(false)
const savingLocation = ref(false)
const newLocation = reactive<{
  name: string
  branchId: string
}>({
  name: '',
  branchId: ''
})

const imageError = ref<string>('')
const imageInteracted = ref(false)
const imagePreviewUrl = ref<string>('')

const isCameraModalOpen = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const mediaStream = ref<MediaStream | null>(null)
const isCameraReady = ref(false)
const cameraError = ref<string>('')
const availableCameras = ref<MediaDeviceInfo[]>([])
const selectedCameraId = ref<string>('')

const isDeleteCategoryModalOpen = ref(false)
const deletingCategoryId = ref<string | null>(null)
const isDeleteSubCategoryModalOpen = ref(false)
const deletingSubCategoryId = ref<string | null>(null)
const isDeleteLocationModalOpen = ref(false)
const deletingLocationId = ref<string | null>(null)

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
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
  }

  state.code = ''
  state.name = ''
  state.description = ''
  state.brand = ''
  state.model = ''
  state.user = ''
  state.price = undefined
  state.purchaseDate = ''
  state.categoryId = ''
  state.subCategoryId = ''
  state.locationId = ''
  state.status = 'active'
  state.image = null
  state.properties = []
  state.customValues = []
  availableProperties.value = []
  categoryItems.value = []
  subCategoryItems.value = []
  locationItems.value = []
  propertyErrors.value = {}
  showLocationField.value = false
  imageError.value = ''
  imageInteracted.value = false
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

  if (value === null || value === undefined || value === '') {
    return null
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
  savingCategory.value = true
  const parsed = categorySchema.parse(newCategory)
  const res = await createCategory(parsed)
  await getAllCategories()
  categoryItems.value = categories.value.map(c => ({ id: c.id, name: c.name }))
  state.categoryId = res!.id
  Object.assign(newCategory, {
    name: '',
    hasMaintenance: false,
    hasHolder: false,
    hasLocation: false
  })
  openCategoryModal.value = false
  savingCategory.value = false
}

async function onAddSubCategory() {
  savingSubCategory.value = true
  newSubCategory.categoryId = state.categoryId
  const parsed = subCategorySchema.parse(newSubCategory)
  const subCategoryRes = await createSubCategory({
    name: parsed.name,
    categoryId: parsed.categoryId
  })

  const subCategoryId = subCategoryRes?.id

  if (subCategoryId && parsed.properties.length > 0) {
    for (const property of parsed.properties) {
      await createProperty(subCategoryId, {
        name: property.name,
        dataType: property.dataType
      })
    }
  }

  await getSubCategoriesByCategory(state.categoryId)
  subCategoryItems.value = subCategories.value.map(s => ({ id: s.id, name: s.name }))
  state.subCategoryId = subCategoryId || ''

  Object.assign(newSubCategory, {
    name: '',
    categoryId: '',
    properties: []
  })
  openSubCategoryModal.value = false
  savingSubCategory.value = false
}

async function onAddLocation() {
  savingLocation.value = true
  const parsed = locationSchema.parse(newLocation)
  const res = await createLocation({
    name: parsed.name,
    branchId: parsed.branchId
  })

  await getAllLocations()
  locationItems.value = locations.value.map(l => ({ id: l.id, name: l.name + ' - ' + l.branch.name }))
  state.locationId = res?.data?.id || ''

  Object.assign(newLocation, {
    name: '',
    branchId: ''
  })
  openLocationModal.value = false
  savingLocation.value = false
}

function showSubCategoryModal() {
  newSubCategory.categoryId = state.categoryId
  openSubCategoryModal.value = true
}

async function showLocationModal() {
  await fetchBranches()
  branchItems.value = branches.value.map(b => ({ id: b.branchId, name: b.branchId + ' - ' + b.name }))
  openLocationModal.value = true
}

function addSubCategoryProperty() {
  newSubCategory.properties?.push({ name: '', dataType: 'string' })
}

function removeSubCategoryProperty(index: number) {
  newSubCategory.properties?.splice(index, 1)
}

function validateImage(): string {
  if (!imageInteracted.value) {
    return ''
  }
  return ''
}

function handleFileSelect(file: File | null | undefined) {
  imageInteracted.value = true

  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
  }

  if (file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      imageError.value = 'Please select a valid image file (JPEG, PNG, GIF)'
      state.image = null
      return
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      imageError.value = 'File size must be less than 2MB'
      state.image = null
      return
    }

    state.image = file
    imageError.value = ''
    imagePreviewUrl.value = URL.createObjectURL(file)
  } else {
    state.image = null
    imageError.value = validateImage()
  }
}

function addCustomValue() {
  state.customValues.push({ name: '', value: '' })
}

function removeCustomValue(index: number) {
  state.customValues.splice(index, 1)
}

function removeCategory(categoryId: string) {
  deletingCategoryId.value = categoryId
  isDeleteCategoryModalOpen.value = true
}

async function confirmDeleteCategory() {
  if (!deletingCategoryId.value) return

  await deleteCategory(deletingCategoryId.value)
  await getAllCategories()
  categoryItems.value = categories.value.map(c => ({ id: c.id, name: c.name }))

  if (state.categoryId === deletingCategoryId.value) {
    state.categoryId = ''
    state.subCategoryId = ''
    subCategoryItems.value = []
    availableProperties.value = []
    state.properties = []
  }

  deletingCategoryId.value = null
  isDeleteCategoryModalOpen.value = false
}

function removeSubCategory(subCategoryId: string) {
  deletingSubCategoryId.value = subCategoryId
  isDeleteSubCategoryModalOpen.value = true
}

async function confirmDeleteSubCategory() {
  if (!deletingSubCategoryId.value) return

  await deleteSubCategory(deletingSubCategoryId.value)
  await getSubCategoriesByCategory(state.categoryId)
  subCategoryItems.value = subCategories.value.map(s => ({ id: s.id, name: s.name }))

  if (state.subCategoryId === deletingSubCategoryId.value) {
    state.subCategoryId = ''
    availableProperties.value = []
    state.properties = []
  }

  deletingSubCategoryId.value = null
  isDeleteSubCategoryModalOpen.value = false
}

function removeLocation(locationId: string) {
  deletingLocationId.value = locationId
  isDeleteLocationModalOpen.value = true
}

async function confirmDeleteLocation() {
  if (!deletingLocationId.value) return

  await deleteLocation(deletingLocationId.value)
  await getAllLocations()
  locationItems.value = locations.value.map(l => ({ id: l.id, name: l.name + ' - ' + l.branch.name }))

  if (state.locationId === deletingLocationId.value) {
    state.locationId = ''
  }

  deletingLocationId.value = null
  isDeleteLocationModalOpen.value = false
}

async function getAvailableCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    availableCameras.value = devices.filter(device => device.kind === 'videoinput')

    if (availableCameras.value.length > 0 && !selectedCameraId.value) {
      const backCamera = availableCameras.value.find(camera =>
        camera.label.toLowerCase().includes('back')
        || camera.label.toLowerCase().includes('rear')
        || camera.label.toLowerCase().includes('environment')
      )
      selectedCameraId.value = backCamera?.deviceId || availableCameras.value[0]!.deviceId
    }
  } catch {
    return
  }
}

async function startCamera(deviceId?: string) {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }

  isCameraReady.value = false
  cameraError.value = ''

  try {
    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    mediaStream.value = stream

    if (videoRef.value) {
      videoRef.value.srcObject = stream
      videoRef.value.onloadedmetadata = () => {
        isCameraReady.value = true
      }
    }
  } catch (error: any) {
    cameraError.value = error.name === 'NotAllowedError'
      ? 'Camera access denied. Please allow camera permissions.'
      : 'Failed to access camera. Please check your device settings.'
  }
}

async function switchCamera() {
  if (availableCameras.value.length <= 1) return

  const currentIndex = availableCameras.value.findIndex(
    camera => camera.deviceId === selectedCameraId.value
  )

  const nextIndex = (currentIndex + 1) % availableCameras.value.length
  selectedCameraId.value = availableCameras.value[nextIndex]!.deviceId

  await startCamera(selectedCameraId.value)
}

async function openCameraModal() {
  isCameraModalOpen.value = true
  cameraError.value = ''
  isCameraReady.value = false

  await nextTick()
  await getAvailableCameras()
  await startCamera(selectedCameraId.value)
}

function closeCameraModal() {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
  isCameraModalOpen.value = false
  isCameraReady.value = false
  cameraError.value = ''
}

function capturePhoto() {
  if (!videoRef.value || !canvasRef.value || !isCameraReady.value) return

  const video = videoRef.value
  const canvas = canvasRef.value

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const context = canvas.getContext('2d')
  if (!context) return

  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  canvas.toBlob((blob) => {
    if (!blob) return

    const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' })

    if (imagePreviewUrl.value) {
      URL.revokeObjectURL(imagePreviewUrl.value)
    }

    imageInteracted.value = true
    state.image = file
    imageError.value = ''
    imagePreviewUrl.value = URL.createObjectURL(file)

    closeCameraModal()
  }, 'image/jpeg', 0.9)
}

const hasValidationErrors = computed(() => {
  if (!state.image) return true
  if (Object.keys(propertyErrors.value).length > 0) return true
  return false
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  propertyErrors.value = {}
  imageError.value = validateImage()
  let hasErrors = false

  if (!state.image) {
    hasErrors = true
    saving.value = false
    return
  }

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
    saving.value = false
    return
  }

  const processedProperties = event.data.properties?.filter(prop => prop.value !== '' && prop.value !== null && prop.value !== undefined).map((prop) => {
    const property = availableProperties.value.find(p => p.id === prop.id)
    if (property?.dataType === 'number') {
      return { id: prop.id, value: Number(prop.value) }
    }
    return { id: prop.id, value: prop.value?.toString() || '' }
  }) || []

  const formData = new FormData()
  formData.append('code', event.data.code)
  formData.append('subCategoryId', event.data.subCategoryId)
  formData.append('name', event.data.name)

  if (event.data.description) formData.append('description', event.data.description)
  if (event.data.brand) formData.append('brand', event.data.brand)
  if (event.data.model) formData.append('model', event.data.model)
  if (event.data.locationId) formData.append('locationId', event.data.locationId)

  formData.append('user', event.data.user)
  formData.append('purchaseDate', event.data.purchaseDate)

  if (state.price !== undefined && state.price !== null) {
    formData.append('price', state.price.toString())
  }

  formData.append('status', event.data.status || 'active')
  formData.append('properties', JSON.stringify(processedProperties))

  if (state.customValues?.length > 0) {
    const validCustomValues = state.customValues.filter(cv => cv.name && cv.value)
    if (validCustomValues.length > 0) {
      formData.append('customValues', JSON.stringify(validCustomValues))
    }
  }

  if (state.image) formData.append('image', state.image)

  const asset = await createAsset(formData)

  if (event.data.locationId) {
    await createAssetLocationLink(asset.id, { locationId: event.data.locationId })
  }

  resetForm()
  open.value = false
  emit('created')
  saving.value = false
}

async function openModal() {
  open.value = true
  imageError.value = validateImage()
  await getAllCategories()
  categoryItems.value = categories.value.map(c => ({ id: c.id, name: c.name }))
}

onBeforeUnmount(() => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
  }
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
})
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
        class="md:grid md:grid-cols-3 gap-6"
        @submit="onSubmit"
      >
        <div class="space-y-2">
          <UFormField label="Serial ID" name="code" required>
            <UInput v-model="state.code" class="w-full" placeholder="Serial ID" />
          </UFormField>

          <UFormField label="Name" name="name" required>
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

          <UFormField label="User" name="user" required>
            <UInput
              v-model="state.user"
              class="w-full"
              placeholder="User"
            />
          </UFormField>
        </div>

        <div class="space-y-2">
          <UFormField label="Price" name="price">
            <UInput
              v-model="state.price"
              class="w-full"
              placeholder="Price"
              type="number"
            >
              <template #leading>
                <span class="text-gray-500">Rp</span>
              </template>
            </UInput>
          </UFormField>

          <UFormField label="Purchase Date" name="purchaseDate" required>
            <UInput
              v-model="state.purchaseDate"
              class="w-full"
              type="date"
            />
          </UFormField>

          <UFormField label="Status" name="status" required>
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

          <div class="flex justify-between items-center">
            <div class="flex items-center gap-1">
              <label class="text-sm font-medium text-gray-700">
                Asset Image
              </label>
              <span class="text-red-500 ml-0.5">*</span>
            </div>
            <UButton
              icon="i-lucide-camera"
              variant="soft"
              label="Take Photo"
              size="sm"
              @click="openCameraModal"
            />
          </div>
          <UFormField name="image" class="mb-2">
            <div class="space-y-2">
              <div class="relative">
                <UFileUpload
                  v-if="!imagePreviewUrl"
                  label="Drop your image here"
                  description="SVG, PNG, JPG or GIF (max. 2MB)"
                  class="w-full min-h-48"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  @update:model-value="handleFileSelect"
                />

                <div
                  v-else
                  class="relative w-full min-h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
                >
                  <img
                    :src="imagePreviewUrl"
                    alt="Preview"
                    class="w-full h-full object-contain"
                  >

                  <div class="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <UButton
                      label="Change"
                      icon="i-lucide-image"
                      color="neutral"
                      variant="subtle"
                      size="sm"
                      @click="() => { state.image = null; imagePreviewUrl = ''; imageInteracted = false }"
                    />
                    <UButton
                      label="Retake"
                      icon="i-lucide-camera"
                      color="neutral"
                      variant="subtle"
                      size="sm"
                      @click="openCameraModal"
                    />
                  </div>

                  <div class="absolute bottom-2 left-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded px-3 py-2">
                    <div class="flex items-center gap-2">
                      <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-green-600 shrink-0" />
                      <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ state.image?.name }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p v-if="imageError" class="text-red-500 text-sm mt-1">
                {{ imageError }}
              </p>
            </div>
          </UFormField>
        </div>

        <div class="space-y-2">
          <UFormField name="categoryId">
            <template #label>
              <div class="flex items-center gap-1">
                <span>
                  Category
                  <span class="text-red-500 ml-0.5">*</span>
                </span>

                <UTooltip
                  text="Select the main category for this asset. You can also add or remove categories directly here."
                  :delay-duration="0"
                >
                  <UIcon
                    name="i-lucide-info"
                    class="w-4 h-4 text-gray-500 cursor-pointer"
                  />
                </UTooltip>
              </div>
            </template>

            <div class="flex gap-2">
              <USelectMenu
                v-model="state.categoryId"
                :items="categoryItems"
                value-key="id"
                label-key="name"
                placeholder="Select category"
                class="flex-1"
              >
                <template #item="{ item }">
                  <div class="flex justify-between items-center w-full">
                    <span>{{ item.name }}</span>
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      size="xs"
                      variant="ghost"
                      @click.stop="removeCategory(item.id)"
                    />
                  </div>
                </template>
              </USelectMenu>

              <UButton
                icon="i-lucide-plus"
                size="sm"
                variant="soft"
                @click="openCategoryModal = true"
              />
            </div>
          </UFormField>

          <UFormField name="subCategoryId">
            <template #label>
              <div class="flex items-center gap-1">
                <span>
                  Sub Category
                  <span class="text-red-500 ml-0.5">*</span>
                </span>

                <UTooltip
                  text="Select the subcategory that matches the main category. You can also add a new one if needed."
                  :delay-duration="0"
                >
                  <UIcon
                    name="i-lucide-info"
                    class="w-4 h-4 text-gray-500 cursor-pointer"
                  />
                </UTooltip>
              </div>
            </template>

            <div class="flex gap-2">
              <USelectMenu
                v-model="state.subCategoryId"
                :items="subCategoryItems"
                value-key="id"
                label-key="name"
                placeholder="Select sub category"
                :disabled="!state.categoryId"
                class="flex-1"
              >
                <template #item="{ item }">
                  <div class="flex justify-between items-center w-full">
                    <span>{{ item.name }}</span>
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      size="xs"
                      variant="ghost"
                      @click.stop="removeSubCategory(item.id)"
                    />
                  </div>
                </template>
              </USelectMenu>

              <UButton
                icon="i-lucide-plus"
                size="sm"
                variant="soft"
                :disabled="!state.categoryId"
                @click="showSubCategoryModal()"
              />
            </div>
          </UFormField>

          <UFormField v-if="showLocationField" label="Location" name="locationId">
            <div class="flex gap-2">
              <USelectMenu
                v-model="state.locationId"
                :items="locationItems"
                value-key="id"
                label-key="name"
                placeholder="Select location (optional)"
                class="flex-1"
              >
                <template #item="{ item }">
                  <div class="flex justify-between items-center w-full">
                    <span>{{ item.name }}</span>
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      size="xs"
                      variant="ghost"
                      @click.stop="removeLocation(item.id)"
                    />
                  </div>
                </template>
              </USelectMenu>
              <UButton
                icon="i-lucide-plus"
                size="sm"
                variant="soft"
                @click="showLocationModal()"
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

          <div class="space-y-2 pt-4">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-1">
                <label class="text-sm font-medium text-gray-700">
                  Custom Fields
                </label>
                <UTooltip
                  text="Define additional attributes for this Asset (e.g. serial number, size, capacity)"
                  :delay-duration="0"
                >
                  <UIcon
                    name="i-lucide-info"
                    class="w-4 h-4 text-gray-500 cursor-pointer"
                  />
                </UTooltip>
              </div>
              <UButton
                label="Add"
                icon="i-lucide-plus"
                size="xs"
                variant="soft"
                @click="addCustomValue"
              />
            </div>

            <div v-if="state.customValues.length > 0" class="space-y-2">
              <div
                v-for="(customValue, i) in state.customValues"
                :key="i"
                class="flex gap-2 items-start"
              >
                <UFormField :name="`customValues.${i}.name`" class="flex-1">
                  <UInput
                    v-model="customValue.name"
                    placeholder="Field name"
                    class="w-full"
                  />
                </UFormField>

                <UFormField :name="`customValues.${i}.value`" class="flex-1">
                  <UInput
                    v-model="customValue.value"
                    placeholder="Field value"
                    class="w-full"
                  />
                </UFormField>

                <UButton
                  icon="i-lucide-x"
                  color="error"
                  variant="ghost"
                  size="sm"
                  @click="removeCustomValue(i)"
                />
              </div>
            </div>

            <p v-if="state.customValues.length === 0" class="text-sm text-gray-500 italic">
              No custom fields added yet
            </p>
          </div>
        </div>

        <div class="col-span-3 flex justify-end gap-2 pt-4">
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

  <UModal
    v-model:open="isCameraModalOpen"
    @close="closeCameraModal"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h3 class="text-lg font-semibold">
            Take a Photo
          </h3>
          <span class="text-sm text-gray-500">
            Press the button to capture a photo
            {{ availableCameras.length > 1 ? ` (${availableCameras.length} cameras available)` : '' }}
          </span>
        </div>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="closeCameraModal"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <div v-if="cameraError" class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p class="text-sm text-red-700">
              {{ cameraError }}
            </p>
          </div>
        </div>

        <div v-else class="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref="videoRef"
            autoplay
            playsinline
            class="w-full h-full object-cover"
          />

          <div
            v-if="isCameraReady && availableCameras.length > 1"
            class="absolute top-3 right-3 z-10"
          >
            <UButton
              icon="i-lucide-repeat"
              color="neutral"
              size="sm"
              @click="switchCamera"
            >
              <template #trailing>
                <UIcon name="i-lucide-camera" class="w-4 h-4" />
              </template>
            </UButton>
          </div>

          <div
            v-if="isCameraReady && availableCameras.length > 1"
            class="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full"
          >
            {{ availableCameras.findIndex(c => c.deviceId === selectedCameraId) + 1 }}/{{ availableCameras.length }}
          </div>

          <div v-if="!isCameraReady" class="absolute inset-0 flex items-center justify-center bg-gray-900/50">
            <div class="text-center text-white">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Opened...</p>
            </div>
          </div>
        </div>

        <canvas ref="canvasRef" class="hidden" />

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="closeCameraModal"
          />
          <UButton
            label="Take Photo"
            icon="i-lucide-camera"
            color="primary"
            variant="solid"
            :disabled="!isCameraReady || !!cameraError"
            @click="capturePhoto"
          />
        </div>
      </div>
    </template>
  </UModal>

  <ConfirmModal
    v-model:open="isDeleteCategoryModalOpen"
    title="Delete Category"
    description="Are you sure you want to delete this category? This action cannot be undone."
    confirm-label="Delete"
    :on-confirm="confirmDeleteCategory"
  />

  <ConfirmModal
    v-model:open="isDeleteSubCategoryModalOpen"
    title="Delete Sub Category"
    description="Are you sure you want to delete this sub category? This action cannot be undone."
    confirm-label="Delete"
    :on-confirm="confirmDeleteSubCategory"
  />

  <ConfirmModal
    v-model:open="isDeleteLocationModalOpen"
    title="Delete Location"
    description="Are you sure you want to delete this location? This action cannot be undone."
    confirm-label="Delete"
    :on-confirm="confirmDeleteLocation"
  />

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

        <UFormField name="hasLocation">
          <div class="flex items-center gap-2">
            <USwitch v-model="newCategory.hasLocation" label="Has Location" />
            <UTooltip text="Enable if this category involves asset locations" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <UFormField name="hasMaintenance">
          <div class="flex items-center gap-2">
            <USwitch v-model="newCategory.hasMaintenance" label="Has Maintenance" />
            <UTooltip text="Enable if this category requires maintenance tracking" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <UFormField name="hasHolder">
          <div class="flex items-center gap-2">
            <USwitch v-model="newCategory.hasHolder" label="Has Holder" />
            <UTooltip text="Enable if this category is assigned to a person or holder" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
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
            <div class="flex items-center gap-1">
              <label class="text-sm font-medium">Properties</label>
              <UTooltip
                text="Define additional attributes for this sub category (e.g. serial number, size, capacity)"
                :delay-duration="0"
              >
                <UIcon
                  name="i-lucide-info"
                  class="w-4 h-4 text-gray-500 cursor-pointer"
                />
              </UTooltip>
            </div>
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

  <UModal v-model:open="openLocationModal" title="Add Location" description="Create a new location">
    <template #body>
      <UForm
        :schema="locationSchema"
        :state="newLocation"
        class="space-y-4"
        @submit="onAddLocation"
      >
        <UFormField label="Name" name="name" required>
          <UInput v-model="newLocation.name" class="w-full" placeholder="Location name" />
        </UFormField>

        <UFormField label="Branch" name="branchId" required>
          <UInputMenu
            v-model="newLocation.branchId"
            class="w-full"
            value-key="id"
            label-key="name"
            :items="branchItems"
            placeholder="Select branch"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="savingLocation"
            @click="openLocationModal = false"
          />
          <UButton
            label="Save"
            color="primary"
            variant="solid"
            type="submit"
            :loading="savingLocation"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
