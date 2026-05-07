<script setup lang="ts">
import { BrowserMultiFormatReader } from '@zxing/library'
import type { TabsItem } from '@nuxt/ui'
import { bookService } from '~/services/BookService'

const { t } = useI18n()

const emit = defineEmits<{
  scanned: [value: string]
  close: []
}>()

// ─── Shared state ─────────────────────────────────────────────────────────────
const open = ref(false)
const showLoadingModal = ref(false)
const activeTab = ref('conventional')

const toast = useToast()

const tabItems = computed<TabsItem[]>(() => [
  { label: t('component.barcodeScanner.conventional'), icon: 'i-lucide-scan-barcode', value: 'conventional' },
  { label: t('component.barcodeScanner.withAI'), icon: 'i-lucide-sparkles', value: 'ai' },
])

// ─── Conventional (barcode) state ─────────────────────────────────────────────
const barcodeLoading = ref(false)
const cameraError = ref('')
const scanning = ref(false)
const videoRef = ref<HTMLVideoElement>()
const codeReader = ref<BrowserMultiFormatReader>()
const videoDevices = ref<MediaDeviceInfo[]>([])
const selectedDeviceIndex = ref(0)

// ─── AI (photo) state ─────────────────────────────────────────────────────────
const aiVideoRef = ref<HTMLVideoElement>()
const aiStream = ref<MediaStream | null>(null)
const aiCameraError = ref('')
const aiLoading = ref(false)
const capturedImage = ref<string | null>(null)
const aiAnalyzing = ref(false)

onMounted(() => {
  codeReader.value = new BrowserMultiFormatReader()
})

// ─── Camera helpers ───────────────────────────────────────────────────────────
const findBackCamera = (devices: MediaDeviceInfo[]) => {
  const idx = devices.findIndex(d => {
    const label = d.label.toLowerCase()
    return label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('belakang')
  })
  return idx !== -1 ? idx : 0
}

const enableAutoFocus = async () => {
  if (!videoRef.value) return
  const stream = videoRef.value.srcObject as MediaStream | null
  if (!stream) return
  const track = stream.getVideoTracks()[0]
  if (!track) return
  const capabilities = track.getCapabilities() as any
  if (capabilities.focusMode?.includes('continuous')) {
    await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] })
  }
}

// ─── Conventional: barcode scanning ──────────────────────────────────────────
const handleCameraError = (err: any) => {
  scanning.value = false
  barcodeLoading.value = false
  if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
    cameraError.value = 'Akses kamera ditolak. Berikan izin kamera lalu coba lagi.'
  } else if (err.name === 'NotFoundError' || err.message?.includes('No camera found')) {
    cameraError.value = 'Tidak ada kamera yang ditemukan di perangkat ini.'
  } else if (err.name === 'NotReadableError') {
    cameraError.value = 'Kamera sedang digunakan aplikasi lain.'
  } else {
    cameraError.value = 'Gagal mengakses kamera. Periksa izin kamera Anda.'
  }
}

const stopScanning = () => {
  codeReader.value?.reset()
  scanning.value = false
}

const startScanning = async () => {
  if (!codeReader.value || !videoRef.value) return
  try {
    scanning.value = true
    barcodeLoading.value = false
    cameraError.value = ''

    const devices = await codeReader.value.listVideoInputDevices()
    if (devices.length === 0) throw new Error('No camera found on this device')

    videoDevices.value = devices
    selectedDeviceIndex.value = findBackCamera(devices)
    const deviceId = devices[selectedDeviceIndex.value]?.deviceId ?? null

    codeReader.value.decodeFromVideoDevice(deviceId, videoRef.value, (result) => {
      if (result && scanning.value) {
        stopScanning()
        closeModal()
        emit('scanned', result.getText())
      }
    })

    if (videoRef.value.readyState >= 1) {
      await enableAutoFocus()
    } else {
      videoRef.value.addEventListener('loadedmetadata', async () => {
        await enableAutoFocus()
      }, { once: true })
    }
  } catch (err: any) {
    console.error('Barcode Scanner Error:', err)
    handleCameraError(err)
  }
}

const retryCamera = async () => {
  cameraError.value = ''
  barcodeLoading.value = true
  await nextTick()
  await startScanning()
}

