<script setup lang="ts">
import { BrowserMultiFormatReader } from '@zxing/library'
import type { TabsItem } from '@nuxt/ui'

// ─── Shared state ────────────────────────────────────────────────────────────
const open = ref(false)
const showLoadingModal = ref(false)
const showNotFoundModal = ref(false)
const error = ref<string>('')
const scannedResult = ref<string>('')

const activeTab = ref('conventional')

const tabItems = ref<TabsItem[]>([
  { label: 'Conventional', icon: 'i-lucide-scan-barcode', value: 'conventional' },
  { label: 'With AI', icon: 'i-lucide-sparkles', value: 'ai' }
])

// ─── Conventional (barcode) state ────────────────────────────────────────────
const barcodeLoading = ref(false)
const cameraError = ref<string>('')
const videoRef = ref<HTMLVideoElement>()
const codeReader = ref<BrowserMultiFormatReader>()
const scanning = ref(false)
const videoDevices = ref<MediaDeviceInfo[]>([])
const selectedDeviceIndex = ref(0)

// ─── AI (photo) state ─────────────────────────────────────────────────────────
const aiVideoRef = ref<HTMLVideoElement>()
const aiStream = ref<MediaStream | null>(null)
const aiCameraError = ref<string>('')
const aiLoading = ref(false)
const capturedImage = ref<string | null>(null)
const capturedFile = ref<File | null>(null)
const aiAnalyzing = ref(false)

const router = useRouter()
const { getAssetByCode, getAssetByImage } = useAsset()

const emit = defineEmits<{
  (e: 'add-asset', code: string): void
}>()

const props = defineProps<{
  hideTrigger?: boolean
}>()

onMounted(() => {
  codeReader.value = new BrowserMultiFormatReader()
})

// ─── Shared helpers ───────────────────────────────────────────────────────────
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

// ─── Conventional: barcode scanning ──────────────────────────────────────────
const findBackCamera = (devices: MediaDeviceInfo[]) => {
  const idx = devices.findIndex(device => {
    const label = device.label.toLowerCase()
    return label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('belakang')
  })
  return idx !== -1 ? idx : 0
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

const handleCameraError = (err: any) => {
  scanning.value = false
  barcodeLoading.value = false

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

const stopScanning = () => {
  if (codeReader.value) {
    codeReader.value.reset()
  }
  scanning.value = false
}

const enableAutoFocus = async () => {
  if (!videoRef.value) return
  const stream = videoRef.value.srcObject as MediaStream | null
  if (!stream) return

  const track = stream.getVideoTracks()[0]
  if (!track) return

  const capabilities = track.getCapabilities() as any

  if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
    await track.applyConstraints({
      advanced: [{ focusMode: 'continuous' } as any]
    })
  }
}

const continuousScanning = async () => {
  if (!codeReader.value || !videoRef.value) return

  try {
    scanning.value = true
    barcodeLoading.value = false
    cameraError.value = ''

    const videoInputDevices = await codeReader.value.listVideoInputDevices()
    if (videoInputDevices.length === 0) throw new Error('No camera found on this device')

    videoDevices.value = videoInputDevices
    selectedDeviceIndex.value = findBackCamera(videoInputDevices)

    const selectedDevice = videoInputDevices[selectedDeviceIndex.value]
    if (!selectedDevice) return
    const selectedDeviceId = selectedDevice.deviceId

    codeReader.value.decodeFromVideoDevice(
      selectedDeviceId ?? null,
      videoRef.value,
      (result) => {
        if (result && scanning.value) {
          handleScanSuccess(result.getText())
        }
      }
    )

    if (videoRef.value) {
      const onVideoReady = async () => {
        await enableAutoFocus()
        videoRef.value?.removeEventListener('loadedmetadata', onVideoReady)
      }
      if (videoRef.value.readyState >= 1) {
        await enableAutoFocus()
      } else {
        videoRef.value.addEventListener('loadedmetadata', onVideoReady)
      }
    }
  } catch (err: any) {
    console.error('Continuous Barcode Scanner Error:', err)
    handleCameraError(err)
  }
}

const retryCamera = async () => {
  cameraError.value = ''
  barcodeLoading.value = true
  await nextTick()
  await continuousScanning()
}

const currentCameraName = computed(() => {
  if (videoDevices.value.length === 0) return ''
  const device = videoDevices.value[selectedDeviceIndex.value]
  return device?.label || `Camera ${selectedDeviceIndex.value + 1}`
})

// ─── AI tab: photo capture ─────────────────────────────────────────────────
const handleAiCameraError = (err: any) => {
  aiLoading.value = false
  if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
    aiCameraError.value = 'Camera access denied. Please allow camera permissions and try again.'
  } else if (err.name === 'NotFoundError') {
    aiCameraError.value = 'No camera found on this device.'
  } else {
    aiCameraError.value = 'Failed to access camera. Please check your permissions and try again.'
  }
}

