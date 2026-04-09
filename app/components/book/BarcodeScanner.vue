<script setup lang="ts">
import { BrowserMultiFormatReader } from '@zxing/library'
import type { TabsItem } from '@nuxt/ui'

const emit = defineEmits<{
  scanned: [value: string]
  close: []
}>()

const open = ref(false)
const activeTab = ref('scan')
const tabItems = ref<TabsItem[]>([
  { label: 'Scan', icon: 'i-lucide-scan-barcode', value: 'scan' },
  { label: 'Cari', icon: 'i-lucide-search', value: 'manual' },
])

// ─── Scan tab state ───────────────────────────────────────────────────────────
const barcodeLoading = ref(false)
const cameraError = ref('')
const scanning = ref(false)
const videoRef = ref<HTMLVideoElement>()
const codeReader = ref<BrowserMultiFormatReader>()
const videoDevices = ref<MediaDeviceInfo[]>([])
const selectedDeviceIndex = ref(0)

// ─── Manual tab state ─────────────────────────────────────────────────────────
const manualCode = ref('')

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
        const value = result.getText()
        stopScanning()
        closeModal()
        emit('scanned', value)
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

// ─── Manual submit ────────────────────────────────────────────────────────────
function submitManual() {
  const code = manualCode.value.trim()
  if (!code) return
  closeModal()
  emit('scanned', code)
}

// ─── Modal lifecycle ──────────────────────────────────────────────────────────
const openModal = () => {
  barcodeLoading.value = true
  cameraError.value = ''
  manualCode.value = ''
  activeTab.value = 'scan'
  open.value = true
}

const closeModal = () => {
  stopScanning()
  open.value = false
  cameraError.value = ''
  barcodeLoading.value = false
  manualCode.value = ''
  emit('close')
}

watch(open, (val) => {
  if (val && activeTab.value === 'scan') {
    nextTick(() => startScanning())
  } else if (!val) {
    stopScanning()
  }
})

watch(activeTab, (val) => {
  if (!open.value) return
  if (val === 'scan') {
    barcodeLoading.value = true
    cameraError.value = ''
    nextTick(() => startScanning())
  } else {
    stopScanning()
  }
})

onUnmounted(() => stopScanning())

defineExpose({ openModal })
</script>

<template>
  <UModal
    v-model:open="open"
    title="Cari Buku"
    description="Cari Buku yang tersedia untuk dipinjam"
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

        <!-- ── Tab: Scan Kamera ── -->
        <div v-if="activeTab === 'scan'">
          <div class="relative bg-gray-900 rounded-lg overflow-hidden" style="aspect-ratio: 4/3;">
            <video
              v-if="open && activeTab === 'scan'"
              ref="videoRef"
              class="w-full h-full object-cover"
              autoplay
              muted
              playsinline
            />

            <!-- Camera name badge -->
            <div
              v-if="!barcodeLoading && !cameraError && scanning"
              class="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full"
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
                <p class="text-sm">Membuka kamera...</p>
              </div>
            </div>

            <!-- Camera error -->
            <div
              v-if="cameraError"
              class="absolute inset-0 flex items-center justify-center bg-red-50"
            >
              <div class="text-center p-4 max-w-sm">
                <UIcon name="i-lucide-camera-off" class="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 class="font-semibold text-red-700 mb-2">Kamera Error</h3>
                <p class="text-red-600 text-sm mb-4">{{ cameraError }}</p>
                <UButton label="Coba Lagi" size="sm" icon="i-lucide-refresh-cw" @click="retryCamera" />
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
                <div class="absolute inset-x-2 h-0.5 bg-primary/80 animate-[scan_2s_ease-in-out_infinite]" style="animation: scan 2s ease-in-out infinite;" />
              </div>
            </div>
          </div>

          <p class="text-xs text-muted text-center mt-2">
            Arahkan kamera ke barcode / QR code buku
          </p>
        </div>

        <!-- ── Tab: Isi Manual ── -->
        <div v-else-if="activeTab === 'manual'" class="space-y-3 py-2">
          <div class="flex items-center justify-center">
            <UIcon name="i-lucide-barcode" class="w-12 h-12 text-muted" />
          </div>
          <p class="text-sm text-muted text-center">
            Masukkan kode serial buku 
          </p>
          <UInput
            v-model="manualCode"
            placeholder="Contoh: N12345678BA"
            icon="i-lucide-hash"
            autofocus
            size="lg"
            class="w-full"
            @keyup.enter="submitManual"
          />
          <UButton
            class="w-full justify-center"
            :disabled="!manualCode.trim()"
            icon="i-lucide-search"
            @click="submitManual"
          >
            Cari
          </UButton>
        </div>

        <!-- Footer -->
        <div class="flex justify-end">
          <UButton
            label="Batal"
            color="neutral"
            variant="subtle"
            @click="closeModal"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
@keyframes scan {
  0%   { top: 4px; opacity: 1; }
  50%  { top: calc(100% - 4px); opacity: 0.7; }
  100% { top: 4px; opacity: 1; }
}
</style>
