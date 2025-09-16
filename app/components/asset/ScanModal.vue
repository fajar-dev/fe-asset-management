<script setup lang="ts">
import { QrcodeStream } from 'vue-qrcode-reader'

const open = ref(false)
const loading = ref(false)
const showLoadingModal = ref(false)
const error = ref<string>('')
const cameraError = ref<string>('')
const scannedResult = ref<string>('')
const toast = useToast()
const router = useRouter()
const { getAssetById } = useAsset()

const onDetect = async (detectedCodes: any[]) => {
  if (detectedCodes.length > 0) {
    const result = detectedCodes[0].rawValue
    scannedResult.value = result

    open.value = false

    showLoadingModal.value = true

    try {
      const data = await getAssetById(result)

      if (data) {
        toast.add({
          title: 'QR Code Scanned Successfully',
          description: `Asset ID: ${result}`,
          color: 'success'
        })
        showLoadingModal.value = false
        await router.push(`/asset/${result}/detail`)
      } else {
        handleScanError('Asset not found or invalid QR code')
      }
    } catch (err) {
      console.error('API Error:', err)
      handleScanError('Failed to fetch asset data. Please try again.')
    }
  }
}

const handleScanError = (errorMessage: string) => {
  showLoadingModal.value = false

  toast.add({
    title: 'Scan Failed',
    description: errorMessage,
    color: 'error'
  })

  setTimeout(() => {
    openModal()
  }, 1000)
}

const onError = (err: any) => {
  console.error('QR Scanner Error:', err)

  if (err.name === 'NotAllowedError') {
    cameraError.value = 'Camera access denied. Please allow camera permissions and try again.'
  } else if (err.name === 'NotFoundError') {
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

const onCameraOn = () => {
  loading.value = false
  error.value = ''
  cameraError.value = ''
}

const onCameraOff = () => {
  loading.value = true
}

const closeModal = () => {
  open.value = false
  error.value = ''
  cameraError.value = ''
  loading.value = false
}

const openModal = () => {
  loading.value = true
  cameraError.value = ''
  error.value = ''
  open.value = true
}

const retryCamera = () => {
  cameraError.value = ''
  loading.value = true
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Scan Asset QR Code"
    description="Point your camera at the QR code to scan asset information"
    @close="closeModal"
  >
    <UButton
      label="Scan Asset"
      variant="soft"
      icon="i-lucide-scan-qr-code"
      @click="openModal"
    />

    <template #body>
      <div class="space-y-4">
        <div class="relative bg-gray-100 rounded-lg overflow-hidden" style="aspect-ratio: 4/3;">
          <QrcodeStream
            v-if="open"
            class="w-full h-full"
            @detect="onDetect"
            @error="onError"
            @camera-on="onCameraOn"
            @camera-off="onCameraOff"
          >
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

            <div
              v-if="!loading && !cameraError"
              class="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div class="border-2 border-white border-dashed rounded-lg w-48 h-48 flex items-center justify-center animate-pulse">
                <div class="text-white text-sm text-center">
                  <UIcon name="i-lucide-scan-qr-code" class="w-8 h-8 mx-auto mb-2" />
                  <p>Position QR code here</p>
                </div>
              </div>
            </div>
          </QrcodeStream>

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
                How to scan:
              </p>
              <ul class="text-xs space-y-1">
                <li>• Hold your device steady</li>
                <li>• Point camera at the QR code</li>
                <li>• Wait for automatic detection</li>
                <li>• Ensure good lighting for best results</li>
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
</template>

<style scoped>
.qrcode-stream-camera {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:deep(.qrcode-stream-camera) {
  width: 100% !important;
  height: 100% !important;
}
</style>
