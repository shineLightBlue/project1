<template>
  <div v-if="modelValue" class="import-audio-overlay" @click="emit('update:modelValue', false)">
    <section class="import-audio-modal" @click.stop>
      <div class="import-audio-header">
        <h3>{{ t('layout.sidebar.importAudioModal.title') }}</h3>
        <button
          type="button"
          class="import-audio-close-btn"
          @click="emit('update:modelValue', false)"
          :aria-label="t('common.close')"
        >
          <el-icon>
            <Close />
          </el-icon>
        </button>
      </div>

      <div
        class="import-audio-dropzone"
        :class="{ 'is-dragging': isDragging }"
        @click="triggerFileInput"
        @dragenter.prevent.stop="isDragging = true"
        @dragleave.prevent.stop="isDragging = false"
        @dragover.prevent.stop
        @drop.prevent.stop="handleDrop"
      >
        <img src="@/assets/images/icon_import_audio_upload.svg" alt="upload" class="drop-icon" />
        <div class="drop-text">
          <span class="drop-link">{{ t('layout.sidebar.importAudioModal.clickToUpload') }}</span>
          <span>{{ t('layout.sidebar.importAudioModal.or') }}</span>
          <span>{{ t('layout.sidebar.importAudioModal.dragFiles') }}</span>
        </div>
        <p class="drop-formats">{{ t('layout.sidebar.importAudioModal.supportedFormats') }}</p>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="hidden-input"
        accept=".mp3,.aac,.pcm,.wav,.mp4,.m4v,.mov,.ogg,.m4a,audio/*,video/mp4,video/quicktime"
        @change="handleFilePick"
      />

      <div v-if="items.length" class="import-audio-file-list">
        <div v-for="item in items" :key="item.id" class="import-audio-file-row">
          <img src="@/assets/images/icon_import_audio_file.svg" alt="file" class="file-icon" />
          <div class="file-main">
            <div class="file-name">{{ item.displayName }}</div>
            <div class="progress-bar">
              <span :style="{ width: `${item.progress}%` }" />
            </div>

            <div
              v-if="item.status === 'uploading' || item.status === 'transcoding'"
              class="file-progress-text"
            >
              {{ item.sizeText }} - {{ Math.round(item.progress) }}%
              {{
                item.status === 'transcoding'
                  ? t('layout.sidebar.importAudioModal.status.transcoding')
                  : t('layout.sidebar.importAudioModal.status.uploading')
              }}
            </div>

            <div v-else-if="item.status === 'success'" class="file-status-success">
              <img
                src="@/assets/images/icon_import_audio_success.svg"
                alt="success"
                class="status-icon"
              />
              {{ t('layout.sidebar.importAudioModal.status.success') }}
            </div>

            <div v-else class="file-status-error">
              <img
                src="@/assets/images/icon_import_audio_error.svg"
                alt="error"
                class="status-icon"
              />
              {{ item.errorMessage || t('layout.sidebar.importAudioModal.status.error') }}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Close } from '@element-plus/icons-vue'
import {
  detectAudioDurationSeconds,
  uploadCloudFileBySts,
  type UploadTask,
} from '@/api/cloudUpload'
import { useLoginStore } from '@/stores/login'
import { useCloudStore } from '@/stores/cloud'

type UploadStatus = 'uploading' | 'transcoding' | 'success' | 'error'

interface UploadQueueItem {
  id: string
  file: File
  displayName: string
  sizeText: string
  progress: number
  status: UploadStatus
  errorMessage: string
  fileUuid: string
  key: string
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()
const loginStore = useLoginStore()
const cloudStore = useCloudStore()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const items = ref<UploadQueueItem[]>([])
const activeTasks = new Map<string, UploadTask>()

const allowedExts = new Set(['mp3', 'aac', 'pcm', 'wav', 'mp4', 'm4v', 'mov', 'ogg', 'm4a'])
const maxSize = 100 * 1024 * 1024
const maxDuration = 5 * 60 * 60

const modelValue = computed(() => props.modelValue)

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return '0B'
  }
  if (size < 1024) {
    return `${size}B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)}KB`
  }
  return `${(size / (1024 * 1024)).toFixed(1)}MB`
}

function getDisplayName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '')
}

function getExtension(fileName: string) {
  const parts = fileName.split('.')
  if (parts.length < 2) {
    return ''
  }
  return (parts[parts.length - 1] || '').toLowerCase()
}

function updateItem(id: string, patch: Partial<UploadQueueItem>) {
  const index = items.value.findIndex((item) => item.id === id)
  if (index < 0) {
    return
  }
  const current = items.value[index]
  if (!current) {
    return
  }
  items.value[index] = {
    ...current,
    ...patch,
  }
}