const currentCameraName = computed(() => {
  if (!videoDevices.value.length) return ''
  return videoDevices.value[selectedDeviceIndex.value]?.label || `Camera ${selectedDeviceIndex.value + 1}`
})

// ─── AI tab: photo capture ────────────────────────────────────────────────────
const handleAiCameraError = (err: any) => {
  aiLoading.value = false
  if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
    aiCameraError.value = 'Akses kamera ditolak. Berikan izin kamera lalu coba lagi.'
  } else if (err.name === 'NotFoundError') {
    aiCameraError.value = 'Tidak ada kamera yang ditemukan di perangkat ini.'
  } else {
    aiCameraError.value = 'Gagal mengakses kamera. Periksa izin kamera Anda.'
  }
}

const startAiCamera = async () => {
  if (!aiVideoRef.value) return
  aiCameraError.value = ''
  aiLoading.value = true
  capturedImage.value = null

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDeviceList = devices.filter(d => d.kind === 'videoinput')
    const backIdx = findBackCamera(videoDeviceList)
    const deviceId = videoDeviceList[backIdx]?.deviceId

    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId }, facingMode: 'environment' }
        : { facingMode: 'environment' },
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    aiStream.value = stream
    aiVideoRef.value.srcObject = stream
    await aiVideoRef.value.play()

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

const takePhoto = () => {
  if (!aiVideoRef.value) return

  const canvas = document.createElement('canvas')
  canvas.width = aiVideoRef.value.videoWidth
  canvas.height = aiVideoRef.value.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.drawImage(aiVideoRef.value, 0, 0)
  capturedImage.value = canvas.toDataURL('image/jpeg', 0.9)
  stopAiCamera()

  canvas.toBlob(async (blob) => {
    if (!blob) return
    const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' })

    aiAnalyzing.value = true
    open.value = false
    showLoadingModal.value = true

    try {
      const res = await bookService.scanBarcodeByImage(file)

      if (res.success && res.data?.barcode) {
        showLoadingModal.value = false
        emit('scanned', res.data.barcode)
      } else {
        showLoadingModal.value = false
        capturedImage.value = null
        open.value = true
        await nextTick()
        startAiCamera()
        toast.add({ title: t('component.barcodeScanner.aiError'), description: t('component.barcodeScanner.aiErrorMessage'), color: 'error' })
      }
    } catch (err: any) {
      console.error('AI Scan Error:', err)
      showLoadingModal.value = false
      capturedImage.value = null
      open.value = true
      await nextTick()
      startAiCamera()
      toast.add({ title: t('component.barcodeScanner.aiError'), description: t('component.barcodeScanner.aiErrorMessage'), color: 'error' })
    } finally {
      aiAnalyzing.value = false
    }
  }, 'image/jpeg', 0.9)
}

// ─── Modal lifecycle ──────────────────────────────────────────────────────────
const openModal = () => {
  barcodeLoading.value = true
  cameraError.value = ''
  aiCameraError.value = ''
  capturedImage.value = null
  activeTab.value = 'conventional'
  open.value = true
}

const closeModal = () => {
  stopScanning()
  stopAiCamera()
  open.value = false
  cameraError.value = ''
  aiCameraError.value = ''
  barcodeLoading.value = false
  capturedImage.value = null
  emit('close')
}

watch(open, (val) => {
  if (val) {
    nextTick(() => {
      if (activeTab.value === 'conventional') {
        startScanning()
      } else {
        startAiCamera()
      }
    })
  } else {
    stopScanning()
    stopAiCamera()
  }
})