const startAiCamera = async () => {
  if (!aiVideoRef.value) return
  aiCameraError.value = ''
  aiLoading.value = true
  capturedImage.value = null
  capturedFile.value = null

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDeviceList = devices.filter(d => d.kind === 'videoinput')
    const backIdx = findBackCamera(videoDeviceList)
    const deviceId = videoDeviceList[backIdx]?.deviceId

    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId }, facingMode: 'environment' }
        : { facingMode: 'environment' }
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    aiStream.value = stream
    aiVideoRef.value.srcObject = stream
    await aiVideoRef.value.play()

    // Enable autofocus
    const track = stream.getVideoTracks()[0]
    if (track) {
      const capabilities = track.getCapabilities() as any
      if (capabilities.focusMode?.includes('continuous')) {
        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] })
      }
    }
  } catch (err: any) {
    console.error('AI Camera Error:', err)
    handleAiCameraError(err)
  } finally {
    aiLoading.value = false
  }
}

const stopAiCamera = () => {
  if (aiStream.value) {
    aiStream.value.getTracks().forEach(track => track.stop())
    aiStream.value = null
  }
  if (aiVideoRef.value) {
    aiVideoRef.value.srcObject = null
  }
}

const takePhoto = async () => {
  if (!aiVideoRef.value) return

  const canvas = document.createElement('canvas')
  canvas.width = aiVideoRef.value.videoWidth
  canvas.height = aiVideoRef.value.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.drawImage(aiVideoRef.value, 0, 0)
  capturedImage.value = canvas.toDataURL('image/jpeg', 0.9)

  stopAiCamera()

  // Langsung kirim ke API tanpa menunggu konfirmasi
  canvas.toBlob(async (blob) => {
    if (!blob) return
    const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' })

    aiAnalyzing.value = true
    open.value = false
    showLoadingModal.value = true

    try {
      const data = await getAssetByImage(file)
      if (data) {
        showLoadingModal.value = false
        await router.push(`/asset/${data.data.id}/detail`)
      } else {
        scannedResult.value = 'AI Scan'
        handleScanError()
      }
    } catch (err) {
      console.error('AI API Error:', err)
      scannedResult.value = 'AI Scan'
      handleScanError()
    } finally {
      aiAnalyzing.value = false
    }
  }, 'image/jpeg', 0.9)
}

// ─── Modal lifecycle ───────────────────────────────────────────────────────
const closeModal = () => {
  stopScanning()
  stopAiCamera()
  open.value = false
  error.value = ''
  cameraError.value = ''
  aiCameraError.value = ''
  barcodeLoading.value = false
  capturedImage.value = null
  capturedFile.value = null
}

const openModal = async () => {
  barcodeLoading.value = true
  cameraError.value = ''
  aiCameraError.value = ''
  error.value = ''
  capturedImage.value = null
  activeTab.value = 'conventional'
  open.value = true
}

// When modal opens, start the right camera
watch(open, (val) => {
  if (val) {
    nextTick(() => {
      if (activeTab.value === 'conventional') {
        continuousScanning()
      } else {
        startAiCamera()
      }
    })
  } else {
    stopScanning()
    stopAiCamera()
  }
})

// Switch cameras on tab change
watch(activeTab, (val) => {
  if (!open.value) return
  if (val === 'conventional') {
    stopAiCamera()
    capturedImage.value = null
    capturedFile.value = null
    cameraError.value = ''
    barcodeLoading.value = true
    nextTick(() => continuousScanning())
  } else {
    stopScanning()
    cameraError.value = ''
    capturedImage.value = null
    nextTick(() => startAiCamera())
  }
})

onUnmounted(() => {
  stopScanning()
  stopAiCamera()
})

defineExpose({ openModal })
</script>