async function sleep(ms: number) {
  return await new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function validateFile(file: File): Promise<string | null> {
  const extension = getExtension(file.name)
  if (!allowedExts.has(extension)) {
    return t('layout.sidebar.importAudioModal.errors.unsupportedFormat')
  }

  if (file.size > maxSize) {
    return t('layout.sidebar.importAudioModal.errors.fileSizeExceeded')
  }

  const duration = await detectAudioDurationSeconds(file)
  if (!duration || duration <= 0) {
    return t('layout.sidebar.importAudioModal.errors.unsupportedFormat')
  }
  if (duration > maxDuration) {
    return t('layout.sidebar.importAudioModal.errors.durationExceeded')
  }

  return null
}

function mapUploadError(error: unknown): string {
  const message = String((error as any)?.message ?? '')
  if (/network|http 0|ERR_NETWORK|failed to fetch/i.test(message)) {
    return t('layout.sidebar.importAudioModal.errors.networkError')
  }
  if (/credential has expired|server error|http 5/i.test(message)) {
    return t('layout.sidebar.importAudioModal.errors.serverError')
  }
  return t('layout.sidebar.importAudioModal.errors.uploadFailed')
}

async function startUpload(file: File) {
  const userId = String(loginStore.loginData.userId ?? '').trim()
  const itemId = generateId()

  const item: UploadQueueItem = {
    id: itemId,
    file,
    displayName: getDisplayName(file.name),
    sizeText: formatFileSize(file.size),
    progress: 0,
    status: 'uploading',
    errorMessage: '',
    fileUuid: '',
    key: '',
  }
  items.value.push(item)

  if (!userId) {
    updateItem(itemId, {
      status: 'error',
      errorMessage: t('layout.sidebar.importAudioModal.errors.uploadFailed'),
    })
    return
  }

  const validationError = await validateFile(file)
  if (validationError) {
    updateItem(itemId, {
      status: 'error',
      errorMessage: validationError,
    })
    return
  }

  try {
    const task = uploadCloudFileBySts({
      file,
      userId,
      folderId: '0',
      duration: '0',
      onProgress: (percent) => {
        updateItem(itemId, {
          progress: percent,
          status: 'uploading',
        })
      },
    })
    activeTasks.set(itemId, task)
    const result = await task.promise

    updateItem(itemId, {
      progress: 100,
      status: 'transcoding',
      fileUuid: String(result.fileUuid ?? ''),
      key: String(result.key ?? ''),
    })

    await sleep(800)
    updateItem(itemId, {
      progress: 100,
      status: 'success',
    })
    cloudStore.bumpRefresh()
  } catch (error) {
    updateItem(itemId, {
      status: 'error',
      errorMessage: mapUploadError(error),
    })
  } finally {
    activeTasks.delete(itemId)
  }
}

function extractFiles(list: FileList | null): File[] {
  if (!list || !list.length) {
    return []
  }
  return Array.from(list)
}

async function handleFileList(fileList: FileList | null) {
  const files = extractFiles(fileList)
  if (!files.length) {
    return
  }
  files.forEach((file) => {
    void startUpload(file)
  })
}

function handleFilePick(event: Event) {
  const input = event.target as HTMLInputElement
  console.log('input', event)

  if (errorFileTip(input.files)) {
    return
  }
  void handleFileList(input.files)
  input.value = ''
}

/**
 * 文件错误提示
 * @param files
 */
function errorFileTip(files: FileList | null) {
  let isErr = false

  if (files) {
    // 遍历所有文件获取扩展名
    Array.from(files).forEach((file) => {
      const extension = getExtension(file.name)
      if (!allowedExts.has(extension)) {
        ElMessage.error(t('layout.sidebar.importAudioModal.errors.unsupportedFormat'))
        isErr = true
      }
    })
  }
  return isErr
}

/**
 * 拖拽结束
 * @param event
 */
function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (errorFileTip(event.dataTransfer?.files ?? null)) {
    return
  }
  void handleFileList(event.dataTransfer?.files ?? null)
}

onBeforeUnmount(() => {
  activeTasks.forEach((task) => task.abort())
  activeTasks.clear()
})
</script>

<style scoped lang="scss">
.import-audio-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.import-audio-modal {
  width: 640px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);
  max-height: min(86vh, 640px);
  overflow: auto;
}

.import-audio-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #000;
  }
}

.import-audio-close-btn {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: #f4f4f4;
  }
}

.import-audio-dropzone {
  margin: 0px 20px 20px;
  height: 289px;
  border: 1px dashed #0075ff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f5f9ff;
  }

  &.is-dragging {
    background: #e8f2ff;
  }
}

.drop-icon {
  width: auto;
  height: 50px;
}

.drop-text {
  margin-top: 10px;
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #000;
  flex-wrap: wrap;
  justify-content: center;
}

.drop-link {
  color: #0075ff;
}

.drop-formats {
  margin-top: 10px;
  color: #9a9a9a;
  font-size: 14px;
}

.hidden-input {
  display: none;
}

.import-audio-file-list {
  margin: 0 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 240px;
  overflow-y: auto;
}

.import-audio-file-row {
  display: flex;
  gap: 12px;
}

.file-icon {
  width: auto;
  height: 40px;
}

.file-main {
  flex: 1;
}

.file-name {
  font-weight: 600;
  color: #000;
}

.progress-bar {
  margin-top: 10px;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #e4e3e3;
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    background: #0075ff;
    transition: width 0.2s ease;
  }
}

.file-progress-text,
.file-status-success,
.file-status-error {
  margin-top: 10px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.file-progress-text {
  color: #9a9a9a;
}

.file-status-success {
  color: #00d79b;
}

.file-status-error {
  color: #f13e33;
}

.status-icon {
}

@media (max-width: 768px) {
  .import-audio-overlay {
    padding: 12px;
    align-items: flex-start;
    overflow-y: auto;
  }

  .import-audio-modal {
    width: 100%;
    max-height: none;
    margin: 16px 0;
  }

  .import-audio-header {
    height: 64px;
    padding: 0 14px;
  }

  .import-audio-dropzone {
    margin: 14px;
    height: 190px;
    padding: 12px;
  }

  .drop-text {
    font-size: 15px;
  }

  .drop-formats {
    font-size: 12px;
    line-height: 1.5;
  }

  .import-audio-file-list {
    margin: 0 14px 14px;
  }
}
</style>
