<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useCategory } from '~/composables/useCategory'
import { CalendarDate } from '@internationalized/date'
import { useSubCategory } from '~/composables/useSubCategory'
import { useAsset } from '~/composables/useAsset'
import { useProperty } from '~/composables/useProperty'

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
  status: z.enum(['active', 'in repair', 'disposed']).default('active'),
  image: z.any().optional(),
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
const isInitialLoad = ref(false)

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
  image: null,
  properties: [],
  customValues: []
})

const purchaseDateModel = ref<any>(null)

function formatDateDisplay(date: any): string {
  if (!date) return 'Select a date'
  
  const day = String(date.day).padStart(2, '0')
  const month = String(date.month).padStart(2, '0')
  const year = date.year
  
  return `${day}/${month}/${year}`
}

function calendarDateToString(date: any): string {
  const year = date.year
  const month = String(date.month).padStart(2, '0')
  const day = String(date.day).padStart(2, '0')
  return `${year}-${month}-${day}`
}

watch(purchaseDateModel, (newDate) => {
  if (newDate) {
    state.purchaseDate = calendarDateToString(newDate)
  } else {
    state.purchaseDate = ''
  }
})

const { createCategory, deleteCategory, categories, subCategories, getAllCategories, getSubCategoriesByCategory } = useCategory()
const { createSubCategory, deleteSubCategory, getSubCategoryById } = useSubCategory()
const { getAssetById, updateAsset } = useAsset()
const { createProperty } = useProperty()

const categoryItems = ref<{ id: string, name: string }[]>([])
const subCategoryItems = ref<{ id: string, name: string }[]>([])
const availableProperties = ref<any[]>([])
const propertyErrors = ref<Record<string, string>>({})

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
const newSubCategory = reactive<SubCategorySchema>({
  name: '',
  categoryId: '',
  properties: []
})

const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)
const existingImageUrl = ref<string | null>(null)
const hasImageChanged = ref(false)

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

const hasValidationErrors = computed(() => Object.keys(propertyErrors.value).length > 0)

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
    if (subCategoryDetail?.data?.assetProperties) {
      availableProperties.value = subCategoryDetail.data.assetProperties
      const existingProperties = state.properties || []
      state.properties = subCategoryDetail.data.assetProperties.map((p) => {
        const existing = existingProperties.find(ep => ep.id === p.id)
        return { id: p.id, value: existing?.value || '' }
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

watchEffect(async () => {
  if (open.value && props.assetId) {
    await getAllCategories()
    categoryItems.value = categories.value.map(c => ({ id: c.id, name: c.name }))
    await loadAssetData()
  } else if (!open.value) {
    resetState()
  }
})

async function loadAssetData() {
  if (!props.assetId) {
    open.value = false
    return
  }

  isInitialLoad.value = true

  const response = await getAssetById(props.assetId)

  if (!response?.data) {
    open.value = false
    isInitialLoad.value = false
    return
  }

  const asset = response.data

  state.code = asset.code
  state.name = asset.name
  state.description = asset.description || ''
  state.brand = asset.brand || ''
  state.model = asset.model || ''
  state.user = asset.user || ''
  state.price = asset.price || undefined
  state.purchaseDate = asset.purchaseDate || ''
  
  if (asset.purchaseDate) {
    const [year, month, day] = asset.purchaseDate.split('-').map(Number)
    if (year && month && day) {
      purchaseDateModel.value = new CalendarDate(year, month, day)
    }
  } else {
    purchaseDateModel.value = null
  }

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

  if (asset.customValues && asset.customValues.length > 0) {
    state.customValues = asset.customValues.map(cv => ({
      name: cv.name,
      value: cv.value.toString()
    }))
  }

  isInitialLoad.value = false
  await nextTick()
}

function getPropertyInfo(propertyId: string) {
  return availableProperties.value.find(p => p.id === propertyId)
}

function getPropertyName(propertyId: string) {
  return getPropertyInfo(propertyId)?.name || propertyId
}

function getPropertyDataType(propertyId: string) {
  return getPropertyInfo(propertyId)?.dataType || 'string'
}

function validateProperty(propertyId: string, value: any): string | null {
  const property = getPropertyInfo(propertyId)
  if (!property || value === '' || value === null || value === undefined) return null

  if (property.dataType === 'number' && isNaN(Number(value))) {
    return `${property.name} must be a valid number`
  }

  return null
}

function handlePropertyChange(index: number, value: string) {
  if (!state.properties?.[index]) return

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

  if (res?.id) {
    await getAllCategories()
    categoryItems.value = categories.value.map(c => ({ id: c.id, name: c.name }))
    state.categoryId = res.id

    Object.assign(newCategory, {
      name: '',
      hasMaintenance: false,
      hasHolder: false,
      hasLocation: false
    })

    openCategoryModal.value = false
  }

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

  if (subCategoryId) {
    if (parsed.properties.length > 0) {
      for (const property of parsed.properties) {
        await createProperty(subCategoryId, {
          name: property.name,
          dataType: property.dataType
        })
      }
    }

    await getSubCategoriesByCategory(state.categoryId)
    subCategoryItems.value = subCategories.value.map(s => ({ id: s.id, name: s.name }))
    state.subCategoryId = subCategoryId

    Object.assign(newSubCategory, {
      name: '',
      categoryId: '',
      properties: []
    })

    openSubCategoryModal.value = false
  }

  savingSubCategory.value = false
}

function showSubCategoryModal() {
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
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
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

function resetImageToOriginal() {
  state.image = null
  hasImageChanged.value = false
  imagePreview.value = existingImageUrl.value
  if (fileInput.value) fileInput.value.value = ''
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
        ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 960 }, aspectRatio: { ideal: 4 / 3 } }
        : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 }, aspectRatio: { ideal: 4 / 3 } },
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

    state.image = file
    hasImageChanged.value = true

    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    closeCameraModal()
  }, 'image/jpeg', 0.9)
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