watch(activeTab, (val) => {
  if (!open.value) return
  if (val === 'conventional') {
    stopAiCamera()
    capturedImage.value = null
    cameraError.value = ''
    barcodeLoading.value = true
    nextTick(() => startScanning())
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
    :title="t('component.barcodeScanner.title')"
    :description="t('component.barcodeScanner.subtitle')"
    @close="closeModal"
  >
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
              class="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full z-10"
            >
              {{ currentCameraName }}
            </div>

            <!-- Loading -->
            <div
              v-if="barcodeLoading"
              class="absolute inset-0 flex items-center justify-center bg-gray-900/80"
            >
              <div class="text-center text-white">
                <UIcon name="i-lucide-camera" class="w-12 h-12 mx-auto mb-2 animate-pulse" />
                <p class="text-sm">{{ t('component.barcodeScanner.opening') }}</p>
              </div>
            </div>

            <!-- Camera error -->
            <div
              v-if="cameraError"
              class="absolute inset-0 flex items-center justify-center bg-red-50"
            >
              <div class="text-center p-4 max-w-sm">
                <UIcon name="i-lucide-camera-off" class="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 class="font-semibold text-red-700 mb-2">{{ t('component.barcodeScanner.error') }}</h3>
                <p class="text-red-600 text-sm mb-4">{{ cameraError }}</p>
                <UButton :label="t('component.barcodeScanner.tryAgain')" size="sm" icon="i-lucide-refresh-cw" @click="retryCamera" />
              </div>
            </div>

            <!-- Scan frame overlay -->
            <div
              v-if="scanning && !barcodeLoading && !cameraError"
              class="absolute inset-0 pointer-events-none flex items-center justify-center"
            >
              <div class="relative w-56 h-36">
                <span class="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-primary rounded-tl-sm" />
                <span class="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-primary rounded-tr-sm" />
                <span class="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-primary rounded-bl-sm" />
                <span class="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-primary rounded-br-sm" />
              </div>
            </div>
          </div>

          <!-- Instruction -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
            <div class="flex items-start space-x-2">
              <UIcon name="i-lucide-info" class="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div class="text-sm text-green-700">
                <p class="font-medium mb-1">{{ t('component.barcodeScanner.howToScan') }}</p>
                <ul class="text-xs space-y-1">
                  <li>• {{ t('component.barcodeScanner.scanTip1') }}</li>
                  <li>• {{ t('component.barcodeScanner.scanTip2') }}</li>
                  <li>• {{ t('component.barcodeScanner.scanTip3') }}</li>
                  <li>• {{ t('component.barcodeScanner.scanTip4') }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════ WITH AI TAB ══════════════ -->
        <div v-else-if="activeTab === 'ai'">
          <div class="relative bg-gray-900 rounded-lg overflow-hidden" style="aspect-ratio: 4/3;">
            <!-- Live camera preview -->
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
              class="absolute inset-0 flex items-center justify-center bg-gray-900/70"
            >
              <div class="text-center text-white">
                <UIcon name="i-lucide-camera" class="w-12 h-12 mx-auto mb-2 animate-pulse" />
                <p class="text-sm">{{ t('component.barcodeScanner.opening') }}</p>
              </div>
            </div>

            <!-- AI camera error -->
            <div
              v-if="aiCameraError"
              class="absolute inset-0 flex items-center justify-center bg-red-50"
            >
              <div class="text-center p-4 max-w-sm">
                <UIcon name="i-lucide-camera-off" class="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 class="font-semibold text-red-700 mb-2">{{ t('component.barcodeScanner.error') }}</h3>
                <p class="text-red-600 text-sm mb-4">{{ aiCameraError }}</p>
                <UButton :label="t('component.barcodeScanner.tryAgain')" size="sm" icon="i-lucide-refresh-cw" @click="startAiCamera" />
              </div>
            </div>

            <!-- Shutter button -->
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

          </div>

          <!-- AI instruction -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <div class="flex items-start space-x-2">
              <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div class="text-sm text-blue-700">
                <p class="font-medium mb-1">{{ t('component.barcodeScanner.howToScanAI') }}</p>
                <ul class="text-xs space-y-1">
                  <li>• {{ t('component.barcodeScanner.aiTip1') }}</li>
                  <li>• {{ t('component.barcodeScanner.aiTip2') }}</li>
                  <li>• {{ t('component.barcodeScanner.aiTip3') }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2">
          <UButton
            :label="t('component.barcodeScanner.cancel')"
            color="neutral"
            variant="subtle"
            @click="closeModal"
          />
          <UButton
            v-if="activeTab === 'conventional' && cameraError"
            :label="t('component.barcodeScanner.tryAgain')"
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
        <UIcon name="i-lucide-loader" class="w-12 h-12 text-primary animate-spin" />
        <span>{{ t('component.barcodeScanner.analyzingAI') }}</span>
      </div>
    </template>
  </UModal>
</template>
