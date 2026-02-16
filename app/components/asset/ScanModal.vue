<script setup lang="ts">
import { BrowserMultiFormatReader } from '@zxing/library'

const open = ref(false)
const loading = ref(false)
const showLoadingModal = ref(false)
const showNotFoundModal = ref(false)
const error = ref<string>('')
const cameraError = ref<string>('')
const scannedResult = ref<string>('')
const videoRef = ref<HTMLVideoElement>()
const codeReader = ref<BrowserMultiFormatReader>()
const scanning = ref(false)

const videoDevices = ref<MediaDeviceInfo[]>([])
const selectedDeviceIndex = ref(0)
const isFrontCamera = ref(true)

const router = useRouter()
const { getAssetByCode } = useAsset()

const emit = defineEmits<{
  (e: 'add-asset', code: string): void
}>()

const props = defineProps<{
  hideTrigger?: boolean
}>()

onMounted(() => {
  codeReader.value = new BrowserMultiFormatReader()
})

const detectFrontCamera = (device: MediaDeviceInfo) => {
  const label = device?.label.toLowerCase() || ''
  return label.includes('front')
    || label.includes('depan')
    || label.includes('user')
    || label.includes('facing front')
    || (!label.includes('back') && !label.includes('rear') && selectedDeviceIndex.value === 0)
}

const startScanning = async () => {
  if (!codeReader.value || !videoRef.value) return

  try {
    loading.value = true
    cameraError.value = ''

    const videoInputDevices = await codeReader.value.listVideoInputDevices()

    if (videoInputDevices.length === 0) {
      throw new Error('No camera found on this device')
    }

    videoDevices.value = videoInputDevices

    // Find back camera
    const backCameraIndex = videoInputDevices.findIndex(device => {
      const label = device.label.toLowerCase()
      return label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('belakang')
    })

    if (backCameraIndex !== -1) {
      selectedDeviceIndex.value = backCameraIndex
    } else {
      selectedDeviceIndex.value = 0
    }

    const selectedDevice = videoInputDevices[selectedDeviceIndex.value]
    if (!selectedDevice) {
      return
    }
    isFrontCamera.value = detectFrontCamera(selectedDevice)
    const selectedDeviceId = videoInputDevices[selectedDeviceIndex.value]?.deviceId

    const result = await codeReader.value.decodeOnceFromVideoDevice(selectedDeviceId, videoRef.value)

    if (result) {
      await handleScanSuccess(result.getText())
    }
  } catch (err: any) {
    console.error('Barcode Scanner Error:', err)
    handleCameraError(err)
  } finally {
    loading.value = false
  }
}

const handleScanSuccess = async (result: string) => {
  if (!scanning.value) return

  scannedResult.value = result

  stopScanning()
  open.value = false
  showLoadingModal.value = true

  try {
    const data = await getAssetByCode(result)

    if (data) {
      showLoadingModal.value = false
      await router.push(`/asset/${data.data.id}/detail`)
    } else {
      handleScanError()
    }
  } catch (err) {
    console.error('API Error:', err)
    handleScanError()
  }
}

const handleScanError = () => {
  showLoadingModal.value = false
  scanning.value = false
  showNotFoundModal.value = true
}

const handleAddNewAsset = () => {
  showNotFoundModal.value = false
  open.value = false
  emit('add-asset', scannedResult.value)
}

const handleRetryScanning = () => {
  showNotFoundModal.value = false
  setTimeout(() => {
    openModal()
  }, 300)
}

const handleCameraError = (err: any) => {
  scanning.value = false
  loading.value = false

  if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
    cameraError.value = 'Camera access denied. Please allow camera permissions and try again.'
  } else if (err.name === 'NotFoundError' || err.message?.includes('No camera found')) {
    cameraError.value = 'No camera found on this device.'
  } else if (err.name === 'NotSupportedError') {
    cameraError.value = 'Camera not supported on this device.'
  } else if (err.name === 'NotReadableError') {
    cameraError.value = 'Camera is already in use by another application.'
  } else if (err.name === 'OverconstrainedError') {
    cameraError.value = 'Camera constraints cannot be satisfied.'
  } else {
    cameraError.value = 'Failed to access camera. Please check your permissions and try again.'
  }
}

const closeModal = () => {
  stopScanning()
  open.value = false
  error.value = ''
  cameraError.value = ''
  loading.value = false
}

const openModal = async () => {
  loading.value = true
  cameraError.value = ''
  error.value = ''
  open.value = true

  await nextTick()
  await startScanning()
}

const retryCamera = async () => {
  cameraError.value = ''
  loading.value = true
  await nextTick()
  await continuousScanning()
}

const stopScanning = () => {
  if (codeReader.value) {
    codeReader.value.reset()
  }
  scanning.value = false
}

const continuousScanning = async () => {
  if (!codeReader.value || !videoRef.value) return

  try {
    scanning.value = true
    loading.value = false
    cameraError.value = ''

    const videoInputDevices = await codeReader.value.listVideoInputDevices()

    if (videoInputDevices.length === 0) {
      throw new Error('No camera found on this device')
    }

    videoDevices.value = videoInputDevices

    // Find back camera
    const backCameraIndex = videoInputDevices.findIndex(device => {
      const label = device.label.toLowerCase()
      return label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('belakang')
    })

    if (backCameraIndex !== -1) {
      selectedDeviceIndex.value = backCameraIndex
    } else {
      selectedDeviceIndex.value = 0
    }

    const selectedDevice = videoInputDevices[selectedDeviceIndex.value]
    if (!selectedDevice) {
      return
    }
    isFrontCamera.value = detectFrontCamera(selectedDevice)
    const selectedDeviceId = videoInputDevices[selectedDeviceIndex.value]?.deviceId

    codeReader.value.decodeFromVideoDevice(
      selectedDeviceId ?? null,
      videoRef.value,
      (result) => {
        if (result && scanning.value) {
          handleScanSuccess(result.getText())
        }
      }
    )
  } catch (err: any) {
    console.error('Continuous Barcode Scanner Error:', err)
    handleCameraError(err)
  }
}