function handleImageUpload(file: File | null) {
  if (!file) return
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) return
  state.image = file
  hasImageChanged.value = true
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
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

async function onSubmit(event: FormSubmitEvent<Schema>) {
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
    saving.value = false
    return
  }

  const processedProperties = event.data.properties?.filter(prop =>
    prop.value !== '' && prop.value !== null && prop.value !== undefined
  ).map((prop) => {
    const property = availableProperties.value.find(p => p.id === prop.id)
    if (property?.dataType === 'number') {
      return { id: prop.id, value: Number(prop.value) }
    }
    return { id: prop.id, value: prop.value?.toString() || '' }
  }) || []

  if (hasImageChanged.value && state.image) {
    const formData = new FormData()
    formData.append('code', event.data.code)
    formData.append('subCategoryId', event.data.subCategoryId)
    formData.append('name', event.data.name)

    if (event.data.description) formData.append('description', event.data.description)
    if (event.data.brand) formData.append('brand', event.data.brand)
    if (event.data.model) formData.append('model', event.data.model)

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

    formData.append('image', state.image)
    await updateAsset(props.assetId, formData)
  } else {
    const payload = {
      code: event.data.code,
      subCategoryId: event.data.subCategoryId,
      name: event.data.name,
      description: event.data.description || '',
      brand: event.data.brand || '',
      model: event.data.model || '',
      user: event.data.user,
      price: state.price,
      purchaseDate: event.data.purchaseDate,
      status: event.data.status || 'active',
      properties: processedProperties,
      customValues: state.customValues.filter(cv => cv.name && cv.value)
    }

    await updateAsset(props.assetId, payload)
  }

  open.value = false
  emit('updated')
  saving.value = false
}

function resetState() {
  Object.assign(state, {
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
    image: null,
    properties: [],
    customValues: []
  })

  hasImageChanged.value = false
  existingImageUrl.value = null
  imagePreview.value = null
  isInitialLoad.value = false
}

onBeforeUnmount(() => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
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
            <UInput v-model="state.user" class="w-full" placeholder="User" />
          </UFormField>
        </div>

        <div class="space-y-2">
          <UFormField label="Price" name="price" required>
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
            <UPopover>
              <UButton 
                color="neutral" 
                variant="subtle" 
                icon="i-lucide-calendar"
                block
                class="justify-start"
              >
                {{ formatDateDisplay(purchaseDateModel) }}
              </UButton>
              <template #content>
                <UCalendar v-model="purchaseDateModel" class="p-2" />
              </template>
            </UPopover>
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
            </div>
            <div class="flex items-center gap-2">
              <UButton
                v-if="imagePreview && hasImageChanged"
                icon="i-lucide-undo-2"
                variant="ghost"
                size="sm"
                :disabled="saving"
                @click="resetImageToOriginal"
              >
                Reset
              </UButton>
              <UButton
                icon="i-lucide-camera"
                variant="soft"
                label="Take Photo"
                size="sm"
                :disabled="saving"
                @click="openCameraModal"
              />
            </div>
          </div>
          <UFormField name="image" class="mb-2">
            <div class="space-y-2">
              <div class="relative">
                <UFileUpload
                  v-if="!imagePreview"
                  label="Drop your image here"
                  description="JPEG, PNG, WebP (max. 5MB)"
                  class="w-full min-h-48"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  @update:model="handleImageUpload"
                />

                <div
                  v-else
                  class="relative w-full min-h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
                >
                  <img
                    :src="imagePreview"
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
                      @click="triggerFileUpload"
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

                  <div v-if="hasImageChanged && state.image" class="absolute bottom-2 left-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded px-3 py-2">
                    <div class="flex items-center gap-2">
                      <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-green-600 shrink-0" />
                      <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ state.image?.name }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                class="hidden"
                @change="handleFileChange"
              >
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

  <UModal
    v-model:open="isCameraModalOpen"
    title="Take a Photo"
    :description="`Press the button to capture a photo${availableCameras.length > 1 ? ` (${availableCameras.length} cameras available)` : ''}`"
    @close="closeCameraModal"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-lg font-semibold">
          Take a Photo
        </h3>

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

        <div v-else class="relative bg-black rounded-lg overflow-hidden aspect-4/3">
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
              <p>Opening camera...</p>
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

        <UFormField name="hasLocation">
          <USwitch v-model="newCategory.hasLocation" label="Has Location" />
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