<template>
  <UModal
    v-model:open="open"
    title="Scan Asset"
    description="Pilih metode scanning asset Anda"
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
        <!-- Tabs -->
        <UTabs
          v-model="activeTab"
          :items="tabItems"
          :content="false"
          class="w-full"
        />

        <!-- ══════════════ CONVENTIONAL TAB ══════════════ -->
        <div v-if="activeTab === 'conventional'">
          <div class="relative bg-gray-100 rounded-lg overflow-hidden" style="aspect-ratio: 4/3;">
            <video
              v-if="open && activeTab === 'conventional'"
              ref="videoRef"
              class="w-full h-full object-cover"
              autoplay
              muted
              playsinline
            />

            <!-- Camera name badge -->
            <div
              v-if="!barcodeLoading && !cameraError && scanning"
              class="absolute top-4 left-4 bg-black bg-opacity-60 text-white text-xs px-3 py-1.5 rounded-full z-10"
            >
              {{ currentCameraName }}
            </div>

            <!-- Loading overlay -->
            <div
              v-if="barcodeLoading"
              class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50"
            >
              <div class="text-center text-white">
                <UIcon name="i-lucide-camera" class="w-12 h-12 mx-auto mb-2 animate-pulse" />
                <p class="text-sm">Starting camera...</p>
              </div>
            </div>

            <!-- Camera error -->
            <div
              v-if="cameraError"
              class="absolute inset-0 flex items-center justify-center bg-red-50"
            >
              <div class="text-center p-4 max-w-sm">
                <UIcon name="i-lucide-camera-off" class="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 class="font-semibold text-red-700 mb-2">Camera Error</h3>
                <p class="text-red-600 text-sm mb-4">{{ cameraError }}</p>
                <UButton label="Retry" size="sm" icon="i-lucide-refresh-cw" @click="retryCamera" />
              </div>
            </div>
          </div>

          <!-- Instruction -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
            <div class="flex items-start space-x-2">
              <UIcon name="i-lucide-info" class="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div class="text-sm text-green-700">
                <p class="font-medium mb-1">How to scan barcode:</p>
                <ul class="text-xs space-y-1">
                  <li>• Hold your device steady</li>
                  <li>• Point camera at the barcode</li>
                  <li>• Barcode will be detected automatically</li>
                  <li>• Ensure good lighting and focus</li>
                  <li>• Supports: Code128, EAN-13, UPC-A, Code39, etc.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════ WITH AI TAB ══════════════ -->
        <div v-else-if="activeTab === 'ai'">
          <div class="relative bg-gray-900 rounded-lg overflow-hidden" style="aspect-ratio: 4/3;">

            <!-- Live camera preview (before capture) -->
            <video
              v-if="open && !capturedImage"
              ref="aiVideoRef"
              class="w-full h-full object-cover"
              autoplay
              muted
              playsinline
            />

            <!-- Captured image preview -->
            <img
              v-if="capturedImage"
              :src="capturedImage"
              class="w-full h-full object-cover"
              alt="Captured photo"
            />

            <!-- AI loading overlay -->
            <div
              v-if="aiLoading"
              class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70"
            >
              <div class="text-center text-white">
                <UIcon name="i-lucide-camera" class="w-12 h-12 mx-auto mb-2 animate-pulse" />
                <p class="text-sm">Starting camera...</p>
              </div>
            </div>

            <!-- AI camera error -->
            <div
              v-if="aiCameraError"
              class="absolute inset-0 flex items-center justify-center bg-red-50"
            >
              <div class="text-center p-4 max-w-sm">
                <UIcon name="i-lucide-camera-off" class="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 class="font-semibold text-red-700 mb-2">Camera Error</h3>
                <p class="text-red-600 text-sm mb-4">{{ aiCameraError }}</p>
                <UButton label="Retry" size="sm" icon="i-lucide-refresh-cw" @click="startAiCamera" />
              </div>
            </div>

            <!-- Shutter button (live view) -->
            <div
              v-if="!capturedImage && !aiLoading && !aiCameraError"
              class="absolute bottom-4 inset-x-0 flex justify-center"
            >
              <button
                class="w-16 h-16 rounded-full bg-white border-4 border-gray-300 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                @click="takePhoto"
              >
                <div class="w-11 h-11 rounded-full bg-white border-2 border-gray-400" />
              </button>
            </div>

            <!-- Setelah foto: loading overlay analisis AI -->
            <div
              v-if="capturedImage && aiAnalyzing"
              class="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center gap-3"
            >
              <UIcon name="i-lucide-sparkles" class="w-10 h-10 text-blue-400 animate-pulse" />
              <p class="text-white text-sm font-medium">Menganalisis dengan AI...</p>
            </div>
          </div>

          <!-- AI instruction -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <div class="flex items-start space-x-2">
              <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div class="text-sm text-blue-700">
                <p class="font-medium mb-1">Cara scan dengan AI:</p>
                <ul class="text-xs space-y-1">
                  <li>• Arahkan kamera ke asset</li>
                  <li>• Tekan tombol kamera untuk mengambil foto</li>
                  <li>• AI akan mengidentifikasi asset dari foto</li>
                  <li>• Pastikan label/stiker asset terlihat jelas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer buttons -->
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="closeModal"
          />
          <UButton
            v-if="activeTab === 'conventional' && cameraError"
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

  <!-- Loading modal -->
  <UModal
    v-model:open="showLoadingModal"
    :ui="{ content: 'bg-transparent border-0 shadow-none border-none' }"
  >
    <template #content>
      <div class="flex flex-col items-center justify-center text-center space-y-2">
        <UIcon name="i-lucide-loader" class="w-12 h-12 text-green-500 animate-spin" />
        <span>Please Wait...</span>
      </div>
    </template>
  </UModal>

  <!-- Asset Not Found modal -->
  <UModal
    v-model:open="showNotFoundModal"
    title="Asset Tidak Ditemukan"
    description="Asset dengan barcode ini tidak ditemukan dalam sistem"
  >
    <template #content>
      <div class="p-5">
        <div class="space-y-1">
          <h3 class="text-lg font-semibold">{{ scannedResult }}</h3>
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