watch(open, (newValue) => {
  if (newValue) {
    nextTick(() => {
      continuousScanning()
    })
  } else {
    stopScanning()
  }
})

onUnmounted(() => {
  stopScanning()
})

const currentCameraName = computed(() => {
  if (videoDevices.value.length === 0) return ''
  const device = videoDevices.value[selectedDeviceIndex.value]
  return device?.label || `Camera ${selectedDeviceIndex.value + 1}`
})

defineExpose({
  openModal
})
</script>

<template>
  <UModal
    v-model:open="open"
    title="Scan Asset Barcode"
    description="Point your camera at the barcode to scan asset information"
    @close="closeModal"
  >
    <UButton
      v-if="!props.hideTrigger"
      label="Scan Asset"
      variant="soft"
      icon="i-lucide-scan-barcode"
      @click="openModal"
    />

    <template #body>
      <div class="space-y-4">
        <div class="relative bg-gray-100 rounded-lg overflow-hidden" style="aspect-ratio: 4/3;">
          <video
            v-if="open"
            ref="videoRef"
            class="w-full h-full object-cover"
            :style="{ transform: isFrontCamera ? 'scaleX(-1)' : 'scaleX(1)' }"
            autoplay
            muted
            playsinline
          />

          <div
            v-if="!loading && !cameraError && scanning"
            class="absolute top-4 left-4 bg-black bg-opacity-60 text-white text-xs px-3 py-1.5 rounded-full z-10"
          >
            {{ currentCameraName }}
          </div>

          <div
            v-if="loading"
            class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50"
          >
            <div class="text-center text-white">
              <UIcon name="i-lucide-camera" class="w-12 h-12 mx-auto mb-2 animate-pulse" />
              <p class="text-sm">
                Starting camera...
              </p>
            </div>
          </div>

          <!-- <div
            v-if="!loading && !cameraError && scanning"
            class="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div class="border-2 border-red-500 border-dashed rounded-lg w-64 h-24 flex items-center justify-center animate-pulse">
              <div class="text-white text-sm text-center bg-black bg-opacity-50 px-3 py-2 rounded">
                <UIcon name="i-lucide-scan-barcode" class="w-8 h-8 mx-auto mb-2" />
                <p>Position barcode here</p>
              </div>
            </div>
          </div> -->

          <div
            v-if="cameraError"
            class="absolute inset-0 flex items-center justify-center bg-red-50"
          >
            <div class="text-center p-4 max-w-sm">
              <UIcon name="i-lucide-camera-off" class="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 class="font-semibold text-red-700 mb-2">
                Camera Error
              </h3>
              <p class="text-red-600 text-sm mb-4">
                {{ cameraError }}
              </p>
              <UButton
                label="Retry"
                size="sm"
                icon="i-lucide-refresh-cw"
                @click="retryCamera"
              />
            </div>
          </div>
        </div>

        <div class="bg-green-50 border border-green-200 rounded-lg p-3">
          <div class="flex items-start space-x-2">
            <UIcon name="i-lucide-info" class="w-5 h-5 text-green-500 mt-0.5" />
            <div class="text-sm text-green-700">
              <p class="font-medium mb-1">
                How to scan barcode:
              </p>
              <ul class="text-xs space-y-1">
                <li>• Hold your device steady</li>
                <li>• Point camera at the barcode</li>
                <li>• Barcode will be detected automatically anywhere on screen</li>
                <li>• Ensure good lighting and focus</li>
                <li>• Supports: Code128, EAN-13, UPC-A, Code39, etc.</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="closeModal"
          />
          <UButton
            v-if="cameraError"
            label="Try Again"
            color="primary"
            variant="solid"
            icon="i-lucide-refresh-cw"
            @click="retryCamera"
          />
        </div>
      </div>
    </template>
  </UModal>

  <UModal
    v-model:open="showLoadingModal"
    :ui="{
      content: 'bg-transparent border-0 shadow-none border-none'
    }"
  >
    <template #content>
      <div class="flex flex-col items-center justify-center text-center space-y-2">
        <UIcon
          name="i-lucide-loader"
          class="w-12 h-12 text-green-500 animate-spin"
        />
        <span>Please Wait...</span>
      </div>
    </template>
  </UModal>

  <!-- Modal Konfirmasi Asset Tidak Ditemukan -->
  <UModal
    v-model:open="showNotFoundModal"
    title="Asset Tidak Ditemukan"
    description="Asset dengan barcode ini tidak ditemukan dalam sistem"
  >
    <template #content>
      <div class="p-5">
        <div class="space-y-1">
          <h3 class="text-lg font-semibold">
            {{ scannedResult }}
          </h3>
          <p class="text-gray-500 text-sm">
            Asset not found. Would you like to add it as a new asset?
          </p>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="handleRetryScanning"
          />
          <UButton
            label="Add New"
            color="primary"
            variant="solid"
            icon="i-lucide-plus"
            @click="handleAddNewAsset"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
